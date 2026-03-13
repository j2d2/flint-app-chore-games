/**
 * index.ts — Express + Socket.io backend for Chore Games.
 *
 * Architecture:
 *   Ionic PWA (:18330) ←HTTP+WS→ Express (:18340) ←SQLite→ chore-games.db
 *
 * All chore data lives in a local SQLite file (no dependency on Flint MCP).
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIoServer } from 'socket.io';

import { kidsRouter }    from './routes/kids';
import { choresRouter }  from './routes/chores';
import { rewardsRouter } from './routes/rewards';
import { logsRouter }    from './routes/logs';
import { statsRouter }   from './routes/stats';
import { payoutsRouter } from './routes/payouts';
import { choreEvents }   from './events';

const PORT = parseInt(process.env.PORT ?? '18340', 10);
const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? 'http://localhost:18330,capacitor://localhost')
  .split(',')
  .map(o => o.trim());

const app = express();
const httpServer = createServer(app);

// ---------------------------------------------------------------------------
// Socket.io
// ---------------------------------------------------------------------------
const io = new SocketIoServer(httpServer, {
  cors: { origin: CORS_ORIGINS, methods: ['GET', 'POST'] },
});

// Forward choreEvents → all connected WS clients
choreEvents.on('chore:event', (evt) => {
  io.emit('chore:event', evt);
});

io.on('connection', (socket) => {
  console.log(`[socket.io] client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[socket.io] client disconnected: ${socket.id}`);
  });
});

// ---------------------------------------------------------------------------
// Express middleware
// ---------------------------------------------------------------------------
app.use(cors({ origin: CORS_ORIGINS }));
app.use(express.json({ limit: '64kb' }));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use('/api/kids',    kidsRouter);
app.use('/api/chores',  choresRouter);
app.use('/api/rewards', rewardsRouter);
app.use('/api/logs',    logsRouter);
app.use('/api/stats',   statsRouter);
app.use('/api/payouts', payoutsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString(), port: PORT });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
httpServer.listen(PORT, () => {
  console.log(`[chore-games] backend ready on http://localhost:${PORT}`);
});
