/**
 * WebRTC Client
 *
 * Client-side WebRTC for peer-to-peer streaming.
 *
 * @module lib/webrtc-client
 */

// =============================================================================
// Types
// =============================================================================

export interface WebRTCConfig {
  iceServers?: RTCIceServer[];
  signaling: {
    send: (message: any) => void;
  };
}

export interface WebRTCClientEvents {
  onLocalStream?: (stream: MediaStream) => void;
  onRemoteStream?: (stream: MediaStream, peerId: string) => void;
  onPeerConnected?: (peerId: string) => void;
  onPeerDisconnected?: (peerId: string) => void;
  onError?: (error: Error) => void;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

// =============================================================================
// WebRTCClient Class
// =============================================================================

export class WebRTCClient {
  private config: WebRTCConfig;
  private events: WebRTCClientEvents;
  private peers: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;

  constructor(config: WebRTCConfig, events: WebRTCClientEvents = {}) {
    this.config = {
      ...config,
      iceServers: config.iceServers || DEFAULT_ICE_SERVERS,
    };
    this.events = events;
  }

  // ---------------------------------------------------------------------------
  // Public Methods
  // ---------------------------------------------------------------------------

  /**
   * Start local stream
   */
  async startLocalStream(options?: MediaStreamConstraints): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(
        options || { video: true, audio: true }
      );
      this.events.onLocalStream?.(this.localStream);
      return this.localStream;
    } catch (error) {
      this.events.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Stop local stream
   */
  stopLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }

  /**
   * Create offer to connect to a peer
   */
  async createOffer(peerId: string): Promise<RTCSessionDescriptionInit> {
    const pc = this.getOrCreatePeerConnection(peerId);

    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Send offer through signaling
    this.config.signaling.send({
      type: 'offer',
      targetPeerId: peerId,
      payload: offer,
    });

    return offer;
  }

  /**
   * Handle incoming offer
   */
  async handleOffer(
    peerId: string,
    offer: RTCSessionDescriptionInit
  ): Promise<void> {
    const pc = this.getOrCreatePeerConnection(peerId);

    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    // Send answer through signaling
    this.config.signaling.send({
      type: 'answer',
      targetPeerId: peerId,
      payload: answer,
    });
  }

  /**
   * Handle incoming answer
   */
  async handleAnswer(
    peerId: string,
    answer: RTCSessionDescriptionInit
  ): Promise<void> {
    const pc = this.peers.get(peerId);
    if (!pc) return;

    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  /**
   * Handle incoming ICE candidate
   */
  async handleIceCandidate(
    peerId: string,
    candidate: RTCIceCandidateInit
  ): Promise<void> {
    const pc = this.peers.get(peerId);
    if (!pc) return;

    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }

  /**
   * Handle signaling message
   */
  async handleSignalingMessage(message: any): Promise<void> {
    const { type, peerId, payload } = message;

    switch (type) {
      case 'offer':
        await this.handleOffer(peerId, payload);
        break;
      case 'answer':
        await this.handleAnswer(peerId, payload);
        break;
      case 'ice-candidate':
        await this.handleIceCandidate(peerId, payload);
        break;
    }
  }

  /**
   * Disconnect from a peer
   */
  disconnectPeer(peerId: string): void {
    const pc = this.peers.get(peerId);
    if (pc) {
      pc.close();
      this.peers.delete(peerId);
      this.events.onPeerDisconnected?.(peerId);
    }
  }

  /**
   * Disconnect all peers
   */
  disconnectAll(): void {
    for (const [peerId] of this.peers) {
      this.disconnectPeer(peerId);
    }
    this.stopLocalStream();
  }

  /**
   * Get peer connection state
   */
  getPeerState(peerId: string): RTCPeerConnectionState | null {
    const pc = this.peers.get(peerId);
    return pc?.connectionState || null;
  }

  /**
   * Get all connected peers
   */
  getConnectedPeers(): string[] {
    return Array.from(this.peers.entries())
      .filter(([, pc]) => pc.connectionState === 'connected')
      .map(([peerId]) => peerId);
  }

  // ---------------------------------------------------------------------------
  // Private Methods
  // ---------------------------------------------------------------------------

  private getOrCreatePeerConnection(peerId: string): RTCPeerConnection {
    let pc = this.peers.get(peerId);
    if (pc) return pc;

    pc = new RTCPeerConnection({
      iceServers: this.config.iceServers,
    });

    // ICE candidate handling
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.config.signaling.send({
          type: 'ice-candidate',
          targetPeerId: peerId,
          payload: event.candidate.toJSON(),
        });
      }
    };

    // Track handling
    pc.ontrack = (event) => {
      if (event.streams[0]) {
        this.events.onRemoteStream?.(event.streams[0], peerId);
      }
    };

    // Connection state handling
    pc.onconnectionstatechange = () => {
      switch (pc!.connectionState) {
        case 'connected':
          this.events.onPeerConnected?.(peerId);
          break;
        case 'disconnected':
        case 'failed':
          this.disconnectPeer(peerId);
          break;
      }
    };

    this.peers.set(peerId, pc);
    return pc;
  }
}

// =============================================================================
// Helper Hook
// =============================================================================

import { useRef, useCallback, useEffect, useState } from 'react';

export function useWebRTC(config: WebRTCConfig, events: WebRTCClientEvents = {}) {
  const clientRef = useRef<WebRTCClient | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(
    new Map()
  );
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);

  useEffect(() => {
    clientRef.current = new WebRTCClient(config, {
      ...events,
      onLocalStream: (stream) => {
        setLocalStream(stream);
        events.onLocalStream?.(stream);
      },
      onRemoteStream: (stream, peerId) => {
        setRemoteStreams((prev) => new Map(prev).set(peerId, stream));
        events.onRemoteStream?.(stream, peerId);
      },
      onPeerConnected: (peerId) => {
        setConnectedPeers((prev) => [...prev, peerId]);
        events.onPeerConnected?.(peerId);
      },
      onPeerDisconnected: (peerId) => {
        setConnectedPeers((prev) => prev.filter((id) => id !== peerId));
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.delete(peerId);
          return next;
        });
        events.onPeerDisconnected?.(peerId);
      },
    });

    return () => {
      clientRef.current?.disconnectAll();
    };
  }, []);

  const startLocalStream = useCallback(
    async (options?: MediaStreamConstraints) => {
      return clientRef.current?.startLocalStream(options);
    },
    []
  );

  const createOffer = useCallback(async (peerId: string) => {
    return clientRef.current?.createOffer(peerId);
  }, []);

  const handleSignalingMessage = useCallback(async (message: any) => {
    return clientRef.current?.handleSignalingMessage(message);
  }, []);

  const disconnectAll = useCallback(() => {
    clientRef.current?.disconnectAll();
  }, []);

  return {
    localStream,
    remoteStreams,
    connectedPeers,
    startLocalStream,
    createOffer,
    handleSignalingMessage,
    disconnectAll,
  };
}
