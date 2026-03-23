/**
 * routes/auth.ts — PIN-based login for Chore Games.
 *
 * Each kid authenticates with their 6-digit birthday PIN (MMDDYY).
 * PINs are bcrypt-hashed in the kids table.
 *
 * POST /api/auth/pin-login  — {kid_id, pin} → {token, kid}
 */
import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../db';

const JWT_SECRET = process.env.JWT_SECRET ?? 'change-me-in-env';

export const authRouter = Router();

// POST /api/auth/pin-login
authRouter.post('/pin-login', async (req: Request, res: Response) => {
  const { kid_id, pin } = req.body as { kid_id?: string; pin?: string };

  if (!kid_id || !pin) {
    res.status(400).json({ error: 'kid_id and pin are required' });
    return;
  }

  if (!/^\d{6}$/.test(pin)) {
    res.status(400).json({ error: 'PIN must be exactly 6 digits' });
    return;
  }

  const kid = db.prepare('SELECT id, name, avatar, role, pin FROM kids WHERE id = ?').get(kid_id) as
    | { id: string; name: string; avatar: string; role: string; pin: string | null }
    | undefined;

  if (!kid) {
    res.status(404).json({ error: 'Kid not found' });
    return;
  }

  if (!kid.pin) {
    res.status(401).json({ error: 'PIN not set for this profile — ask a parent to set it in Settings' });
    return;
  }

  const valid = await bcrypt.compare(pin, kid.pin);
  if (!valid) {
    res.status(401).json({ error: 'Wrong PIN — try again' });
    return;
  }

  const token = jwt.sign(
    { kid_id: kid.id, name: kid.name, role: kid.role },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  res.json({ token, kid: { id: kid.id, name: kid.name, avatar: kid.avatar, role: kid.role } });
});
