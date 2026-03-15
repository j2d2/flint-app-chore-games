/**
 * routes/haikus.ts — Haiku leaderboard routes for Chore Games backend.
 *
 * Reads directly from ~/.openclaw/haiku.db (shared with Flint MCP / dashboard).
 * All writes are vote casts only — haiku entries are managed by Flint tools.
 *
 * Routes:
 *   GET  /api/haikus?sort_by=votes|newest
 *   GET  /api/haikus/pair?voter_id=<name>
 *   POST /api/haikus/:id/vote   { voter_id, chore_id? }
 */
import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';

export const haikusRouter = Router();

// ---------------------------------------------------------------------------
// DB connection — separate from chore-games.db, read from the shared Flint DB
// ---------------------------------------------------------------------------
const HAIKU_DB_PATH = process.env.HAIKU_DB_PATH
  ?? path.join(os.homedir(), '.openclaw', 'haiku.db');

function getHaikuDb(): Database.Database {
  return new Database(HAIKU_DB_PATH, { readonly: false });
}

// ---------------------------------------------------------------------------
// GET /api/haikus?sort_by=votes|newest
// ---------------------------------------------------------------------------
haikusRouter.get('/', (req: Request, res: Response) => {
  try {
    const sortBy = req.query['sort_by'] === 'newest' ? 'created_at' : 'vote_count';
    const order  = sortBy === 'vote_count' ? 'DESC' : 'DESC';
    const db = getHaikuDb();
    const haikus = db.prepare(
      `SELECT id, haiku_text, source_doc, session_date, vote_count, created_at
       FROM haiku_votes
       ORDER BY ${sortBy} ${order}`
    ).all();
    db.close();
    res.json({ haikus, total: haikus.length });
  } catch (err) {
    // haiku.db may not exist yet — return empty list gracefully
    res.json({ haikus: [], total: 0 });
  }
});

// ---------------------------------------------------------------------------
// GET /api/haikus/pair?voter_id=<name>
// Returns two haikus the voter hasn't voted on yet.
// Falls back to any two random haikus if they've voted on everything.
// ---------------------------------------------------------------------------
haikusRouter.get('/pair', (req: Request, res: Response) => {
  const voterId = String(req.query['voter_id'] ?? '');
  if (!voterId) {
    res.status(400).json({ error: 'voter_id is required' });
    return;
  }
  try {
    const db = getHaikuDb();
    let pair = db.prepare(
      `SELECT id, haiku_text, source_doc, session_date, vote_count, created_at
       FROM haiku_votes
       WHERE id NOT IN (
         SELECT haiku_id FROM haiku_vote_log WHERE voter_id = ?
       )
       ORDER BY RANDOM()
       LIMIT 2`
    ).all(voterId) as any[];

    // Fallback: voter has seen everything — return any two random haikus
    if (pair.length < 2) {
      pair = db.prepare(
        `SELECT id, haiku_text, source_doc, session_date, vote_count, created_at
         FROM haiku_votes
         ORDER BY RANDOM()
         LIMIT 2`
      ).all() as any[];
    }
    db.close();

    if (pair.length < 2) {
      res.status(404).json({ error: 'Not enough haikus to form a pair' });
      return;
    }
    res.json({ a: pair[0], b: pair[1] });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/haikus/:id/vote   body: { voter_id: string, chore_id?: string }
// ---------------------------------------------------------------------------
haikusRouter.post('/:id/vote', (req: Request, res: Response) => {
  const haikuId = req.params['id'];
  const { voter_id, chore_id } = req.body as { voter_id?: string; chore_id?: string };

  if (!voter_id) {
    res.status(400).json({ error: 'voter_id is required' });
    return;
  }

  try {
    const db = getHaikuDb();

    // Verify haiku exists
    const haiku = db.prepare(`SELECT id, vote_count FROM haiku_votes WHERE id = ?`).get(haikuId) as any;
    if (!haiku) {
      db.close();
      res.status(404).json({ error: 'Haiku not found' });
      return;
    }

    // Check for duplicate vote (same voter, same haiku)
    const existing = db.prepare(
      `SELECT id FROM haiku_vote_log WHERE haiku_id = ? AND voter_id = ?`
    ).get(haikuId, voter_id);
    if (existing) {
      db.close();
      res.status(409).json({ error: 'Already voted on this haiku' });
      return;
    }

    // Cast vote in a transaction
    const castVote = db.transaction(() => {
      db.prepare(
        `UPDATE haiku_votes SET vote_count = vote_count + 1 WHERE id = ?`
      ).run(haikuId);
      db.prepare(
        `INSERT INTO haiku_vote_log (id, haiku_id, voter_id, chore_id, voted_at)
         VALUES (?, ?, ?, ?, unixepoch('now', 'subsec'))`
      ).run(randomUUID(), haikuId, voter_id, chore_id ?? null);
    });
    castVote();

    const updated = db.prepare(`SELECT id, haiku_text, vote_count FROM haiku_votes WHERE id = ?`).get(haikuId);
    db.close();

    res.json({ success: true, haiku: updated });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
