/**
 * SafeOS API Server
 *
 * Express server with WebSocket support for real-time monitoring.
 *
 * @module api/server
 */

import express, { type Express, type Request, type Response } from 'express';
import { createServer, type Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { getSafeOSDatabase, runMigrations } from '../db/index.js';
import { getDefaultOllamaClient } from '../lib/ollama/client.js';
import { getDefaultStreamManager } from '../lib/streams/manager.js';
import { getDefaultAnalysisQueue } from '../queues/analysis-queue.js';
import { getDefaultSignalingServer } from '../lib/webrtc/signaling.js';
import type { SignalingMessage } from '../lib/webrtc/signaling.js';

// Import routes
import {
  streamsRouter,
  alertsRouter,
  profilesRouter,
  systemRouter,
  analysisRouter,
  notificationsRouter,
  reviewRouter,
} from './routes/index.js';

// =============================================================================
// Types
// =============================================================================

export interface ServerConfig {
  port: number;
  host: string;
  corsOrigins?: string[];
}

export interface WSMessage {
  type: string;
  payload?: any;
  streamId?: string;
  peerId?: string;
}

// =============================================================================
// Server Class
// =============================================================================

export class SafeOSServer {
  private app: Express;
  private server: Server;
  private wss: WebSocketServer;
  private config: ServerConfig;
  private clients: Map<WebSocket, { streamId?: string; peerId?: string }> = new Map();

  constructor(config?: Partial<ServerConfig>) {
    this.config = {
      port: parseInt(process.env['PORT'] || '3000', 10),
      host: process.env['HOST'] || '0.0.0.0',
      corsOrigins: process.env['CORS_ORIGINS']?.split(',') || ['*'],
      ...config,
    };

    this.app = express();
    this.server = createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  // ---------------------------------------------------------------------------
  // Setup Methods
  // ---------------------------------------------------------------------------

  private setupMiddleware(): void {
    // CORS
    this.app.use(
      cors({
        origin: this.config.corsOrigins,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      })
    );

    // JSON parsing
    this.app.use(express.json({ limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        if (process.env['NODE_ENV'] !== 'production') {
          console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
        }
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // API routes
    this.app.use('/api/streams', streamsRouter);
    this.app.use('/api/alerts', alertsRouter);
    this.app.use('/api/profiles', profilesRouter);
    this.app.use('/api/system', systemRouter);
    this.app.use('/api/analysis', analysisRouter);
    this.app.use('/api/notifications', notificationsRouter);
    this.app.use('/api/review', reviewRouter);

    // 404 handler
    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({ error: 'Not found' });
    });

    // Error handler
    this.app.use((err: Error, _req: Request, res: Response, _next: any) => {
      console.error('Server error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  private setupWebSocket(): void {
    const signaling = getDefaultSignalingServer();
    const streamManager = getDefaultStreamManager();
    const analysisQueue = getDefaultAnalysisQueue();

    this.wss.on('connection', (ws: WebSocket) => {
      // Register with signaling server
      const peerId = signaling.handleConnection(ws);
      this.clients.set(ws, { peerId });

      ws.on('message', async (data: Buffer) => {
        try {
          const message: WSMessage = JSON.parse(data.toString());
          await this.handleWSMessage(ws, message, signaling, streamManager, analysisQueue);
        } catch (error) {
          console.error('WebSocket message error:', error);
          ws.send(JSON.stringify({ type: 'error', payload: { error: 'Invalid message' } }));
        }
      });

      ws.on('close', () => {
        signaling.handleDisconnection(ws);
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      // Send welcome message
      ws.send(JSON.stringify({ type: 'connected', payload: { peerId } }));
    });
  }

  private async handleWSMessage(
    ws: WebSocket,
    message: WSMessage,
    signaling: ReturnType<typeof getDefaultSignalingServer>,
    streamManager: ReturnType<typeof getDefaultStreamManager>,
    analysisQueue: ReturnType<typeof getDefaultAnalysisQueue>
  ): Promise<void> {
    const clientData = this.clients.get(ws);

    switch (message.type) {
      // Signaling messages
      case 'join-room':
      case 'leave-room':
      case 'offer':
      case 'answer':
      case 'ice-candidate':
      case 'room-info':
        signaling.handleMessage(ws, message as SignalingMessage);
        break;

      // Stream management
      case 'start-stream':
        const stream = await streamManager.createStream({
          scenario: message.payload?.scenario || 'baby',
          userId: message.payload?.userId,
        });
        if (clientData) {
          clientData.streamId = stream.id;
        }
        streamManager.attachSocket(stream.id, ws as any);
        ws.send(JSON.stringify({ type: 'stream-started', payload: { streamId: stream.id } }));
        break;

      case 'stop-stream':
        if (clientData?.streamId) {
          await streamManager.endStream(clientData.streamId);
          clientData.streamId = undefined;
        }
        ws.send(JSON.stringify({ type: 'stream-stopped' }));
        break;

      // Frame analysis
      case 'frame':
        if (clientData?.streamId && message.payload?.frame) {
          const stream = streamManager.getStream(clientData.streamId);
          if (stream) {
            streamManager.incrementFrameCount(clientData.streamId);
            streamManager.updatePing(clientData.streamId);

            // Queue for analysis if motion/audio above threshold
            if (message.payload.motionScore > 30 || message.payload.audioLevel > 30) {
              analysisQueue.enqueue({
                streamId: clientData.streamId,
                scenario: stream.scenario,
                frameData: message.payload.frame,
                motionScore: message.payload.motionScore || 0,
                audioLevel: message.payload.audioLevel || 0,
              });
            }
          }
        }
        break;

      // Ping
      case 'ping':
        if (clientData?.streamId) {
          streamManager.updatePing(clientData.streamId);
        }
        ws.send(JSON.stringify({ type: 'pong', payload: { timestamp: Date.now() } }));
        break;

      default:
        ws.send(JSON.stringify({ type: 'error', payload: { error: 'Unknown message type' } }));
    }
  }

  // ---------------------------------------------------------------------------
  // Public Methods
  // ---------------------------------------------------------------------------

  /**
   * Start the server
   */
  async start(): Promise<void> {
    // Initialize database
    const db = await getSafeOSDatabase();
    await runMigrations(db);
    console.log('Database initialized');

    // Check Ollama
    const ollama = getDefaultOllamaClient();
    if (await ollama.isHealthy()) {
      console.log('Ollama is healthy');
      const result = await ollama.ensureModels();
      console.log('Models:', result);
    } else {
      console.warn('Ollama is not available - will use cloud fallback');
    }

    // Start analysis queue
    const queue = getDefaultAnalysisQueue();
    queue.start();
    console.log('Analysis queue started');

    // Start HTTP server
    return new Promise((resolve) => {
      this.server.listen(this.config.port, this.config.host, () => {
        console.log(`SafeOS server running at http://${this.config.host}:${this.config.port}`);
        resolve();
      });
    });
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    // Stop queue
    const queue = getDefaultAnalysisQueue();
    queue.stop();

    // Close all WebSocket connections
    for (const [ws] of this.clients) {
      ws.close();
    }

    // Stop stream manager
    const streamManager = getDefaultStreamManager();
    await streamManager.shutdown();

    // Close server
    return new Promise((resolve, reject) => {
      this.server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(message: WSMessage): void {
    const data = JSON.stringify(message);
    for (const [ws] of this.clients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    }
  }

  /**
   * Broadcast to clients watching a specific stream
   */
  broadcastToStream(streamId: string, message: WSMessage): void {
    const data = JSON.stringify(message);
    for (const [ws, clientData] of this.clients) {
      if (ws.readyState === WebSocket.OPEN && clientData.streamId === streamId) {
        ws.send(data);
      }
    }
  }

  /**
   * Get Express app (for testing)
   */
  getApp(): Express {
    return this.app;
  }
}

// =============================================================================
// Main Entry Point
// =============================================================================

async function main(): Promise<void> {
  const server = new SafeOSServer();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nShutting down...');
    await server.stop();
    process.exit(0);
  });

  await server.start();
}

// Run if executed directly
if (process.argv[1]?.includes('server')) {
  main().catch(console.error);
}

export { SafeOSServer };
export default SafeOSServer;
