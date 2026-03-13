/**
 * routes/kids.ts — CRUD for kid profiles.
 */
import { Router, Request, Response } from 'express';
import { db, generateId } from '../db';

export const kidsRouter = Router();

// GET /api/kids
kidsRouter.get('/', (_req: Request, res: Response) => {
  try {
    const kids = db.prepare(`SELECT * FROM kids ORDER BY name`).all();
    res.json(kids);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/kids/:id
kidsRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const kid = db.prepare(`SELECT * FROM kids WHERE id = ?`).get(req.params.id);
    if (!kid) { res.status(404).json({ error: 'Kid not found' }); return; }
    res.json(kid);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/kids
kidsRouter.post('/', (req: Request, res: Response) => {
  try {
    const { name, avatar = '🧒' } = req.body as { name?: string; avatar?: string };
    if (!name?.trim()) { res.status(400).json({ error: 'name is required' }); return; }

    const id = generateId();
    db.prepare(`INSERT INTO kids (id, name, avatar) VALUES (?, ?, ?)`).run(id, name.trim(), avatar);
    const created = db.prepare(`SELECT * FROM kids WHERE id = ?`).get(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// PATCH /api/kids/:id
kidsRouter.patch('/:id', (req: Request, res: Response) => {
  try {
    const existing = db.prepare(`SELECT id FROM kids WHERE id = ?`).get(req.params.id);
    if (!existing) { res.status(404).json({ error: 'Kid not found' }); return; }

    const allowed = ['name', 'avatar'] as const;
    const updates: string[] = [];
    const values: unknown[] = [];
    for (const key of allowed) {
      if (key in req.body) { updates.push(`${key} = ?`); values.push((req.body as Record<string, unknown>)[key]); }
    }
    if (!updates.length) { res.status(400).json({ error: 'No valid fields to update' }); return; }

    values.push(req.params.id);
    db.prepare(`UPDATE kids SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    res.json(db.prepare(`SELECT * FROM kids WHERE id = ?`).get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// DELETE /api/kids/:id
kidsRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    const result = db.prepare(`DELETE FROM kids WHERE id = ?`).run(req.params.id);
    if (result.changes === 0) { res.status(404).json({ error: 'Kid not found' }); return; }
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
