/**
 * OpenAPI Specification
 *
 * Complete OpenAPI 3.0 documentation for SafeOS Guardian API.
 *
 * @module api/openapi
 */

import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';

// =============================================================================
// OpenAPI Specification
// =============================================================================

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'SafeOS Guardian API',
    version: '1.0.0',
    description: `
# SafeOS Guardian API

Free AI-powered monitoring service for pets, babies, and elderly care.
Part of SuperCloud's 10% for Humanity initiative.

## Authentication

Most endpoints support **guest mode** (no auth required). 
For persistent data, use the session token returned by \`POST /api/auth/session\`.

## Rate Limits

- Guest users: 100 requests/minute
- Authenticated users: 1000 requests/minute

## WebSocket

Real-time streaming available at \`ws://[host]/ws\`

## Critical Disclaimer

This is a **supplementary tool** - never a replacement for human care.
    `.trim(),
    contact: {
      name: 'SuperCloud',
      url: 'https://supercloud.dev',
      email: 'support@supercloud.dev',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Local development server',
    },
    {
      url: 'https://api.safeos.dev',
      description: 'Production server',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication and session management' },
    { name: 'Streams', description: 'Video stream management' },
    { name: 'Alerts', description: 'Alert management and acknowledgment' },
    { name: 'Analysis', description: 'Frame analysis results' },
    { name: 'Profiles', description: 'Monitoring profile management' },
    { name: 'Notifications', description: 'Notification channel configuration' },
    { name: 'System', description: 'System health and configuration' },
    { name: 'Review', description: 'Human review queue' },
  ],
  paths: {
    // =========================================================================
    // Auth Endpoints
    // =========================================================================
    '/api/auth/session': {
      post: {
        tags: ['Auth'],
        summary: 'Create a new session',
        description: 'Creates a new session for guest or returning users. Sessions are stored locally in IndexedDB.',
        operationId: 'createSession',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  deviceId: { type: 'string', description: 'Optional device identifier for session persistence' },
                  displayName: { type: 'string', description: 'Optional display name for the user' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Session created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SessionResponse' },
              },
            },
          },
        },
      },
      get: {
        tags: ['Auth'],
        summary: 'Get current session',
        description: 'Returns the current session information',
        operationId: 'getSession',
        security: [{ sessionToken: [] }],
        responses: {
          200: {
            description: 'Session information',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SessionResponse' },
              },
            },
          },
          401: { description: 'No valid session' },
        },
      },
      delete: {
        tags: ['Auth'],
        summary: 'End session',
        description: 'Ends the current session and clears local data',
        operationId: 'deleteSession',
        security: [{ sessionToken: [] }],
        responses: {
          200: { description: 'Session ended successfully' },
        },
      },
    },
    '/api/auth/profile': {
      get: {
        tags: ['Auth'],
        summary: 'Get user profile',
        description: 'Returns the user profile associated with the session',
        operationId: 'getProfile',
        security: [{ sessionToken: [] }],
        responses: {
          200: {
            description: 'User profile',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserProfile' },
              },
            },
          },
        },
      },
      patch: {
        tags: ['Auth'],
        summary: 'Update user profile',
        description: 'Updates the user profile settings',
        operationId: 'updateProfile',
        security: [{ sessionToken: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserProfileUpdate' },
            },
          },
        },
        responses: {
          200: {
            description: 'Profile updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserProfile' },
              },
            },
          },
        },
      },
    },

    // =========================================================================
    // Stream Endpoints
    // =========================================================================
    '/api/streams': {
      get: {
        tags: ['Streams'],
        summary: 'List all streams',
        description: 'Returns a list of all video streams for the current session',
        operationId: 'listStreams',
        parameters: [
          { name: 'scenario', in: 'query', schema: { type: 'string', enum: ['pet', 'baby', 'elderly'] } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'paused', 'disconnected'] } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
        ],
        responses: {
          200: {
            description: 'List of streams',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Stream' },
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Streams'],
        summary: 'Create a new stream',
        description: 'Creates a new video monitoring stream',
        operationId: 'createStream',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateStreamRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Stream created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Stream' },
                  },
                },
              },
            },
          },
          400: { description: 'Invalid request' },
        },
      },
    },
    '/api/streams/{streamId}': {
      get: {
        tags: ['Streams'],
        summary: 'Get stream by ID',
        operationId: 'getStream',
        parameters: [
          { name: 'streamId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'Stream details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Stream' },
                  },
                },
              },
            },
          },
          404: { description: 'Stream not found' },
        },
      },
      patch: {
        tags: ['Streams'],
        summary: 'Update stream',
        operationId: 'updateStream',
        parameters: [
          { name: 'streamId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateStreamRequest' },
            },
          },
        },
        responses: {
          200: { description: 'Stream updated' },
          404: { description: 'Stream not found' },
        },
      },
      delete: {
        tags: ['Streams'],
        summary: 'Delete stream',
        operationId: 'deleteStream',
        parameters: [
          { name: 'streamId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Stream deleted' },
          404: { description: 'Stream not found' },
        },
      },
    },
    '/api/streams/{streamId}/pause': {
      post: {
        tags: ['Streams'],
        summary: 'Pause stream',
        operationId: 'pauseStream',
        parameters: [
          { name: 'streamId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Stream paused' },
          404: { description: 'Stream not found' },
        },
      },
    },
    '/api/streams/{streamId}/resume': {
      post: {
        tags: ['Streams'],
        summary: 'Resume stream',
        operationId: 'resumeStream',
        parameters: [
          { name: 'streamId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Stream resumed' },
          404: { description: 'Stream not found' },
        },
      },
    },

    // =========================================================================
    // Alert Endpoints
    // =========================================================================
    '/api/alerts': {
      get: {
        tags: ['Alerts'],
        summary: 'List alerts',
        description: 'Returns a paginated list of alerts',
        operationId: 'listAlerts',
        parameters: [
          { name: 'streamId', in: 'query', schema: { type: 'string' } },
          { name: 'severity', in: 'query', schema: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] } },
          { name: 'acknowledged', in: 'query', schema: { type: 'boolean' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
        ],
        responses: {
          200: {
            description: 'List of alerts',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Alert' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/alerts/active': {
      get: {
        tags: ['Alerts'],
        summary: 'Get active alerts',
        description: 'Returns only unacknowledged alerts',
        operationId: 'getActiveAlerts',
        responses: {
          200: {
            description: 'Active alerts',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Alert' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/alerts/{alertId}': {
      get: {
        tags: ['Alerts'],
        summary: 'Get alert by ID',
        operationId: 'getAlert',
        parameters: [
          { name: 'alertId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'Alert details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Alert' },
                  },
                },
              },
            },
          },
          404: { description: 'Alert not found' },
        },
      },
    },
    '/api/alerts/{alertId}/acknowledge': {
      post: {
        tags: ['Alerts'],
        summary: 'Acknowledge alert',
        description: 'Marks an alert as acknowledged, stopping escalation',
        operationId: 'acknowledgeAlert',
        parameters: [
          { name: 'alertId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Alert acknowledged' },
          404: { description: 'Alert not found' },
        },
      },
    },
    '/api/alerts/acknowledge-all': {
      post: {
        tags: ['Alerts'],
        summary: 'Acknowledge all alerts',
        description: 'Acknowledges all alerts for a specific stream',
        operationId: 'acknowledgeAllAlerts',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['streamId'],
                properties: {
                  streamId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Alerts acknowledged',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        acknowledged: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/alerts/stats': {
      get: {
        tags: ['Alerts'],
        summary: 'Get alert statistics',
        operationId: 'getAlertStats',
        responses: {
          200: {
            description: 'Alert statistics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        total: { type: 'integer' },
                        unacknowledged: { type: 'integer' },
                        bySeverity: {
                          type: 'object',
                          additionalProperties: { type: 'integer' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    // =========================================================================
    // Profile Endpoints
    // =========================================================================
    '/api/profiles': {
      get: {
        tags: ['Profiles'],
        summary: 'List monitoring profiles',
        description: 'Returns all available monitoring profiles',
        operationId: 'listProfiles',
        responses: {
          200: {
            description: 'List of profiles',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/MonitoringProfile' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    // =========================================================================
    // System Endpoints
    // =========================================================================
    '/api/status': {
      get: {
        tags: ['System'],
        summary: 'Get system status',
        description: 'Returns system health including Ollama status and queue metrics',
        operationId: 'getStatus',
        responses: {
          200: {
            description: 'System status',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SystemStatus' },
              },
            },
          },
        },
      },
    },
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        description: 'Simple health check endpoint',
        operationId: 'healthCheck',
        responses: {
          200: {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['ok'] },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },

    // =========================================================================
    // Notification Endpoints
    // =========================================================================
    '/api/notifications/subscribe': {
      post: {
        tags: ['Notifications'],
        summary: 'Subscribe to browser push notifications',
        operationId: 'subscribePush',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['subscription'],
                properties: {
                  subscription: {
                    type: 'object',
                    properties: {
                      endpoint: { type: 'string' },
                      keys: {
                        type: 'object',
                        properties: {
                          p256dh: { type: 'string' },
                          auth: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Subscription saved' },
        },
      },
    },
    '/api/notifications/telegram/register': {
      post: {
        tags: ['Notifications'],
        summary: 'Register Telegram chat ID',
        operationId: 'registerTelegram',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['chatId'],
                properties: {
                  chatId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Telegram chat registered' },
        },
      },
    },

    // =========================================================================
    // Analysis Endpoints
    // =========================================================================
    '/api/analysis': {
      get: {
        tags: ['Analysis'],
        summary: 'List analysis results',
        operationId: 'listAnalysis',
        parameters: [
          { name: 'streamId', in: 'query', schema: { type: 'string' } },
          { name: 'concernLevel', in: 'query', schema: { type: 'string', enum: ['none', 'low', 'medium', 'high', 'critical'] } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
        ],
        responses: {
          200: {
            description: 'Analysis results',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/AnalysisResult' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },

  // ===========================================================================
  // Components
  // ===========================================================================
  components: {
    securitySchemes: {
      sessionToken: {
        type: 'apiKey',
        in: 'header',
        name: 'X-Session-Token',
        description: 'Session token from POST /api/auth/session',
      },
    },
    schemas: {
      // Session Schemas
      SessionResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' },
              token: { type: 'string' },
              isGuest: { type: 'boolean' },
              expiresAt: { type: 'string', format: 'date-time' },
              profile: { $ref: '#/components/schemas/UserProfile' },
            },
          },
        },
      },
      UserProfile: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          displayName: { type: 'string' },
          avatarUrl: { type: 'string', nullable: true },
          preferences: { $ref: '#/components/schemas/UserPreferences' },
          notificationSettings: { $ref: '#/components/schemas/NotificationSettings' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      UserProfileUpdate: {
        type: 'object',
        properties: {
          displayName: { type: 'string' },
          preferences: { $ref: '#/components/schemas/UserPreferences' },
          notificationSettings: { $ref: '#/components/schemas/NotificationSettings' },
        },
      },
      UserPreferences: {
        type: 'object',
        properties: {
          defaultScenario: { type: 'string', enum: ['pet', 'baby', 'elderly'] },
          motionSensitivity: { type: 'number', minimum: 0, maximum: 1 },
          audioSensitivity: { type: 'number', minimum: 0, maximum: 1 },
          alertVolume: { type: 'number', minimum: 0, maximum: 1 },
          theme: { type: 'string', enum: ['dark', 'light', 'system'] },
        },
      },
      NotificationSettings: {
        type: 'object',
        properties: {
          browserPush: { type: 'boolean' },
          sms: { type: 'boolean' },
          telegram: { type: 'boolean' },
          emailDigest: { type: 'boolean' },
          quietHoursStart: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
          quietHoursEnd: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
        },
      },

      // Stream Schemas
      Stream: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          scenario: { type: 'string', enum: ['pet', 'baby', 'elderly'] },
          status: { type: 'string', enum: ['connecting', 'active', 'paused', 'disconnected'] },
          preferences: { $ref: '#/components/schemas/StreamPreferences' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateStreamRequest: {
        type: 'object',
        required: ['name', 'scenario'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          scenario: { type: 'string', enum: ['pet', 'baby', 'elderly'] },
          preferences: { $ref: '#/components/schemas/StreamPreferences' },
        },
      },
      UpdateStreamRequest: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          status: { type: 'string', enum: ['active', 'paused'] },
          preferences: { $ref: '#/components/schemas/StreamPreferences' },
        },
      },
      StreamPreferences: {
        type: 'object',
        properties: {
          motionSensitivity: { type: 'number', minimum: 0, maximum: 1 },
          audioSensitivity: { type: 'number', minimum: 0, maximum: 1 },
          analysisInterval: { type: 'integer', description: 'Seconds between analyses' },
          notificationsEnabled: { type: 'boolean' },
        },
      },

      // Alert Schemas
      Alert: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          streamId: { type: 'string' },
          severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          message: { type: 'string' },
          description: { type: 'string' },
          acknowledged: { type: 'boolean' },
          acknowledgedAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      // Analysis Schemas
      AnalysisResult: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          streamId: { type: 'string' },
          concernLevel: { type: 'string', enum: ['none', 'low', 'medium', 'high', 'critical'] },
          description: { type: 'string' },
          recommendations: {
            type: 'array',
            items: { type: 'string' },
          },
          source: { type: 'string', enum: ['ollama', 'cloud'] },
          processingTime: { type: 'integer', description: 'Processing time in milliseconds' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      // Profile Schemas
      MonitoringProfile: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          scenario: { type: 'string', enum: ['pet', 'baby', 'elderly'] },
          description: { type: 'string' },
          defaultSettings: { $ref: '#/components/schemas/StreamPreferences' },
        },
      },

      // System Schemas
      SystemStatus: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
          timestamp: { type: 'string', format: 'date-time' },
          services: {
            type: 'object',
            properties: {
              ollama: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['online', 'offline'] },
                  version: { type: 'string', nullable: true },
                  models: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
              },
              database: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['connected', 'disconnected'] },
                },
              },
            },
          },
          queues: {
            type: 'object',
            properties: {
              analysis: {
                type: 'object',
                properties: {
                  pending: { type: 'integer' },
                  processing: { type: 'integer' },
                  completed: { type: 'integer' },
                  failed: { type: 'integer' },
                },
              },
              review: {
                type: 'object',
                properties: {
                  pending: { type: 'integer' },
                },
              },
            },
          },
          uptime: { type: 'integer', description: 'Uptime in seconds' },
        },
      },

      // Common Schemas
      Pagination: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          limit: { type: 'integer' },
          offset: { type: 'integer' },
          hasMore: { type: 'boolean' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', enum: [false] },
          error: { type: 'string' },
          code: { type: 'string' },
        },
      },
    },
  },
};

// =============================================================================
// Router with Swagger UI
// =============================================================================

export const docsRouter = Router();

// Serve OpenAPI JSON
docsRouter.get('/openapi.json', (req, res) => {
  res.json(openApiSpec);
});

// Serve Swagger UI
docsRouter.use('/', swaggerUi.serve);
docsRouter.get('/', swaggerUi.setup(openApiSpec, {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin-bottom: 20px }
  `,
  customSiteTitle: 'SafeOS Guardian API Docs',
}));

