/**
 * routes/stats.ts — dashboard stats, weekly earnings.
 */
import { Router, Request, Response } from 'express';
import { db, todayStr, weekStartStr } from '../db';

export const statsRouter = Router();

// GET /api/stats — aggregate dashboard stats
statsRouter.get('/', (_req: Request, res: Response) => {
  try {
    const today = todayStr();
    const weekStart = weekStartStr();

    const totalChores = (db.prepare(`SELECT COUNT(*) as n FROM chore_logs WHERE due_date = ?`).get(today) as { n: number }).n;
    const doneChores  = (db.prepare(`SELECT COUNT(*) as n FROM chore_logs WHERE due_date = ? AND status = 'done'`).get(today) as { n: number }).n;
    const weeklyEarned = (db.prepare(
      `SELECT COALESCE(SUM(c.value), 0) as total
       FROM chore_logs l
       JOIN chores c ON c.id = l.chore_id
       WHERE l.status = 'done' AND l.due_date >= ?`
    ).get(weekStart) as { total: number }).total;
    const activePlayers = (db.prepare(`SELECT COUNT(*) as n FROM kids`).get() as { n: number }).n;

    // Per-kid streak summary
    const kids = db.prepare(`SELECT id, name, avatar, streak_days, balance, total_earned FROM kids ORDER BY total_earned DESC`).all();

    res.json({
      today_total: totalChores,
      today_done: doneChores,
      weekly_earned: weeklyEarned,
      active_players: activePlayers,
      kids,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/stats/earnings/:kidId/week — weekly earnings breakdown for one kid
statsRouter.get('/earnings/:kidId/week', (req: Request, res: Response) => {
  try {
    const weekStart = weekStartStr();
    const rows = db.prepare(`
      SELECT l.due_date, SUM(c.value) as earned, COUNT(*) as chores_done
      FROM chore_logs l
      JOIN chores c ON c.id = l.chore_id
      WHERE l.kid_id = ? AND l.status = 'done' AND l.due_date >= ?
      GROUP BY l.due_date
      ORDER BY l.due_date
    `).all(req.params.kidId, weekStart);

    const total = (rows as Array<{ earned: number }>).reduce((s, r) => s + r.earned, 0);
    res.json({ kid_id: req.params.kidId, week_start: weekStart, days: rows, total_this_week: total });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
