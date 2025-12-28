# SafeOS Guardian API Documentation

Complete API reference for the SafeOS Guardian backend.

## Base URL

```
Development: http://localhost:3001
Production: https://api.safeos.dev
```

## Authentication

Most endpoints require a session token passed in the `X-Session-Token` header.

```bash
curl -H "X-Session-Token: your-token-here" http://localhost:3001/api/streams
```

---

## Endpoints

### Health & Status

#### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-21T00:00:00.000Z"
}
```

#### GET /api/status
Get detailed system status.

**Response:**
```json
{
  "status": "healthy",
  "uptime": 3600,
  "version": "1.0.0",
  "stats": {
    "totalStreams": 10,
    "activeStreams": 2,
    "totalAlerts": 150,
    "pendingReviews": 3,
    "analysisToday": 1200,
    "cloudFallbackRate": 5.2
  },
  "ollama": {
    "status": "online",
    "models": ["moondream", "llava:7b"]
  }
}
```

---

### Authentication

#### POST /api/auth/session
Create a new session (guest or authenticated).

**Request:**
```json
{
  "displayName": "My Monitoring Station",
  "deviceId": "device-123"
}
```

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "session-uuid",
    "token": "session-token",
    "isGuest": true,
    "expiresAt": "2024-12-28T00:00:00.000Z"
  },
  "profile": {
    "id": "profile-uuid",
    "displayName": "My Monitoring Station",
    "preferences": {...},
    "notificationSettings": {...}
  }
}
```

#### GET /api/auth/session
Get current session info.

**Headers:** `X-Session-Token: required`

#### DELETE /api/auth/session
End the current session.

**Headers:** `X-Session-Token: required`

#### GET /api/auth/profile
Get user profile.

**Headers:** `X-Session-Token: required`

#### PATCH /api/auth/profile
Update user profile.

**Headers:** `X-Session-Token: required`

**Request:**
```json
{
  "displayName": "New Name",
  "preferences": {
    "defaultScenario": "pet",
    "motionSensitivity": 0.6
  }
}
```

---

### Streams

#### GET /api/streams
List all streams.

**Query Parameters:**
- `status` - Filter by status: `active`, `ended`, `paused`
- `scenario` - Filter by scenario: `pet`, `baby`, `elderly`
- `limit` - Max results (default: 50)
- `offset` - Pagination offset

**Response:**
```json
{
  "success": true,
  "streams": [
    {
      "id": "stream-uuid",
      "scenario": "pet",
      "status": "active",
      "startedAt": "2024-12-21T00:00:00.000Z",
      "alertCount": 5
    }
  ],
  "total": 10
}
```

#### POST /api/streams
Create a new stream.

**Request:**
```json
{
  "scenario": "pet",
  "name": "Living Room Camera",
  "settings": {
    "motionSensitivity": 0.5,
    "audioSensitivity": 0.5,
    "analysisInterval": 5000
  }
}
```

**Response:**
```json
{
  "success": true,
  "stream": {
    "id": "stream-uuid",
    "scenario": "pet",
    "status": "active",
    "startedAt": "2024-12-21T00:00:00.000Z"
  }
}
```

#### GET /api/streams/:id
Get a specific stream.

#### DELETE /api/streams/:id
End a stream.

#### POST /api/streams/:id/pause
Pause a stream.

#### POST /api/streams/:id/resume
Resume a paused stream.

---

### Analysis

#### POST /api/analysis/frame
Submit a frame for AI analysis.

**Request:**
```json
{
  "streamId": "stream-uuid",
  "frameData": "base64-encoded-jpeg",
  "timestamp": "2024-12-21T00:00:00.000Z",
  "motionLevel": 0.7,
  "audioLevel": 0.3
}
```

**Response:**
```json
{
  "success": true,
  "queued": true,
  "jobId": "job-uuid"
}
```

#### GET /api/analysis/result/:jobId
Get analysis result.

**Response:**
```json
{
  "success": true,
  "result": {
    "concernLevel": "low",
    "description": "Normal activity detected",
    "detectedIssues": [],
    "processingTimeMs": 150,
    "modelUsed": "moondream",
    "isCloudFallback": false
  }
}
```

#### GET /api/analysis/stats
Get analysis statistics.

---

### Alerts

#### GET /api/alerts
List alerts.

**Query Parameters:**
- `streamId` - Filter by stream
- `severity` - Filter: `critical`, `high`, `medium`, `low`, `info`
- `acknowledged` - Filter: `true` or `false`
- `limit` - Max results (default: 50)
- `page` - Page number

**Response:**
```json
{
  "success": true,
  "alerts": [...],
  "total": 100,
  "page": 1,
  "totalPages": 2
}
```

#### POST /api/alerts/:id/acknowledge
Acknowledge an alert.

**Response:**
```json
{
  "success": true,
  "acknowledged": true,
  "acknowledgedAt": "2024-12-21T00:00:00.000Z"
}
```

#### DELETE /api/alerts/:id
Delete an alert.

---

### Monitoring Profiles

#### GET /api/profiles
List monitoring profiles.

#### POST /api/profiles
Create a custom profile.

**Request:**
```json
{
  "name": "Custom Pet Profile",
  "scenario": "pet",
  "settings": {
    "motionSensitivity": 0.7,
    "audioSensitivity": 0.3,
    "analysisInterval": 3000
  }
}
```

#### PATCH /api/profiles/:id
Update a profile.

#### DELETE /api/profiles/:id
Delete a profile.

---

### Notifications

#### POST /api/notifications/push/subscribe
Subscribe to push notifications.

**Request:**
```json
{
  "subscription": {
    "endpoint": "https://...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  }
}
```

#### POST /api/notifications/telegram/register
Register Telegram for notifications.

**Request:**
```json
{
  "chatId": "123456789"
}
```

#### POST /api/notifications/sms/register
Register phone for SMS notifications.

**Request:**
```json
{
  "phoneNumber": "+1234567890"
}
```

#### POST /api/notifications/test
Send a test notification.

---

### Webhooks

#### GET /api/webhooks
List registered webhooks.

#### POST /api/webhooks
Create a new webhook.

**Request:**
```json
{
  "name": "My Webhook",
  "url": "https://my-app.com/webhook",
  "events": ["alert.created", "stream.started"]
}
```

**Available Events:**
- `alert.created`
- `alert.acknowledged`
- `stream.started`
- `stream.ended`
- `analysis.completed`
- `review.required`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "webhook-uuid",
    "name": "My Webhook",
    "url": "https://my-app.com/webhook",
    "secret": "whsec_xxxxx",
    "events": ["alert.created", "stream.started"],
    "isActive": true
  }
}
```

#### DELETE /api/webhooks/:id
Delete a webhook.

#### POST /api/webhooks/:id/test
Send a test payload.

---

### Data Export

#### GET /api/export/alerts
Export alerts as JSON or CSV.

**Query Parameters:**
- `format` - `json` or `csv`
- `startDate` - ISO date
- `endDate` - ISO date

#### GET /api/export/analysis
Export analysis results.

#### GET /api/export/streams
Export stream history.

#### GET /api/export/profile
Export user profile and settings.

#### GET /api/export/all
Export all user data (GDPR compliant).

---

### Human Review

#### GET /api/review/flags
List content flags for review.

**Query Parameters:**
- `status` - `pending`, `approved`, `rejected`, `escalated`
- `tier` - Filter by tier (1-4)
- `limit` - Max results

#### POST /api/review/flags/:id/action
Action a content flag.

**Request:**
```json
{
  "action": "approve" | "reject" | "escalate",
  "reason": "Optional reason"
}
```

---

## WebSocket API

Connect to `ws://localhost:3001` for real-time updates.

### Events

#### Subscribe to channels
```json
{
  "type": "subscribe",
  "channel": "alerts" | "stats" | "stream:{streamId}"
}
```

#### Receive alert
```json
{
  "type": "alert",
  "payload": {
    "id": "alert-uuid",
    "severity": "high",
    "message": "Motion detected",
    "streamId": "stream-uuid"
  }
}
```

#### Receive stats update
```json
{
  "type": "stats",
  "payload": {
    "activeStreams": 2,
    "analysisQueueSize": 5,
    "ollamaStatus": "online"
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid session token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request body |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| General API | 100 req/min |
| Analysis submission | 30 req/min |
| Webhook triggers | 60 req/min |

---

## OpenAPI Spec

Full OpenAPI 3.0 specification available at:
- JSON: `/api/docs/openapi.json`
- YAML: `/api/docs/openapi.yaml`
- Interactive: `/api/docs` (Swagger UI)







