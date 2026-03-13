/**
 * events.ts — Thin event bus so route handlers can emit Socket.io events
 * without importing the server instance directly.
 */
import { EventEmitter } from 'events';

export const choreEvents = new EventEmitter();

export function broadcastChoreEvent(type: string, payload: Record<string, unknown>): void {
  choreEvents.emit('chore:event', { type, payload, ts: new Date().toISOString() });
}
