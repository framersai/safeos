/**
 * WebRTC Signaling Server
 *
 * Handles WebRTC signaling for peer-to-peer streaming.
 *
 * @module lib/webrtc/signaling
 */

import type { WebSocket } from 'ws';

// =============================================================================
// Types
// =============================================================================

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join-room' | 'leave-room' | 'room-info';
  roomId?: string;
  peerId?: string;
  targetPeerId?: string;
  payload?: any;
}

export interface Peer {
  id: string;
  socket: WebSocket;
  roomId: string;
  joinedAt: Date;
  isViewer: boolean;
  metadata?: Record<string, unknown>;
}

export interface Room {
  id: string;
  createdAt: Date;
  broadcaster?: Peer;
  viewers: Map<string, Peer>;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// SignalingServer Class
// =============================================================================

export class SignalingServer {
  private rooms: Map<string, Room> = new Map();
  private peers: Map<string, Peer> = new Map();
  private socketToPeer: Map<WebSocket, string> = new Map();

  // Stats
  private stats = {
    totalConnections: 0,
    activeRooms: 0,
    activePeers: 0,
    messagesRelayed: 0,
  };

  // ---------------------------------------------------------------------------
  // Public Methods
  // ---------------------------------------------------------------------------

  /**
   * Handle a new WebSocket connection
   */
  handleConnection(socket: WebSocket, peerId?: string): string {
    const id = peerId || this.generatePeerId();

    // Create peer record
    const peer: Peer = {
      id,
      socket,
      roomId: '',
      joinedAt: new Date(),
      isViewer: true,
    };

    this.peers.set(id, peer);
    this.socketToPeer.set(socket, id);
    this.stats.totalConnections++;
    this.stats.activePeers++;

    return id;
  }

  /**
   * Handle WebSocket disconnection
   */
  handleDisconnection(socket: WebSocket): void {
    const peerId = this.socketToPeer.get(socket);
    if (!peerId) return;

    const peer = this.peers.get(peerId);
    if (peer && peer.roomId) {
      this.leaveRoom(peerId);
    }

    this.peers.delete(peerId);
    this.socketToPeer.delete(socket);
    this.stats.activePeers--;
  }

  /**
   * Handle an incoming signaling message
   */
  handleMessage(socket: WebSocket, message: SignalingMessage): void {
    const peerId = this.socketToPeer.get(socket);
    if (!peerId) return;

    switch (message.type) {
      case 'join-room':
        this.joinRoom(peerId, message.roomId!, message.payload?.isViewer ?? true);
        break;

      case 'leave-room':
        this.leaveRoom(peerId);
        break;

      case 'offer':
      case 'answer':
      case 'ice-candidate':
        this.relayToTarget(peerId, message);
        break;

      case 'room-info':
        this.sendRoomInfo(peerId);
        break;
    }
  }

  /**
   * Join a room
   */
  joinRoom(peerId: string, roomId: string, isViewer: boolean = true): void {
    const peer = this.peers.get(peerId);
    if (!peer) return;

    // Leave current room if in one
    if (peer.roomId) {
      this.leaveRoom(peerId);
    }

    // Get or create room
    let room = this.rooms.get(roomId);
    if (!room) {
      room = {
        id: roomId,
        createdAt: new Date(),
        viewers: new Map(),
      };
      this.rooms.set(roomId, room);
      this.stats.activeRooms++;
    }

    // Add peer to room
    peer.roomId = roomId;
    peer.isViewer = isViewer;

    if (isViewer) {
      room.viewers.set(peerId, peer);
    } else {
      // Broadcaster
      if (room.broadcaster) {
        // Notify old broadcaster they're being replaced
        this.sendToPeer(room.broadcaster.id, {
          type: 'room-info',
          payload: { replaced: true },
        });
      }
      room.broadcaster = peer;
    }

    // Notify peer of room state
    this.sendRoomInfo(peerId);

    // Notify other peers in room
    this.broadcastToRoom(roomId, {
      type: 'room-info',
      payload: {
        event: 'peer-joined',
        peerId,
        isViewer,
      },
    }, peerId);
  }

  /**
   * Leave current room
   */
  leaveRoom(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (!peer || !peer.roomId) return;

    const room = this.rooms.get(peer.roomId);
    if (room) {
      if (room.broadcaster?.id === peerId) {
        room.broadcaster = undefined;
      } else {
        room.viewers.delete(peerId);
      }

      // Notify others
      this.broadcastToRoom(room.id, {
        type: 'room-info',
        payload: {
          event: 'peer-left',
          peerId,
        },
      }, peerId);

      // Clean up empty room
      if (!room.broadcaster && room.viewers.size === 0) {
        this.rooms.delete(room.id);
        this.stats.activeRooms--;
      }
    }

    peer.roomId = '';
  }

  /**
   * Get room info
   */
  getRoomInfo(roomId: string): {
    exists: boolean;
    hasBroadcaster: boolean;
    viewerCount: number;
  } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { exists: false, hasBroadcaster: false, viewerCount: 0 };
    }

    return {
      exists: true,
      hasBroadcaster: !!room.broadcaster,
      viewerCount: room.viewers.size,
    };
  }

  /**
   * Get stats
   */
  getStats() {
    return { ...this.stats };
  }

  // ---------------------------------------------------------------------------
  // Private Methods
  // ---------------------------------------------------------------------------

  private relayToTarget(fromPeerId: string, message: SignalingMessage): void {
    const fromPeer = this.peers.get(fromPeerId);
    if (!fromPeer || !fromPeer.roomId) return;

    const targetPeerId = message.targetPeerId;
    if (targetPeerId) {
      // Direct relay to specific peer
      this.sendToPeer(targetPeerId, {
        ...message,
        peerId: fromPeerId,
      });
    } else {
      // Broadcast to room
      this.broadcastToRoom(fromPeer.roomId, {
        ...message,
        peerId: fromPeerId,
      }, fromPeerId);
    }

    this.stats.messagesRelayed++;
  }

  private sendRoomInfo(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (!peer || !peer.roomId) return;

    const room = this.rooms.get(peer.roomId);
    if (!room) return;

    this.sendToPeer(peerId, {
      type: 'room-info',
      roomId: room.id,
      payload: {
        hasBroadcaster: !!room.broadcaster,
        broadcasterId: room.broadcaster?.id,
        viewerCount: room.viewers.size,
        viewerIds: Array.from(room.viewers.keys()),
      },
    });
  }

  private sendToPeer(peerId: string, message: SignalingMessage): void {
    const peer = this.peers.get(peerId);
    if (!peer || peer.socket.readyState !== 1) return; // 1 = OPEN

    try {
      peer.socket.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send to peer:', error);
    }
  }

  private broadcastToRoom(
    roomId: string,
    message: SignalingMessage,
    excludePeerId?: string
  ): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Send to broadcaster if not excluded
    if (room.broadcaster && room.broadcaster.id !== excludePeerId) {
      this.sendToPeer(room.broadcaster.id, message);
    }

    // Send to all viewers except excluded
    for (const [viewerId] of room.viewers) {
      if (viewerId !== excludePeerId) {
        this.sendToPeer(viewerId, message);
      }
    }
  }

  private generatePeerId(): string {
    return `peer-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}

// =============================================================================
// Singleton
// =============================================================================

let defaultServer: SignalingServer | null = null;

export function getDefaultSignalingServer(): SignalingServer {
  if (!defaultServer) {
    defaultServer = new SignalingServer();
  }
  return defaultServer;
}

export function createSignalingServer(): SignalingServer {
  return new SignalingServer();
}
