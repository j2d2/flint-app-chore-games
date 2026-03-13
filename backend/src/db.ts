/**
 * db.ts — SQLite database layer for Chore Games.
 * Uses better-sqlite3 (synchronous API — ideal for this single-process server).
 *
 * Schema:
 *   kids           — family members who do chores
 *   chores         — reusable chore definitions
 *   chore_logs     — completion records (one per due-date per kid)
 *   rewards        — redeemable reward catalog
 *   reward_redemptions — when a kid redeems a reward
 *   payouts        — parent-approved payout events (balance resets)
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH ?? './chore-games.db';
const resolvedPath = path.resolve(DB_PATH);

// Ensure parent directory exists
fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

export const db = new Database(resolvedPath);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ---------------------------------------------------------------------------
// Schema migrations
// ---------------------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS kids (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    avatar      TEXT NOT NULL DEFAULT '🧒',
    total_earned REAL NOT NULL DEFAULT 0,
    balance      REAL NOT NULL DEFAULT 0,
    streak_days  INTEGER NOT NULL DEFAULT 0,
    last_chore_date TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS chores (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT,
    value       REAL NOT NULL DEFAULT 0.25,
    frequency   TEXT NOT NULL DEFAULT 'daily' CHECK(frequency IN ('daily','weekly','one-off')),
    icon        TEXT NOT NULL DEFAULT '⭐',
    assigned_to TEXT,
    active      INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(assigned_to) REFERENCES kids(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS chore_logs (
    id          TEXT PRIMARY KEY,
    chore_id    TEXT NOT NULL,
    kid_id      TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','done','skipped')),
    due_date    TEXT NOT NULL,
    completed_at TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(chore_id) REFERENCES chores(id) ON DELETE CASCADE,
    FOREIGN KEY(kid_id)   REFERENCES kids(id)   ON DELETE CASCADE,
    UNIQUE(chore_id, kid_id, due_date)
  );

  CREATE TABLE IF NOT EXISTS rewards (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT,
    cost        REAL NOT NULL DEFAULT 1.00,
    icon        TEXT NOT NULL DEFAULT '🎁',
    active      INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reward_redemptions (
    id          TEXT PRIMARY KEY,
    reward_id   TEXT NOT NULL,
    kid_id      TEXT NOT NULL,
    cost        REAL NOT NULL,
    redeemed_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(reward_id) REFERENCES rewards(id) ON DELETE RESTRICT,
    FOREIGN KEY(kid_id)    REFERENCES kids(id)    ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS payouts (
    id          TEXT PRIMARY KEY,
    kid_id      TEXT NOT NULL,
    amount      REAL NOT NULL,
    note        TEXT,
    paid_at     TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(kid_id) REFERENCES kids(id) ON DELETE CASCADE
  );
`);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Return today's date as YYYY-MM-DD in local time. */
export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Monday of the current week as YYYY-MM-DD. */
export function weekStartStr(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
