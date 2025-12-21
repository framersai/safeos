/**
 * WebSocket Integration Tests
 *
 * Integration tests for WebSocket communication.
 *
 * @module tests/integration/websocket
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import WebSocket from 'ws';
import http from 'http';

// Mock database
vi.mock('../../src/db/index.js', () => ({
  getSafeOSDatabase: vi.fn().mockResolvedValue({
    run: vi.fn().mockResolvedValue({ changes: 1 }),
    all: vi.fn().mockResolvedValue([]),
    get: vi.fn().mockResolvedValue(null),
  }),
  generateId: vi.fn().mockReturnValue('test-id'),
  now: vi.fn().mockReturnValue(new Date().toISOString()),
}));

// =============================================================================
// Test Suite
// =============================================================================

describe('WebSocket Server', () => {
  let server: http.Server;
  let wss: WebSocket.Server;
  let port: number;

  beforeAll(async () => {
    // Create a simple WebSocket server for testing
    server = http.createServer();
    wss = new WebSocket.Server({ server });

    // Handle connections
    wss.on('connection', (ws) => {
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());

          // Echo back with acknowledgment
          ws.send(JSON.stringify({
            type: 'ack',
            originalType: message.type,
            timestamp: new Date().toISOString(),
          }));

          // Handle specific message types
          if (message.type === 'subscribe') {
            ws.send(JSON.stringify({
              type: 'subscribed',
              streamId: message.streamId,
            }));
          }

          if (message.type === 'frame') {
            ws.send(JSON.stringify({
              type: 'frame_received',
              streamId: message.streamId,
            }));
          }
        } catch (error) {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
        }
      });

      // Send welcome message
      ws.send(JSON.stringify({ type: 'connected' }));
    });

    // Start server on random port
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const address = server.address() as any;
        port = address.port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    // Close all connections
    wss.clients.forEach((client) => client.close());

    await new Promise<void>((resolve) => {
      wss.close(() => {
        server.close(() => resolve());
      });
    });
  });

  // ===========================================================================
  // Connection Tests
  // ===========================================================================

  describe('connection', () => {
    it('should connect successfully', async () => {
      const ws = new WebSocket(`ws://localhost:${port}`);

      await new Promise<void>((resolve, reject) => {
        ws.on('open', () => {
          expect(ws.readyState).toBe(WebSocket.OPEN);
          ws.close();
          resolve();
        });
        ws.on('error', reject);
      });
    });

    it('should receive welcome message on connect', async () => {
      const ws = new WebSocket(`ws://localhost:${port}`);

      const message = await new Promise<any>((resolve, reject) => {
        ws.on('message', (data) => {
          resolve(JSON.parse(data.toString()));
          ws.close();
        });
        ws.on('error', reject);
      });

      expect(message.type).toBe('connected');
    });
  });

  // ===========================================================================
  // Message Tests
  // ===========================================================================

  describe('messaging', () => {
    it('should acknowledge received messages', async () => {
      const ws = new WebSocket(`ws://localhost:${port}`);

      await new Promise<void>((resolve) => {
        ws.on('open', () => resolve());
      });

      // Skip welcome message
      await new Promise<void>((resolve) => {
        ws.once('message', () => resolve());
      });

      // Send a message
      ws.send(JSON.stringify({ type: 'ping' }));

      const response = await new Promise<any>((resolve) => {
        ws.on('message', (data) => {
          resolve(JSON.parse(data.toString()));
          ws.close();
        });
      });

      expect(response.type).toBe('ack');
      expect(response.originalType).toBe('ping');
    });

    it('should handle subscribe messages', async () => {
      const ws = new WebSocket(`ws://localhost:${port}`);

      await new Promise<void>((resolve) => {
        ws.on('open', () => resolve());
      });

      // Skip welcome message
      await new Promise<void>((resolve) => {
        ws.once('message', () => resolve());
      });

      // Send subscribe message
      ws.send(JSON.stringify({
        type: 'subscribe',
        streamId: 'stream-123',
      }));

      // Collect responses
      const responses: any[] = [];
      await new Promise<void>((resolve) => {
        ws.on('message', (data) => {
          responses.push(JSON.parse(data.toString()));
          if (responses.length >= 2) {
            ws.close();
            resolve();
          }
        });
      });

      const subscribed = responses.find(r => r.type === 'subscribed');
      expect(subscribed).toBeDefined();
      expect(subscribed.streamId).toBe('stream-123');
    });

    it('should handle frame messages', async () => {
      const ws = new WebSocket(`ws://localhost:${port}`);

      await new Promise<void>((resolve) => {
        ws.on('open', () => resolve());
      });

      // Skip welcome message
      await new Promise<void>((resolve) => {
        ws.once('message', () => resolve());
      });

      // Send frame message
      const mockFrame = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      ws.send(JSON.stringify({
        type: 'frame',
        streamId: 'stream-123',
        data: mockFrame,
        motionScore: 0.5,
        audioLevel: 0.3,
      }));

      // Collect responses
      const responses: any[] = [];
      await new Promise<void>((resolve) => {
        ws.on('message', (data) => {
          responses.push(JSON.parse(data.toString()));
          if (responses.length >= 2) {
            ws.close();
            resolve();
          }
        });
      });

      const frameReceived = responses.find(r => r.type === 'frame_received');
      expect(frameReceived).toBeDefined();
    });

    it('should handle invalid JSON gracefully', async () => {
      const ws = new WebSocket(`ws://localhost:${port}`);

      await new Promise<void>((resolve) => {
        ws.on('open', () => resolve());
      });

      // Skip welcome message
      await new Promise<void>((resolve) => {
        ws.once('message', () => resolve());
      });

      // Send invalid JSON
      ws.send('not-valid-json');

      const response = await new Promise<any>((resolve) => {
        ws.on('message', (data) => {
          resolve(JSON.parse(data.toString()));
          ws.close();
        });
      });

      expect(response.type).toBe('error');
    });
  });

  // ===========================================================================
  // Reconnection Tests
  // ===========================================================================

  describe('reconnection', () => {
    it('should allow reconnection after disconnect', async () => {
      // First connection
      const ws1 = new WebSocket(`ws://localhost:${port}`);
      await new Promise<void>((resolve) => {
        ws1.on('open', () => {
          ws1.close();
          resolve();
        });
      });

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Second connection
      const ws2 = new WebSocket(`ws://localhost:${port}`);
      const connected = await new Promise<boolean>((resolve) => {
        ws2.on('open', () => {
          resolve(true);
          ws2.close();
        });
        ws2.on('error', () => resolve(false));
      });

      expect(connected).toBe(true);
    });
  });

  // ===========================================================================
  // Multiple Client Tests
  // ===========================================================================

  describe('multiple clients', () => {
    it('should handle multiple concurrent connections', async () => {
      const clients: WebSocket[] = [];

      // Create multiple clients
      for (let i = 0; i < 5; i++) {
        const ws = new WebSocket(`ws://localhost:${port}`);
        clients.push(ws);
      }

      // Wait for all to connect
      await Promise.all(clients.map((ws) =>
        new Promise<void>((resolve) => {
          ws.on('open', () => resolve());
        })
      ));

      expect(wss.clients.size).toBe(5);

      // Close all clients
      clients.forEach((ws) => ws.close());
    });
  });
});








