/**
 * routes/logs.ts — Chore completion logs + streak logic.
 *
 * Streak rules:
 *   - A kid earns +1 streak for each calendar day they complete at least 1 chore.
 *   - If a day is missed with at least one assigned daily chore, streak resets to 0.
 *   - Streak is updated on mark-done and recalculated on each stats request.
 */
import { Router, Request, Response } from 'express';
import { db, generateId, todayStr } from '../db';
import { broadcastChoreEvent } from '../events';

export const logsRouter = Router();

// GET /api/logs/today  — all chore logs for today, with chore and kid info
logsRouter.get('/today', (_req: Request, res: Response) => {
  try {
    const today = todayStr();
    // Materialise today's pending logs for any active chores not yet logged
    const activeChores = db.prepare(
      `SELECT c.id as chore_id, c.assigned_to as kid_id
       FROM chores c
       WHERE c.active = 1 AND c.frequency IN ('daily','weekly')
       AND (c.assigned_to IS NOT NULL OR c.assigned_to IS NULL)`
    ).all() as Array<{ chore_id: string; kid_id: string | null }>;

    const kids = db.prepare(`SELECT id FROM kids`).all() as Array<{ id: string }>;

    // For each active chore × kid combination, ensure a log row exists
    const ensureLog = db.prepare(
      `INSERT OR IGNORE INTO chore_logs (id, chore_id, kid_id, status, due_date)
       VALUES (?, ?, ?, 'pending', ?)`
    );
    const ensureTx = db.transaction(() => {
      for (const chore of activeChores) {
        const targets = chore.kid_id ? [{ id: chore.kid_id }] : kids;
        for (const kid of targets) {
          ensureLog.run(generateId(), chore.chore_id, kid.id, today);
        }
      }
    });
    ensureTx();

    const logs = db.prepare(`
      SELECT l.*, c.title, c.icon, c.value, c.frequency,
             k.name as kid_name, k.avatar as kid_avatar
      FROM chore_logs l
      JOIN chores c ON c.id = l.chore_id
      JOIN kids   k ON k.id = l.kid_id
      WHERE l.due_date = ?
      ORDER BY k.name, c.title
    `).all(today);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/logs — mark a chore done for a kid
logsRouter.post('/', (req: Request, res: Response) => {
  try {
    const { chore_id, kid_id } = req.body as { chore_id?: string; kid_id?: string };
    if (!chore_id || !kid_id) {
      res.status(400).json({ error: 'chore_id and kid_id are required' }); return;
    }

    const today = todayStr();
    const chore = db.prepare(`SELECT * FROM chores WHERE id = ? AND active = 1`)
      .get(chore_id) as { value: number; title: string; icon: string } | undefined;
    if (!chore) { res.status(404).json({ error: 'Chore not found or inactive' }); return; }

    const kid = db.prepare(`SELECT * FROM kids WHERE id = ?`)
      .get(kid_id) as { id: string; streak_days: number; last_chore_date: string | null } | undefined;
    if (!kid) { res.status(404).json({ error: 'Kid not found' }); return; }

    const markDoneTx = db.transaction(() => {
      // Upsert the log
      const existing = db.prepare(
        `SELECT id, status FROM chore_logs WHERE chore_id = ? AND kid_id = ? AND due_date = ?`
      ).get(chore_id, kid_id, today) as { id: string; status: string } | undefined;

      let logId: string;
      if (existing) {
        if (existing.status === 'done') return null; // already done
        db.prepare(`UPDATE chore_logs SET status = 'done', completed_at = datetime('now') WHERE id = ?`)
          .run(existing.id);
        logId = existing.id;
      } else {
        logId = generateId();
        db.prepare(
          `INSERT INTO chore_logs (id, chore_id, kid_id, status, due_date, completed_at)
           VALUES (?, ?, ?, 'done', ?, datetime('now'))`
        ).run(logId, chore_id, kid_id, today);
      }

      // Update kid balance + total_earned
      db.prepare(`UPDATE kids SET balance = balance + ?, total_earned = total_earned + ? WHERE id = ?`)
        .run(chore.value, chore.value, kid_id);

      // Streak: bump if last_chore_date was yesterday or today; else reset to 1
      const yesterday = (() => {
        const d = new Date(); d.setDate(d.getDate() - 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })();
      const isConsecutive = kid.last_chore_date === yesterday || kid.last_chore_date === today;
      const newStreak = isConsecutive ? (kid.last_chore_date === today ? kid.streak_days : kid.streak_days + 1) : 1;
      db.prepare(`UPDATE kids SET streak_days = ?, last_chore_date = ? WHERE id = ?`)
        .run(newStreak, today, kid_id);

      return db.prepare(`SELECT * FROM chore_logs WHERE id = ?`).get(logId);
    });

    const log = markDoneTx();
    if (!log) { res.status(409).json({ error: 'Chore already marked done today' }); return; }

    broadcastChoreEvent('chore:completed', {
      chore_id, kid_id,
      title: chore.title,
      icon: chore.icon,
      value: chore.value,
    });
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
