/**
 * routes/chores.ts — CRUD for chore definitions.
 */
import { Router, Request, Response } from 'express';
import { db, generateId } from '../db';

export const choresRouter = Router();

// GET /api/chores
choresRouter.get('/', (_req: Request, res: Response) => {
  try {
    const chores = db.prepare(`SELECT * FROM chores ORDER BY title`).all();
    res.json(chores);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/chores/:id
choresRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const chore = db.prepare(`SELECT * FROM chores WHERE id = ?`).get(req.params.id);
    if (!chore) { res.status(404).json({ error: 'Chore not found' }); return; }
    res.json(chore);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/chores
choresRouter.post('/', (req: Request, res: Response) => {
  try {
    const { title, description, value = 0.25, frequency = 'daily', icon = '⭐', assigned_to } =
      req.body as {
        title?: string; description?: string; value?: number;
        frequency?: string; icon?: string; assigned_to?: string | null;
      };
    if (!title?.trim()) { res.status(400).json({ error: 'title is required' }); return; }
    if (!['daily', 'weekly', 'one-off'].includes(frequency)) {
      res.status(400).json({ error: 'frequency must be daily, weekly, or one-off' }); return;
    }

    const id = generateId();
    db.prepare(
      `INSERT INTO chores (id, title, description, value, frequency, icon, assigned_to)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, title.trim(), description ?? null, value, frequency, icon, assigned_to ?? null);
    res.status(201).json(db.prepare(`SELECT * FROM chores WHERE id = ?`).get(id));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// PATCH /api/chores/:id
choresRouter.patch('/:id', (req: Request, res: Response) => {
  try {
    const existing = db.prepare(`SELECT id FROM chores WHERE id = ?`).get(req.params.id);
    if (!existing) { res.status(404).json({ error: 'Chore not found' }); return; }

    const allowed = ['title', 'description', 'value', 'frequency', 'icon', 'assigned_to', 'active'] as const;
    const updates: string[] = [];
    const values: unknown[] = [];
    for (const key of allowed) {
      if (key in req.body) { updates.push(`${key} = ?`); values.push((req.body as Record<string, unknown>)[key]); }
    }
    if (!updates.length) { res.status(400).json({ error: 'No valid fields to update' }); return; }

    values.push(req.params.id);
    db.prepare(`UPDATE chores SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    res.json(db.prepare(`SELECT * FROM chores WHERE id = ?`).get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// DELETE /api/chores/:id
choresRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    const result = db.prepare(`DELETE FROM chores WHERE id = ?`).run(req.params.id);
    if (result.changes === 0) { res.status(404).json({ error: 'Chore not found' }); return; }
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
