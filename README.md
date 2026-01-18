# SafeOS Guardian

<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="apps/guardian-ui/public/logo.svg">
    <source media="(prefers-color-scheme: light)" srcset="apps/guardian-ui/public/logo.svg">
    <img alt="SafeOS Guardian Logo" src="apps/guardian-ui/public/logo.svg" width="200" height="200">
  </picture>

  <h3>Free AI-Powered Monitoring for Pets, Babies, and Elderly Care</h3>
  <p><strong>Part of Frame's Humanitarian Initiative</strong></p>

  <p>
    <a href="https://frame.dev">frame.dev</a> |
    <a href="https://safeos.sh">safeos.sh</a> |
    <a href="mailto:team@frame.dev">team@frame.dev</a>
  </p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
  [![codecov](https://codecov.io/gh/framersai/safeos/branch/master/graph/badge.svg)](https://codecov.io/gh/framersai/safeos)
  [![Frame](https://img.shields.io/badge/By-Frame-emerald.svg)](https://frame.dev)
</div>

---

## CRITICAL DISCLAIMER

**SafeOS Guardian is NOT a replacement for:**
- Parental or caregiver supervision
- Medical monitoring equipment
- Professional elderly care
- Veterinary monitoring systems

This is a **FREE SUPPLEMENTARY TOOL** designed to assist caregivers, not replace them.

**NEVER leave dependents unattended with only this system.**

---

## Features

### 100% Offline PWA

The Guardian UI is a **standalone Progressive Web App** that works entirely offline:

- **No server required** — install it, open it, done
- **Deployable to GitHub Pages** — static files only
- **Works offline** — all AI runs in your browser
- **PWA installable** — add to home screen on any device

The backend server is **completely optional** and only needed for advanced features (SMS/Telegram alerts, multi-device sync, cloud LLM fallback).

### Client-Side AI Models

All core detection runs **in-browser** using these models:

| Model | Framework | Size | Purpose |
|-------|-----------|------|---------|
| **COCO-SSD + MobileNetV2** | TensorFlow.js | ~5MB | Real-time person/animal detection |
| **Xenova/vit-base-patch16-224** | Transformers.js | ~89MB | Scene classification fallback |

**No internet. No server. No data leaves your device.**

### Optional: Local LLM Enhancement (Ollama)

For smarter scene understanding, optionally run Ollama locally:

| Model | Size | Speed | Purpose |
|-------|------|-------|---------|
| **moondream** | ~1.7GB | ~500ms | Fast triage |
| **llava:7b** | ~4GB | ~2-5s | Detailed analysis |
| **llama3.2-vision:11b** | ~7GB | ~5-10s | Complex reasoning |

### Optional: Cloud LLM Fallback

If local models are uncertain, fallback to cloud (requires API keys):

- **gemini-flash-1.5** (OpenRouter) — fast, cheap
- **gpt-4o-mini** (OpenAI) — reliable
- **claude-3-haiku** (Anthropic) — last resort

### Tech Stack (One Line)

**TensorFlow.js (COCO-SSD/MobileNetV2), Transformers.js (ViT), Ollama (moondream/llava), WebRTC, cloud fallback (Gemini/GPT-4o/Claude)**

### Lost & Found Detection

SafeOS includes a powerful lost pet/person detection system that runs entirely in your browser:

1. **Upload Reference Photos**: Add 1-5 clear photos from different angles
2. **Visual Fingerprinting**: The system extracts:
   - Color histograms (32 buckets)
   - Dominant colors (top 5)
   - Edge signatures (8x8 grid)
   - Size ratio estimates
3. **Real-Time Matching**: Every camera frame is compared against stored fingerprints
4. **Configurable Sensitivity**: Adjust color sensitivity and alert thresholds
5. **Instant Alerts**: Sound and browser notifications when a match is detected

All processing happens client-side - your photos and fingerprints never leave your device.

### Monitoring Scenarios

| Scenario | What It Watches For |
|----------|---------------------|
| **Pets** | Eating, bathroom, distress, illness, unusual stillness |
| **Baby/Toddler** | Crying, movement, breathing patterns, safety hazards |
| **Elderly** | Falls, confusion, distress, prolonged inactivity |

### Privacy-First Design

- **Rolling Buffer**: Only keeps 5-10 minutes of footage
- **Local Processing**: All deep learning runs on your machine
- **No Cloud Storage**: Frames analyzed and discarded
- **Anonymization**: Blurred content for any human review

### Smart Alerting

- **Volume-Ramping Escalation**: Starts quiet, gets louder
- **Multi-Channel**: Browser Push (PWA), SMS/Telegram (requires server)
- **Acknowledge to Silence**: One tap to confirm you're aware

---

## Quick Start

### Option A: PWA Only (Recommended)

No server needed. Just the UI.

```bash
cd packages/safeos/apps/guardian-ui
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). That's it.

**To deploy as static site:**
```bash
pnpm build
# Deploy 'out' folder to GitHub Pages, Vercel, Netlify, etc.
```

### Option B: Full Stack (Advanced)

Only if you need SMS/Telegram alerts or Ollama LLM:

```bash
cd packages/safeos

# Install everything
pnpm install

# Start API + UI together
pnpm dev

# Or separately:
pnpm run api  # Port 3001
pnpm run ui   # Port 3000
```

### Optional: Ollama (Local LLM)

For smarter scene analysis (not required):

```bash
# macOS
brew install ollama
ollama serve

# Pull models
ollama pull moondream    # Fast triage (~1.7GB)
ollama pull llava:7b     # Detailed analysis (~4GB)
```

---

## Architecture

### Mode 1: Standalone PWA (No Server)

```
+------------------------------------------------------------------+
|                    Guardian UI (Static PWA)                       |
|                                                                   |
|  +------------------+  +------------------+  +------------------+ |
|  |   Camera Feed    |  |  Audio Monitor   |  |   Alert Panel    | |
|  |  (MediaStream)   |  |   (Web Audio)    |  |  (Local Notif)   | |
|  +--------+---------+  +--------+---------+  +------------------+ |
|           |                     |                                 |
|  +--------v---------------------v--------------------------------+|
|  |                    Browser AI Engine                          ||
|  |  +------------------+  +------------------------------------+ ||
|  |  | TensorFlow.js    |  | Transformers.js                    | ||
|  |  | COCO-SSD         |  | ViT (fallback)                     | ||
|  |  | (detection)      |  | (classification)                   | ||
|  |  +------------------+  +------------------------------------+ ||
|  +---------------------------------------------------------------+|
|                                                                   |
|  +---------------------------------------------------------------+|
|  |                    IndexedDB Storage                          ||
|  |  - Settings        - Alert history       - Fingerprints       ||
|  +---------------------------------------------------------------+|
+------------------------------------------------------------------+

Deploy to: GitHub Pages, Vercel, Netlify, any static host
Works: 100% offline after first load
```

### Mode 2: Full Stack (Optional Server)

Add the server only if you need SMS/Telegram alerts, multi-device sync, or Ollama LLM:

```
+------------------+          +------------------+          +------------------+
|   Guardian UI    |  <--->   |   SafeOS API     |  <--->   |     Ollama       |
|   (PWA)          |    WS    |   (Express)      |          |   (Optional)     |
+------------------+          +------------------+          +------------------+
                                      |
                    +-----------------+-----------------+
                    |                 |                 |
              +-----v-----+     +-----v-----+     +-----v-----+
              |  Twilio   |     | Telegram  |     |  Cloud    |
              |   SMS     |     |    Bot    |     | Fallback  |
              +-----------+     +-----------+     +-----------+
```

---

## Project Structure

```
packages/safeos/
├── src/                          # Backend source
│   ├── api/                      # Express API server
│   │   ├── server.ts             # Main server setup
│   │   └── routes/               # API route handlers
│   ├── db/                       # Database layer
│   │   └── index.ts              # sql-storage-adapter setup
│   ├── lib/                      # Core libraries
│   │   ├── analysis/             # Vision analysis
│   │   │   ├── frame-analyzer.ts # Main analyzer
│   │   │   ├── cloud-fallback.ts # Cloud LLM fallback
│   │   │   └── profiles/         # Scenario-specific prompts
│   │   ├── alerts/               # Alert system
│   │   │   ├── escalation.ts     # Volume ramping
│   │   │   ├── notification-manager.ts
│   │   │   ├── browser-push.ts
│   │   │   ├── twilio.ts
│   │   │   └── telegram.ts
│   │   ├── audio/                # Audio analysis
│   │   │   └── analyzer.ts       # Cry/distress detection
│   │   ├── ollama/               # Ollama client (optional)
│   │   │   └── client.ts
│   │   ├── safety/               # Content moderation
│   │   │   ├── content-filter.ts
│   │   │   └── disclaimers.ts
│   │   ├── streams/              # Stream management
│   │   │   └── manager.ts
│   │   ├── review/               # Human review system
│   │   │   └── human-review.ts
│   │   └── webrtc/               # WebRTC signaling
│   │       └── signaling.ts
│   ├── queues/                   # Job queues
│   │   ├── analysis-queue.ts
│   │   └── review-queue.ts
│   ├── types/                    # TypeScript types
│   │   └── index.ts
│   └── index.ts                  # Entry point
│
├── apps/guardian-ui/             # Frontend (Next.js)
│   ├── src/
│   │   ├── app/                  # Next.js pages
│   │   │   ├── page.tsx          # Dashboard
│   │   │   ├── monitor/          # Live monitoring
│   │   │   ├── setup/            # Onboarding
│   │   │   ├── settings/         # User settings
│   │   │   ├── history/          # Alert history
│   │   │   └── profiles/         # Profile management
│   │   ├── components/           # React components
│   │   │   ├── CameraFeed.tsx
│   │   │   ├── AlertPanel.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── LostFoundSetup.tsx
│   │   │   └── ...
│   │   ├── lib/                  # Client utilities
│   │   │   ├── visual-fingerprint.ts  # Lost & Found matching
│   │   │   ├── motion-detection.ts
│   │   │   ├── audio-levels.ts
│   │   │   ├── websocket.ts
│   │   │   └── webrtc-client.ts
│   │   └── stores/               # Zustand stores
│   │       ├── monitoring-store.ts
│   │       ├── lost-found-store.ts
│   │       └── onboarding-store.ts
│   └── ...config files
│
├── tests/                        # Test suites
│   ├── unit/                     # Unit tests
│   └── integration/              # Integration tests
│
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

---

## Configuration

### Environment Variables

Create a `.env` file:

```env
# Ollama (optional - for LLM-enhanced analysis)
OLLAMA_HOST=http://localhost:11434

# Cloud Fallback (optional)
OPENROUTER_API_KEY=sk-or-...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Notifications (optional)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+1...

TELEGRAM_BOT_TOKEN=...

# Browser Push (optional)
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

### Analysis Thresholds

Customize in `src/lib/analysis/profiles/`:

```typescript
// Example: Increase sensitivity for elderly monitoring
export const elderlyProfile = {
  motionThreshold: 0.2,        // Lower = more sensitive
  audioThreshold: 0.3,
  inactivityAlertMinutes: 30,  // Alert after 30 min no motion
  // ...
};
```

---

## Testing

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm test tests/unit/frame-analyzer.test.ts

# Watch mode
pnpm test:watch
```

---

## Deployment

### Static PWA (Recommended)

Deploy to any static host — no server needed:

```bash
cd apps/guardian-ui
pnpm build
```

Deploy the `out` folder to:
- **GitHub Pages** — free, automatic HTTPS
- **Vercel** — zero config
- **Netlify** — drag and drop
- **Any CDN** — it's just static files

### Full Stack (Docker)

Only if you need the server for SMS/Telegram/Ollama:

```bash
docker build -t safeos .
docker run -p 3001:3001 safeos
```

Or with PM2:
```bash
pnpm build
pm2 start dist/index.js --name safeos-api
```

---

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

### Key Principles

1. **Privacy First**: Never store more data than necessary
2. **Fail Safe**: Default to alerting if uncertain
3. **Offline First**: Core features must work without internet
4. **Accessibility**: Design for all users

---

## License

MIT License - Part of Frame's humanitarian mission.

---

## Acknowledgments

- **Frame Team**: For dedicating 10% to humanity
- **Ollama**: For making local AI accessible
- **Open Source Community**: For the tools that make this possible

---

<div align="center">
  <p>
    <strong>Remember:</strong> This tool supplements, never replaces, human care.
  </p>
  <p>
    Built by Frame for humanity's most vulnerable.
  </p>
</div>
