/**
 * Streams Integration Tests
 *
 * Integration tests for stream management API endpoints.
 *
 * @module tests/integration/streams
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';

// Mock database before imports
vi.mock('../../src/db/index.js', () => {
  const streams = new Map();
  return {
    getSafeOSDatabase: vi.fn().mockResolvedValue({
      run: vi.fn().mockImplementation((sql: string, params: any[]) => {
        if (sql.includes('INSERT INTO streams')) {
          const id = params[0];
          streams.set(id, {
            id,
            name: params[1],
            scenario: params[2],
            status: 'connecting',
            created_at: new Date().toISOString(),
          });
          return { changes: 1 };
        }
        if (sql.includes('UPDATE streams')) {
          const id = params[params.length - 1];
          if (streams.has(id)) {
            const stream = streams.get(id);
            if (sql.includes('status')) {
              stream.status = params[0];
            }
            return { changes: 1 };
          }
          return { changes: 0 };
        }
        if (sql.includes('DELETE FROM streams')) {
          const id = params[0];
          streams.delete(id);
          return { changes: 1 };
        }
        return { changes: 0 };
      }),
      all: vi.fn().mockImplementation((sql: string) => {
        if (sql.includes('FROM streams')) {
          return Array.from(streams.values());
        }
        return [];
      }),
      get: vi.fn().mockImplementation((sql: string, params: any[]) => {
        if (sql.includes('FROM streams')) {
          return streams.get(params[0]) || null;
        }
        return null;
      }),
    }),
    generateId: vi.fn().mockImplementation(() => `stream-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`),
    now: vi.fn().mockReturnValue(new Date().toISOString()),
  };
});

import { streamsRouter } from '../../src/api/routes/streams.js';
import express from 'express';
import request from 'supertest';

// =============================================================================
// Test Setup
// =============================================================================

const app = express();
app.use(express.json());
app.use('/api/streams', streamsRouter);

// =============================================================================
// Test Suite
// =============================================================================

describe('Streams API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // GET /api/streams Tests
  // ===========================================================================

  describe('GET /api/streams', () => {
    it('should return empty array when no streams', async () => {
      const response = await request(app)
        .get('/api/streams')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return list of streams', async () => {
      // Create a stream first
      await request(app)
        .post('/api/streams')
        .send({ name: 'Test Camera', scenario: 'pet' });

      const response = await request(app)
        .get('/api/streams')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should support scenario filter', async () => {
      const response = await request(app)
        .get('/api/streams?scenario=pet')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  // ===========================================================================
  // POST /api/streams Tests
  // ===========================================================================

  describe('POST /api/streams', () => {
    it('should create new stream', async () => {
      const response = await request(app)
        .post('/api/streams')
        .send({
          name: 'Living Room Camera',
          scenario: 'pet',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('Living Room Camera');
      expect(response.body.data.scenario).toBe('pet');
    });

    it('should require name field', async () => {
      const response = await request(app)
        .post('/api/streams')
        .send({ scenario: 'pet' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('name');
    });

    it('should require scenario field', async () => {
      const response = await request(app)
        .post('/api/streams')
        .send({ name: 'Test Camera' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('scenario');
    });

    it('should validate scenario values', async () => {
      const response = await request(app)
        .post('/api/streams')
        .send({
          name: 'Test Camera',
          scenario: 'invalid-scenario',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should accept pet scenario', async () => {
      const response = await request(app)
        .post('/api/streams')
        .send({ name: 'Pet Cam', scenario: 'pet' })
        .expect(201);

      expect(response.body.data.scenario).toBe('pet');
    });

    it('should accept baby scenario', async () => {
      const response = await request(app)
        .post('/api/streams')
        .send({ name: 'Baby Cam', scenario: 'baby' })
        .expect(201);

      expect(response.body.data.scenario).toBe('baby');
    });

    it('should accept elderly scenario', async () => {
      const response = await request(app)
        .post('/api/streams')
        .send({ name: 'Elderly Cam', scenario: 'elderly' })
        .expect(201);

      expect(response.body.data.scenario).toBe('elderly');
    });
  });

  // ===========================================================================
  // GET /api/streams/:id Tests
  // ===========================================================================

  describe('GET /api/streams/:id', () => {
    it('should return stream by ID', async () => {
      // Create stream first
      const createResponse = await request(app)
        .post('/api/streams')
        .send({ name: 'Test Camera', scenario: 'pet' });

      const streamId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/api/streams/${streamId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(streamId);
    });

    it('should return 404 for non-existent stream', async () => {
      const response = await request(app)
        .get('/api/streams/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  // ===========================================================================
  // PATCH /api/streams/:id Tests
  // ===========================================================================

  describe('PATCH /api/streams/:id', () => {
    it('should update stream status', async () => {
      const createResponse = await request(app)
        .post('/api/streams')
        .send({ name: 'Test Camera', scenario: 'pet' });

      const streamId = createResponse.body.data.id;

      const response = await request(app)
        .patch(`/api/streams/${streamId}`)
        .send({ status: 'active' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('active');
    });

    it('should update stream name', async () => {
      const createResponse = await request(app)
        .post('/api/streams')
        .send({ name: 'Old Name', scenario: 'pet' });

      const streamId = createResponse.body.data.id;

      const response = await request(app)
        .patch(`/api/streams/${streamId}`)
        .send({ name: 'New Name' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Name');
    });
  });

  // ===========================================================================
  // DELETE /api/streams/:id Tests
  // ===========================================================================

  describe('DELETE /api/streams/:id', () => {
    it('should delete stream', async () => {
      const createResponse = await request(app)
        .post('/api/streams')
        .send({ name: 'To Delete', scenario: 'pet' });

      const streamId = createResponse.body.data.id;

      const deleteResponse = await request(app)
        .delete(`/api/streams/${streamId}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);

      // Verify stream is deleted
      await request(app)
        .get(`/api/streams/${streamId}`)
        .expect(404);
    });

    it('should return 404 for non-existent stream', async () => {
      const response = await request(app)
        .delete('/api/streams/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  // ===========================================================================
  // POST /api/streams/:id/pause Tests
  // ===========================================================================

  describe('POST /api/streams/:id/pause', () => {
    it('should pause active stream', async () => {
      const createResponse = await request(app)
        .post('/api/streams')
        .send({ name: 'Test Camera', scenario: 'pet' });

      const streamId = createResponse.body.data.id;

      // First activate
      await request(app)
        .patch(`/api/streams/${streamId}`)
        .send({ status: 'active' });

      // Then pause
      const response = await request(app)
        .post(`/api/streams/${streamId}/pause`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('paused');
    });
  });

  // ===========================================================================
  // POST /api/streams/:id/resume Tests
  // ===========================================================================

  describe('POST /api/streams/:id/resume', () => {
    it('should resume paused stream', async () => {
      const createResponse = await request(app)
        .post('/api/streams')
        .send({ name: 'Test Camera', scenario: 'pet' });

      const streamId = createResponse.body.data.id;

      // First pause
      await request(app)
        .post(`/api/streams/${streamId}/pause`);

      // Then resume
      const response = await request(app)
        .post(`/api/streams/${streamId}/resume`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('active');
    });
  });
});





