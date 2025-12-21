# SafeOS Guardian - Quick Start Guide

Get up and running with SafeOS Guardian in under 5 minutes.

## 🚀 One-Minute Setup

### 1. Install Ollama (Local AI)

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows
# Download from https://ollama.com/download
```

### 2. Start Ollama and Pull Models

```bash
# Start Ollama server
ollama serve &

# Pull required models (one-time)
ollama pull moondream    # Fast triage (~1.7GB)
ollama pull llava:7b     # Detailed analysis (~4GB)
```

### 3. Start SafeOS

```bash
# From monorepo root
cd packages/safeos

# Install dependencies (first time only)
pnpm install

# Start everything
pnpm run dev
```

### 4. Open the App

Visit [http://localhost:3000](http://localhost:3000)

That's it! You're ready to monitor.

---

## 📖 Step-by-Step Tutorial

### Setting Up Your First Monitor

#### Step 1: Accept the Disclaimer

When you first open SafeOS, you'll see our critical disclaimer. Read it carefully:

> **SafeOS is NOT a replacement for human supervision.**
> This is a supplementary tool only.

Click "I Understand and Accept" to continue.

#### Step 2: Choose a Monitoring Profile

Select what you're monitoring:

| Profile | Best For | What It Watches |
|---------|----------|-----------------|
| 🐕 **Pet** | Dogs, cats, small animals | Eating, bathroom, distress, illness |
| 👶 **Baby** | Infants, toddlers | Crying, movement, breathing, safety |
| 👴 **Elderly** | Seniors, dementia patients | Falls, confusion, prolonged stillness |

#### Step 3: Allow Camera & Microphone

Click "Start Monitoring" and allow browser permissions:
- **Camera**: Required for visual monitoring
- **Microphone**: Optional but recommended for audio alerts

#### Step 4: Position Your Camera

For best results:
- Place camera at eye level with the subject
- Ensure good lighting (avoid backlighting)
- Keep the entire area of interest in frame
- Stable mounting reduces false motion alerts

#### Step 5: Adjust Sensitivity

In the sidebar, adjust:
- **Motion Sensitivity**: Higher = more alerts on movement
- **Audio Sensitivity**: Higher = more alerts on sounds
- **Alert Volume**: How loud escalating alerts play

---

## 🎛️ Configuration Guide

### Alert Escalation

SafeOS uses volume-ramping alerts that get progressively louder:

| Level | Delay | Volume | Sound |
|-------|-------|--------|-------|
| 1 | Immediate | 20% | Soft chime |
| 2 | +30 sec | 40% | Gentle alert |
| 3 | +1 min | 60% | Standard alarm |
| 4 | +2 min | 80% | Urgent alarm |
| 5 | +3 min | 100% | Maximum |

**Acknowledge alerts** at any time to stop escalation.

### Notification Channels

Set up multiple notification methods:

#### Browser Push (Recommended)
1. Go to Settings → Notifications
2. Click "Enable Push Notifications"
3. Allow when prompted

#### Telegram
1. Start a chat with `@SafeOSBot`
2. Send `/start`
3. Copy your chat ID
4. Paste in Settings → Notifications → Telegram

#### SMS (Twilio)
1. Go to Settings → Notifications → SMS
2. Enter your phone number
3. Verify with the code sent

---

## 💡 Tips & Best Practices

### For Pet Monitoring
- Position camera to see food/water bowls
- Include litter box area if monitoring cats
- Use "low" motion sensitivity for sleeping pets
- Enable audio for barking/meowing detection

### For Baby Monitoring
- Camera should see the crib clearly
- Audio sensitivity is crucial for cry detection
- Enable "breathing pattern" detection
- Use nightlight for low-light visibility

### For Elderly Care
- Cover common areas (living room, bathroom entrance)
- Higher motion sensitivity for fall detection
- Set inactivity alerts (e.g., 30 min no movement)
- Include audio for distress calls

---

## 🔧 Troubleshooting

### "Ollama not connected"

```bash
# Check if Ollama is running
curl http://localhost:11434/api/version

# If not, start it
ollama serve
```

### "Camera not working"

1. Check browser permissions (🔒 icon in address bar)
2. Try a different browser (Chrome recommended)
3. Ensure no other app is using the camera

### "Slow analysis"

- First analysis takes longer (model loading)
- Subsequent analyses are faster
- Cloud fallback activates if local is too slow

### "Too many false alerts"

1. Lower motion sensitivity in settings
2. Adjust audio threshold
3. Ensure stable camera mounting
4. Check for moving objects in frame (curtains, shadows)

---

## 📱 Mobile Access

Access SafeOS from your phone:

1. Open the same URL on mobile browser
2. Add to home screen for app-like experience
3. Works offline with local data cache

---

## 🔐 Privacy & Data

### What We Store
- **Local Only**: Frames are processed and discarded
- **5-10 Minute Buffer**: Rolling buffer for context
- **IndexedDB**: Session data stored in your browser
- **No Cloud Upload**: Unless you enable cloud fallback

### What We Don't Store
- Raw video footage
- Audio recordings
- Personal information
- IP addresses (for monitoring)

---

## 📞 Getting Help

- **GitHub Issues**: [Report bugs](https://github.com/supercloud/safeos/issues)
- **Discussions**: [Ask questions](https://github.com/supercloud/safeos/discussions)
- **Email**: support@supercloud.dev

---

## Next Steps

1. **[API Documentation](/api/docs)** - Integrate with other systems
2. **[Advanced Configuration](./CONFIGURATION.md)** - Customize everything
3. **[Contributing](../../CONTRIBUTING.md)** - Help improve SafeOS

---

<div align="center">
  <p>
    <strong>Remember:</strong> SafeOS supplements—never replaces—human care.
  </p>
</div>

