/**
 * WebRTC Signaling Unit Tests
 *
 * Tests for the WebRTC signaling server.
 *
 * @module tests/unit/webrtc-signaling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SignalingServer } from '../../src/lib/webrtc/signaling.js';

// Mock WebSocket
class MockWebSocket {
  readyState = 1;
  onmessage: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onclose: (() => void) | null = null;
  send = vi.fn();
  close = vi.fn();
}

// =============================================================================
// Test Suite
// =============================================================================

describe('SignalingServer', () => {
  let server: SignalingServer;

  beforeEach(() => {
    vi.clearAllMocks();
    server = new SignalingServer();
  });

  // ===========================================================================
  // Connection Tests
  // ===========================================================================

  describe('connection handling', () => {
    it('should register new peer connection', () => {
      const mockWs = new MockWebSocket();

      server.handleConnection('peer-1', mockWs as any);

      expect(server.getPeerCount()).toBe(1);
    });

    it('should track multiple peers', () => {
      const ws1 = new MockWebSocket();
      const ws2 = new MockWebSocket();
      const ws3 = new MockWebSocket();

      server.handleConnection('peer-1', ws1 as any);
      server.handleConnection('peer-2', ws2 as any);
      server.handleConnection('peer-3', ws3 as any);

      expect(server.getPeerCount()).toBe(3);
    });

    it('should remove peer on disconnect', () => {
      const mockWs = new MockWebSocket();

      server.handleConnection('peer-1', mockWs as any);
      server.handleDisconnect('peer-1');

      expect(server.getPeerCount()).toBe(0);
    });
  });

  // ===========================================================================
  // Offer/Answer Tests
  // ===========================================================================

  describe('offer handling', () => {
    it('should relay offer to target peer', () => {
      const sender = new MockWebSocket();
      const receiver = new MockWebSocket();

      server.handleConnection('sender', sender as any);
      server.handleConnection('receiver', receiver as any);

      const offer = {
        type: 'offer',
        from: 'sender',
        to: 'receiver',
        sdp: 'v=0\r\no=- 12345 2 IN IP4 127.0.0.1\r\n...',
      };

      server.handleMessage('sender', offer);

      expect(receiver.send).toHaveBeenCalledWith(
        expect.stringContaining('offer')
      );
    });

    it('should not relay if target peer not found', () => {
      const sender = new MockWebSocket();

      server.handleConnection('sender', sender as any);

      const offer = {
        type: 'offer',
        from: 'sender',
        to: 'non-existent',
        sdp: 'v=0\r\n...',
      };

      // Should not throw
      expect(() => server.handleMessage('sender', offer)).not.toThrow();
    });
  });

  describe('answer handling', () => {
    it('should relay answer to target peer', () => {
      const sender = new MockWebSocket();
      const receiver = new MockWebSocket();

      server.handleConnection('sender', sender as any);
      server.handleConnection('receiver', receiver as any);

      const answer = {
        type: 'answer',
        from: 'receiver',
        to: 'sender',
        sdp: 'v=0\r\no=- 67890 2 IN IP4 127.0.0.1\r\n...',
      };

      server.handleMessage('receiver', answer);

      expect(sender.send).toHaveBeenCalledWith(
        expect.stringContaining('answer')
      );
    });
  });

  // ===========================================================================
  // ICE Candidate Tests
  // ===========================================================================

  describe('ICE candidate handling', () => {
    it('should relay ICE candidates to target peer', () => {
      const peer1 = new MockWebSocket();
      const peer2 = new MockWebSocket();

      server.handleConnection('peer-1', peer1 as any);
      server.handleConnection('peer-2', peer2 as any);

      const candidate = {
        type: 'ice-candidate',
        from: 'peer-1',
        to: 'peer-2',
        candidate: {
          candidate: 'candidate:123 1 udp 123456 192.168.1.1 12345 typ host',
          sdpMid: '0',
          sdpMLineIndex: 0,
        },
      };

      server.handleMessage('peer-1', candidate);

      expect(peer2.send).toHaveBeenCalledWith(
        expect.stringContaining('ice-candidate')
      );
    });
  });

  // ===========================================================================
  // Room Tests
  // ===========================================================================

  describe('room management', () => {
    it('should create room for stream', () => {
      const roomId = server.createRoom('stream-123');

      expect(roomId).toBeDefined();
      expect(server.roomExists(roomId)).toBe(true);
    });

    it('should allow peers to join room', () => {
      const roomId = server.createRoom('stream-123');
      const peer1 = new MockWebSocket();
      const peer2 = new MockWebSocket();

      server.handleConnection('peer-1', peer1 as any);
      server.handleConnection('peer-2', peer2 as any);

      server.joinRoom('peer-1', roomId);
      server.joinRoom('peer-2', roomId);

      expect(server.getRoomPeers(roomId)).toHaveLength(2);
    });

    it('should broadcast to all peers in room', () => {
      const roomId = server.createRoom('stream-123');
      const peer1 = new MockWebSocket();
      const peer2 = new MockWebSocket();
      const peer3 = new MockWebSocket();

      server.handleConnection('peer-1', peer1 as any);
      server.handleConnection('peer-2', peer2 as any);
      server.handleConnection('peer-3', peer3 as any);

      server.joinRoom('peer-1', roomId);
      server.joinRoom('peer-2', roomId);
      // peer-3 not in room

      server.broadcastToRoom(roomId, { type: 'test', data: 'hello' }, 'peer-1');

      expect(peer2.send).toHaveBeenCalled();
      expect(peer3.send).not.toHaveBeenCalled();
    });

    it('should remove peer from room on leave', () => {
      const roomId = server.createRoom('stream-123');
      const peer1 = new MockWebSocket();

      server.handleConnection('peer-1', peer1 as any);
      server.joinRoom('peer-1', roomId);

      expect(server.getRoomPeers(roomId)).toHaveLength(1);

      server.leaveRoom('peer-1', roomId);

      expect(server.getRoomPeers(roomId)).toHaveLength(0);
    });

    it('should clean up room when last peer leaves', () => {
      const roomId = server.createRoom('stream-123');
      const peer1 = new MockWebSocket();

      server.handleConnection('peer-1', peer1 as any);
      server.joinRoom('peer-1', roomId);
      server.leaveRoom('peer-1', roomId);

      // Room should be cleaned up
      expect(server.roomExists(roomId)).toBe(false);
    });
  });

  // ===========================================================================
  // Error Handling Tests
  // ===========================================================================

  describe('error handling', () => {
    it('should handle malformed messages gracefully', () => {
      const peer = new MockWebSocket();
      server.handleConnection('peer-1', peer as any);

      // Should not throw
      expect(() => server.handleMessage('peer-1', { invalid: 'message' })).not.toThrow();
    });

    it('should handle connection errors', () => {
      const peer = new MockWebSocket();
      server.handleConnection('peer-1', peer as any);

      // Simulate error
      expect(() => server.handleError('peer-1', new Error('Connection lost'))).not.toThrow();
    });
  });

  // ===========================================================================
  // Metrics Tests
  // ===========================================================================

  describe('metrics', () => {
    it('should track total connections', () => {
      const ws1 = new MockWebSocket();
      const ws2 = new MockWebSocket();

      server.handleConnection('peer-1', ws1 as any);
      server.handleConnection('peer-2', ws2 as any);

      const metrics = server.getMetrics();

      expect(metrics.totalConnections).toBe(2);
    });

    it('should track message counts', () => {
      const peer1 = new MockWebSocket();
      const peer2 = new MockWebSocket();

      server.handleConnection('peer-1', peer1 as any);
      server.handleConnection('peer-2', peer2 as any);

      server.handleMessage('peer-1', { type: 'offer', to: 'peer-2', sdp: '...' });
      server.handleMessage('peer-2', { type: 'answer', to: 'peer-1', sdp: '...' });

      const metrics = server.getMetrics();

      expect(metrics.messagesRelayed).toBe(2);
    });
  });
});














