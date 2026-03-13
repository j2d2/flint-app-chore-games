/**
 * routes/rewards.ts — CRUD for reward catalog.
 */
import { Router, Request, Response } from 'express';
import { db, generateId } from '../db';

export const rewardsRouter = Router();

// GET /api/rewards
rewardsRouter.get('/', (_req: Request, res: Response) => {
  try {
    const rewards = db.prepare(`SELECT * FROM rewards ORDER BY cost, title`).all();
    res.json(rewards);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/rewards/:id
rewardsRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const reward = db.prepare(`SELECT * FROM rewards WHERE id = ?`).get(req.params.id);
    if (!reward) { res.status(404).json({ error: 'Reward not found' }); return; }
    res.json(reward);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/rewards
rewardsRouter.post('/', (req: Request, res: Response) => {
  try {
    const { title, description, cost = 1.0, icon = '🎁' } =
      req.body as { title?: string; description?: string; cost?: number; icon?: string };
    if (!title?.trim()) { res.status(400).json({ error: 'title is required' }); return; }
    if (cost <= 0) { res.status(400).json({ error: 'cost must be positive' }); return; }

    const id = generateId();
    db.prepare(`INSERT INTO rewards (id, title, description, cost, icon) VALUES (?, ?, ?, ?, ?)`)
      .run(id, title.trim(), description ?? null, cost, icon);
    res.status(201).json(db.prepare(`SELECT * FROM rewards WHERE id = ?`).get(id));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// PATCH /api/rewards/:id
rewardsRouter.patch('/:id', (req: Request, res: Response) => {
  try {
    const existing = db.prepare(`SELECT id FROM rewards WHERE id = ?`).get(req.params.id);
    if (!existing) { res.status(404).json({ error: 'Reward not found' }); return; }

    const allowed = ['title', 'description', 'cost', 'icon', 'active'] as const;
    const updates: string[] = [];
    const values: unknown[] = [];
    for (const key of allowed) {
      if (key in req.body) { updates.push(`${key} = ?`); values.push((req.body as Record<string, unknown>)[key]); }
    }
    if (!updates.length) { res.status(400).json({ error: 'No valid fields to update' }); return; }

    values.push(req.params.id);
    db.prepare(`UPDATE rewards SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    res.json(db.prepare(`SELECT * FROM rewards WHERE id = ?`).get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// DELETE /api/rewards/:id
rewardsRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    const result = db.prepare(`DELETE FROM rewards WHERE id = ?`).run(req.params.id);
    if (result.changes === 0) { res.status(404).json({ error: 'Reward not found' }); return; }
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/rewards/redeem
rewardsRouter.post('/redeem', (req: Request, res: Response) => {
  try {
    const { reward_id, kid_id } = req.body as { reward_id?: string; kid_id?: string };
    if (!reward_id || !kid_id) { res.status(400).json({ error: 'reward_id and kid_id are required' }); return; }

    const reward = db.prepare(`SELECT * FROM rewards WHERE id = ? AND active = 1`)
      .get(reward_id) as { cost: number } | undefined;
    if (!reward) { res.status(404).json({ error: 'Reward not found or inactive' }); return; }

    const kid = db.prepare(`SELECT * FROM kids WHERE id = ?`)
      .get(kid_id) as { balance: number } | undefined;
    if (!kid) { res.status(404).json({ error: 'Kid not found' }); return; }

    if (kid.balance < reward.cost) {
      res.status(422).json({ error: 'Insufficient balance', balance: kid.balance, cost: reward.cost });
      return;
    }

    const redeemTx = db.transaction(() => {
      const id = generateId();
      db.prepare(
        `INSERT INTO reward_redemptions (id, reward_id, kid_id, cost) VALUES (?, ?, ?, ?)`
      ).run(id, reward_id, kid_id, reward.cost);
      db.prepare(`UPDATE kids SET balance = balance - ? WHERE id = ?`).run(reward.cost, kid_id);
      return db.prepare(`SELECT * FROM reward_redemptions WHERE id = ?`).get(id);
    });

    const redemption = redeemTx();
    res.status(201).json(redemption);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
