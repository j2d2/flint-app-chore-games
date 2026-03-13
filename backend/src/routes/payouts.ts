/**
 * routes/payouts.ts — parent-approved payout flow.
 *
 * A payout:
 *   1. Records the amount paid to a kid
 *   2. Resets the kid's balance to 0 (or partial — parent decides)
 *   3. Emits a Socket.io event so the UI updates in real-time
 */
import { Router, Request, Response } from 'express';
import { db, generateId } from '../db';
import { broadcastChoreEvent } from '../events';

export const payoutsRouter = Router();

// GET /api/payouts — list all payouts, newest first
payoutsRouter.get('/', (_req: Request, res: Response) => {
  try {
    const payouts = db.prepare(`
      SELECT p.*, k.name as kid_name, k.avatar as kid_avatar
      FROM payouts p
      JOIN kids k ON k.id = p.kid_id
      ORDER BY p.paid_at DESC
      LIMIT 100
    `).all();
    res.json(payouts);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/payouts/kid/:kidId — payout history for one kid
payoutsRouter.get('/kid/:kidId', (req: Request, res: Response) => {
  try {
    const payouts = db.prepare(
      `SELECT * FROM payouts WHERE kid_id = ? ORDER BY paid_at DESC`
    ).all(req.params.kidId);
    res.json(payouts);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/payouts — record a payout and reset balance
payoutsRouter.post('/', (req: Request, res: Response) => {
  try {
    const { kid_id, amount, note, reset_balance = true } =
      req.body as { kid_id?: string; amount?: number; note?: string; reset_balance?: boolean };

    if (!kid_id) { res.status(400).json({ error: 'kid_id is required' }); return; }

    const kid = db.prepare(`SELECT * FROM kids WHERE id = ?`)
      .get(kid_id) as { id: string; name: string; balance: number } | undefined;
    if (!kid) { res.status(404).json({ error: 'Kid not found' }); return; }

    const payoutAmount = amount ?? kid.balance;
    if (payoutAmount <= 0) { res.status(400).json({ error: 'amount must be positive' }); return; }

    const payoutTx = db.transaction(() => {
      const id = generateId();
      db.prepare(`INSERT INTO payouts (id, kid_id, amount, note) VALUES (?, ?, ?, ?)`)
        .run(id, kid_id, payoutAmount, note ?? null);
      if (reset_balance) {
        db.prepare(`UPDATE kids SET balance = 0 WHERE id = ?`).run(kid_id);
      } else {
        db.prepare(`UPDATE kids SET balance = balance - ? WHERE id = ?`).run(payoutAmount, kid_id);
      }
      return db.prepare(`SELECT * FROM payouts WHERE id = ?`).get(id);
    });

    const payout = payoutTx();
    broadcastChoreEvent('payout:recorded', { kid_id, kid_name: kid.name, amount: payoutAmount });
    res.status(201).json(payout);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
