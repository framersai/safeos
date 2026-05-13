/**
 * Blog Article Page
 *
 * Individual blog post display.
 *
 * @module app/blog/[slug]/page
 */

import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import {
  IconChevronLeft,
  IconClock,
  IconUser,
  IconExternalLink,
} from '../../../components/icons';

// =============================================================================
// Types
// =============================================================================

interface BlogContent {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  readTime: string;
  tags: string[];
  content: React.ReactNode;
}

// =============================================================================
// Static Params for Export
// =============================================================================

export function generateStaticParams() {
  return [
    { slug: 'why-we-built-safeos-guardian' },
    { slug: 'how-safeos-guardian-works' },
    { slug: 'inside-the-motion-gated-cv-pipeline' },
  ];
}

// =============================================================================
// Blog Content
// =============================================================================

const blogContent: Record<string, BlogContent> = {
  'why-we-built-safeos-guardian': {
    slug: 'why-we-built-safeos-guardian',
    title: 'I built SafeOS Guardian because the baby monitor market made me angry',
    description:
      'Why I shipped a free, open-source AI baby/pet/elder monitor that runs in the browser instead of paying $300 for a Nanit and trusting a stranger\'s servers with my family\'s video.',
    date: 'January 8, 2026',
    author: 'Johnny Dunn',
    readTime: '6 min read',
    tags: ['open-source', 'baby-monitor', 'privacy', 'mission'],
    content: (
      <>
        <p className="lead">
          The first time I shopped for a baby monitor &mdash; actually shopped, with someone&apos;s
          actual baby in the next room and a credit card open &mdash; I closed the tab. The Nanit Pro
          sat at $250+ in cart, a $5/month cloud subscription on top, and the top Google result
          was a{' '}
          <a
            href="https://www.reddit.com/r/NewDads/comments/1p5js5f/how_do_you_handle_baby_monitoring_without_relying/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            /r/NewDads thread
          </a>{' '}
          of actual parents asking whether there was <em>any</em> way to monitor a baby without
          sending the feed to a corporate server.
        </p>

        <p>
          I&apos;m not a parent. I have a dog who panic-pees when the doorbell rings, and an
          elderly relative who lives alone three time zones away. I don&apos;t have any of the
          credentials that would let me write the standard &quot;as a parent, I...&quot; intro to this post.
          What I have is a webcam, a laptop, opinions about open source, and a stubborn refusal to
          spend $250 to solve a problem that a 5 MB quantized model can solve.
        </p>

        <p>
          So I built{' '}
          <a
            href="https://github.com/framersai/safeos"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            SafeOS Guardian
          </a>
          . MIT license, 158 commits in. No app to download. No account to create. No cloud. Open{' '}
          <a
            href="https://safeos.sh"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            safeos.sh
          </a>
          , give it camera permission, and it works.
        </p>

        <h2>The market is insulting</h2>

        <p>
          The non-WiFi baby monitor section of{' '}
          <a
            href="https://www.forbes.com/sites/forbes-personal-shopper/article/best-non-wifi-baby-monitor/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            Forbes Vetted&apos;s best baby monitor roundup
          </a>{' '}
          has the Infant Optics DXR-8 Pro at $230, hardware that does exactly one thing. The WiFi
          options &mdash; Nanit, Cubo AI, Owlet &mdash; all send video to their own
          infrastructure. Some of them have been hacked.{' '}
          <a
            href="https://arstechnica.com/civis/threads/non-cloud-baby-monitor-or-setup.1471268/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            Ars Technica forum threads
          </a>{' '}
          have parents trading workarounds for the same thing I wanted: monitoring without
          trusting someone else&apos;s servers.
        </p>

        <p>
          The open-source alternatives that exist are mostly Raspberry Pi projects from 2017&ndash;2020:{' '}
          <a
            href="https://opensource.com/article/17/9/gonimo"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            Gonimo
          </a>
          ,{' '}
          <a
            href="https://github.com/lars-frogner/OpenBabyMonitor"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            OpenBabyMonitor
          </a>
          ,{' '}
          <a
            href="https://f-droid.org/packages/de.rochefort.childmonitor/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            F-Droid&apos;s Child Monitor
          </a>
          ,{' '}
          <a
            href="https://github.com/janlucaklees/yuzukam"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            yuzukam
          </a>
          . They&apos;re great if you&apos;re already the kind of person who runs Raspberry Pi
          services. If you just want to point a webcam at a thing and walk away, they&apos;re a lot.
        </p>

        <h2>What I wanted, specifically</h2>

        <p>
          A webcam I already own. A laptop or phone I already own. No app store gatekeeper.
          No login. No subscription that can be jacked up by 30% next year. Open source so anyone
          &mdash; including the actually paranoid security people on Hacker News &mdash; can audit
          the code and confirm that no frames are leaving the device.
        </p>

        <p>
          And actual AI, not the dumb pixel-diff motion detector that every $20 IP camera ships
          with.{' '}
          <a
            href="https://www.tensorflow.org/js"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            TensorFlow.js
          </a>{' '}
          and{' '}
          <a
            href="https://huggingface.co/docs/transformers.js"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            Transformers.js
          </a>{' '}
          finally make that doable in 2025. A quantized{' '}
          <a
            href="https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            COCO-SSD
          </a>{' '}
          weighs about 5 MB. A quantized{' '}
          <a
            href="https://huggingface.co/Xenova/vit-base-patch16-224"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            ViT-base from Xenova
          </a>{' '}
          weighs about 89 MB. Both fit in a service worker cache. Both run on WebGL or WebGPU at
          10&ndash;30 FPS on consumer hardware. Both stay on your device permanently after the first download.
        </p>

        <h2>What SafeOS does, on the merits</h2>

        <p>
          Progressive Web App. Install it, don&apos;t install it, doesn&apos;t matter &mdash; it
          works either way. The detection pipeline is motion-gated (full breakdown in{' '}
          <Link
            href="/blog/inside-the-motion-gated-cv-pipeline"
            className="text-emerald-400 hover:text-emerald-300"
          >
            the next post
          </Link>
          ): pixel-diff at 200 ms and FFT at 100 ms run continuously to spot when something might
          be happening, and only then does the GPU spin up for object detection. Your laptop fans
          stay quiet. Your phone battery lasts the night.
        </p>

        <p>
          Lost &amp; Found is the feature I&apos;m proudest of: upload 1&ndash;5 reference photos of
          a missing pet or person, the browser builds a perceptual fingerprint (32-bin color histogram
          + 8&times;8 Sobel edge grid, under 1 KB per photo), and every candidate frame from the live
          feed gets compared by cosine similarity. Works on cheap hardware. Works at trail-cam image
          quality. Works without sending those reference photos anywhere.
        </p>

        <h2>Part of the Frame ecosystem</h2>

        <p>
          SafeOS is one of the things{' '}
          <a
            href="https://frame.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            Frame
          </a>{' '}
          ships. The bigger thing is{' '}
          <a
            href="https://agentos.sh"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            AgentOS
          </a>
          , an open-source agent runtime with cognitive memory grounded in HEXACO personality traits,{' '}
          <a
            href="https://agentos.sh/en/blog/agentos-memory-sota-longmemeval/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            scoring 85.6% on LongMemEval-S
          </a>{' '}
          (+1.4 over Mastra), with built-in PII redaction and configurable guardrails. There&apos;s
          also{' '}
          <a
            href="https://paracosm.agentos.sh"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            Paracosm
          </a>
          , an agent swarm simulation engine where AI characters with persistent memory inhabit
          shared world models. Same philosophy across all three: local-first, audit-able, no
          surveilling the user.
        </p>

        <h2>10% for humanity</h2>

        <p>
          If SafeOS ever generates revenue, 10% goes to humanitarian organizations focused on child
          safety, animal welfare, and elder care. This isn&apos;t a promise that monetizes well.
          It&apos;s the only commitment that justifies a free tool catching problems the expensive
          tools also miss.
        </p>

        <p>
          Star{' '}
          <a
            href="https://github.com/framersai/safeos"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            the repo
          </a>
          . Audit the code. File issues. The inference pipeline lives in{' '}
          <a
            href="https://github.com/framersai/safeos/blob/master/apps/guardian-ui/src/components/CameraFeed.tsx"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            <code>CameraFeed.tsx</code>
          </a>{' '}
          and{' '}
          <a
            href="https://github.com/framersai/safeos/blob/master/apps/guardian-ui/src/lib/person-detection.ts"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            <code>person-detection.ts</code>
          </a>
          . Nothing is hidden behind a marketing wrapper.
        </p>

        <p>
          Watch your loved ones with software that you, not a vendor, control.
        </p>

        <p className="text-slate-500 italic">&mdash; Johnny Dunn, Frame</p>
      </>
    ),
  },
  'how-safeos-guardian-works': {
    slug: 'how-safeos-guardian-works',
    title: 'How SafeOS Guardian works: motion-gated browser AI that doesn\'t burn your laptop',
    description:
      'Walking through the safeos.sh pipeline file by file. 200ms screening, gated COCO-SSD + ViT inference, Lost & Found fingerprinting. TensorFlow.js + Transformers.js running in a browser, by design.',
    date: 'January 10, 2026',
    author: 'Johnny Dunn',
    readTime: '9 min read',
    tags: ['technical', 'architecture', 'tensorflow.js', 'transformers.js', 'on-device-ai'],
    content: (
      <>
        <p className="lead">
          A few years ago, running real-time computer vision in a browser was a thought experiment.
          You&apos;d see a demo at a conference, somebody&apos;d fire up a Codepen, the laptop fan
          would scream, and you&apos;d nod and move on. As of mid-2025, SafeOS Guardian ships exactly
          that &mdash; a Progressive Web App that runs COCO-SSD and ViT-base on a user&apos;s laptop
          or phone, no cloud round-trip &mdash; and the fan stays quiet. Here&apos;s how.
        </p>

        <h2>The two-tier pipeline</h2>

        <p>
          Every frame goes through a cheap screening layer. Only triggered frames go to the
          expensive deep-learning models. That single design choice &mdash; gating CV inference on
          motion + audio + pixel-change thresholds &mdash; is the difference between &quot;browser AI
          is theoretically possible&quot; and &quot;browser AI runs all night on a phone without
          melting the battery.&quot;
        </p>

        <p>
          Concretely: the screening layer is a <code>setInterval</code> loop at 200 ms running
          pixel-diff motion detection plus a{' '}
          <a
            href="https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            Web Audio AnalyserNode
          </a>{' '}
          FFT at 100 ms. Both are pure math on the CPU. No GPU context, no model loading, no
          service worker thrash. The intervals are constants in{' '}
          <a
            href="https://github.com/framersai/safeos/blob/master/apps/guardian-ui/src/components/CameraFeed.tsx"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            <code>CameraFeed.tsx</code>
          </a>{' '}
          at lines 73&ndash;75:
        </p>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 my-6 font-mono text-sm overflow-x-auto">
          <div className="text-emerald-400">const FRAME_INTERVAL = 1000;<span className="text-slate-500"> // gated frame capture</span></div>
          <div className="text-emerald-400">const MOTION_INTERVAL = 200;<span className="text-slate-500"> // pixel-diff every 200ms</span></div>
          <div className="text-emerald-400">const AUDIO_INTERVAL = 100;<span className="text-slate-500"> // FFT every 100ms</span></div>
        </div>

        <h2>The gate</h2>

        <p>
          Object detection only runs when the screening layer says &quot;something happened.&quot; The
          gate is two lines in{' '}
          <a
            href="https://github.com/framersai/safeos/blob/master/apps/guardian-ui/src/lib/person-detection.ts"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            <code>person-detection.ts</code>
          </a>
          :
        </p>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 my-6 font-mono text-sm overflow-x-auto">
          <div className="text-slate-500">{`// line 271-272: only run AI detection if motion was detected`}</div>
          <div className="text-emerald-400">if (!motionTriggered) return null;</div>
        </div>

        <p>
          No motion, no inference. The GPU stays in its low-power state. COCO-SSD&apos;s{' '}
          <code>model.detect()</code> only fires when something in the frame moved enough to cross
          the per-scenario threshold (configurable in settings &mdash; different thresholds for
          babies, pets, security). The pipeline can theoretically push 10&ndash;30 FPS through
          COCO-SSD on WebGL/WebGPU, but in practice it averages a fraction of a Hz because most
          frames don&apos;t pass the gate.
        </p>

        <h2>Two models, one fallback</h2>

        <p>
          Primary detector: a quantized{' '}
          <a
            href="https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            COCO-SSD
          </a>{' '}
          via{' '}
          <a
            href="https://www.tensorflow.org/js"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            TensorFlow.js
          </a>
          . ~5 MB on the wire, downloaded once on first model load, cached by the service worker
          forever after. Spots 80+ object classes with bounding boxes. The detection canvas is 320&times;240
          (model input size) regardless of the source video resolution.
        </p>

        <p>
          Tie-breaker: a quantized{' '}
          <a
            href="https://huggingface.co/Xenova/vit-base-patch16-224"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            Xenova/vit-base-patch16-224
          </a>{' '}
          via{' '}
          <a
            href="https://huggingface.co/docs/transformers.js"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            Transformers.js
          </a>
          . ~89 MB, downloaded on-demand only when COCO-SSD&apos;s top prediction is below the
          per-scenario confidence threshold. ViT-base is heavier but better at fine-grained scene
          labeling, useful for ambiguous frames (&quot;is this person standing or fallen?&quot;).
        </p>

        <p>
          For really hard scenes, you can configure an optional bridge to a local{' '}
          <a
            href="https://ollama.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            Ollama
          </a>{' '}
          install on the same LAN &mdash; moondream, llava:7b, or llama3.2-vision &mdash; for richer
          scene reasoning. Nothing leaves your network. For when even Ollama isn&apos;t enough you
          can plug in your own OpenAI / Anthropic / Gemini keys; cloud fallback only fires on the
          frames the local models couldn&apos;t classify confidently.
        </p>

        <h2>Audio FFT, not an audio model</h2>

        <p>
          Cry detection, distress vocalizations, glass break, sustained silence &mdash; none of
          these need a model. The Web Audio API&apos;s{' '}
          <code>AnalyserNode</code> with <code>fftSize = 256</code> gives 128 frequency bins,
          sampled every ~100 ms. Threshold the right bins and you get most of what a small audio
          classifier would give you, at a fraction of the cost. Baby cries cluster in the
          300&ndash;600 Hz fundamental with characteristic harmonic patterns; glass breaks are
          mostly high-frequency transients; silence is the absence of energy across the spectrum.
        </p>

        <h2>Lost &amp; Found: 32 + 64 + 1 KB</h2>

        <p>
          The matcher doesn&apos;t use a deep model at all. Reference photos reduce to three
          signatures: a 32-bin color histogram, the top-5 dominant colors via k-means, and an 8&times;8
          Sobel-derived edge grid. Total: under 1 KB per reference photo. The matcher samples the
          live feed at 1&ndash;2 FPS and compares each candidate frame by cosine similarity. Code:{' '}
          <a
            href="https://github.com/framersai/safeos/blob/master/apps/guardian-ui/src/lib/visual-fingerprint.ts"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            <code>visual-fingerprint.ts</code>
          </a>
          .
        </p>

        <p>
          Why this matters: a 32-bin histogram + an 8&times;8 edge grid generalizes well enough to
          match a dog at different angles and distances, without needing a face-embedding model
          you&apos;d have to keep updated. It&apos;s cheap, transparent, and runs at sample rate.
          The full Lost &amp; Found loop lives in{' '}
          <a
            href="https://github.com/framersai/safeos/blob/master/apps/guardian-ui/src/app/monitor/page.tsx"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            <code>monitor/page.tsx</code>
          </a>{' '}
          around lines 242&ndash;254.
        </p>

        <h2>Same philosophy as AgentOS</h2>

        <p>
          SafeOS isn&apos;t the only thing{' '}
          <a
            href="https://frame.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            Frame
          </a>{' '}
          ships under the &quot;local-first AI&quot; banner.{' '}
          <a
            href="https://agentos.sh"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            AgentOS
          </a>{' '}
          is the agent runtime side &mdash; same idea, different domain. AgentOS&apos;s memory
          layer is{' '}
          <a
            href="https://docs.agentos.sh/features/cognitive-memory"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            grounded in cognitive science
          </a>{' '}
          instead of throwing a fixed-window context buffer at the LLM and hoping, and it{' '}
          <a
            href="https://agentos.sh/en/blog/agentos-memory-sota-longmemeval/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            scores 85.6% on LongMemEval-S
          </a>{' '}
          (+1.4 over Mastra) at under $0.009 per correct retrieval with GPT-4o. AgentOS&apos;s
          tool-forging is gated on a similar &quot;only when needed&quot; principle as SafeOS&apos;s
          CV inference:{' '}
          <a
            href="https://docs.agentos.sh/features/emergent-capabilities"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            agents create Zod-validated functions on demand
          </a>
          , then reuse them in a sandboxed V8 context. Same instinct: don&apos;t pay the cost until
          you need to.
        </p>

        <h2>The state management is boring</h2>

        <p>
          State is{' '}
          <a
            href="https://github.com/pmndrs/zustand"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            Zustand
          </a>{' '}
          (lightweight, persist middleware writes to IndexedDB) and the UI is Next.js 14 + React 18
          + Tailwind. No magic. The interesting parts of the codebase are the pipeline files in{' '}
          <code>src/lib/</code>, not the React shell.
        </p>

        <h2>What&apos;s broken</h2>

        <p>
          PWA install on iOS is still rough &mdash; Safari&apos;s installation flow isn&apos;t
          great, and background audio capture has well-known limits. ViT-base&apos;s 89 MB download
          is real; on slow connections the first load is slow. Browser fingerprint matching
          isn&apos;t as good as a proper face-embedding model would be, but the trade-off is no
          model to keep updated and no PII leakage. Most of these are tracked in{' '}
          <a
            href="https://github.com/framersai/safeos/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            GitHub issues
          </a>
          .
        </p>

        <p>
          The honest version is: SafeOS is rough, occasionally inelegant, and runs on engineering
          decisions I&apos;m going to second-guess in six months. But it works, it&apos;s free,
          it&apos;s MIT-licensed, and it doesn&apos;t send your camera feed to a stranger&apos;s
          server. If you want to read about the most consequential of those decisions &mdash; the
          motion gate that keeps the GPU idle &mdash; the{' '}
          <Link
            href="/blog/inside-the-motion-gated-cv-pipeline"
            className="text-emerald-400 hover:text-emerald-300"
          >
            next post
          </Link>{' '}
          is just about that.
        </p>

        <p className="text-slate-500 italic">&mdash; Johnny Dunn, Frame</p>
      </>
    ),
  },
  'inside-the-motion-gated-cv-pipeline': {
    slug: 'inside-the-motion-gated-cv-pipeline',
    title: 'The lie on my landing page: how SafeOS actually gates CV inference',
    description:
      'SafeOS used to claim every frame goes through computer vision models. It doesn\'t. The pipeline is motion-gated by design, and that one boolean check is the most important design decision in the codebase.',
    date: 'May 13, 2026',
    author: 'Johnny Dunn',
    readTime: '6 min read',
    tags: ['technical', 'motion-gating', 'tensorflow.js', 'on-device-ai', 'lessons-learned'],
    content: (
      <>
        <p className="lead">
          Until last week, the SafeOS landing page said this:
        </p>

        <blockquote className="border-l-4 border-amber-500/50 pl-4 py-2 my-6 text-amber-200/90 italic">
          &quot;Every frame is analyzed by computer vision models running locally on your device.&quot;
        </blockquote>

        <p>
          Reader, that was a lie. Not a malicious one &mdash; I shipped that copy six months ago
          when I was excited about the model loading working at all &mdash; but a lie. Every frame
          is <em>not</em> analyzed by computer vision models. Most frames don&apos;t hit a model at
          all. The pipeline is motion-gated, by design, and it has to be, because running TF.js
          inference on every video frame would melt a phone in twenty minutes.
        </p>

        <p>
          This post walks through the actual pipeline. It&apos;s also the post I should have
          written before I wrote the marketing copy.
        </p>

        <h2>What I claimed vs. what runs</h2>

        <p>
          The claim: every frame &rarr; COCO-SSD &rarr; bounding boxes &rarr; alerts.
        </p>

        <p>
          The reality: every frame &rarr; cheap pixel-diff motion screening &rarr; if (and only if)
          motion crosses threshold &rarr; COCO-SSD. The motion screening runs on the CPU at
          5&ndash;10 Hz, never touches the GPU, and decides whether to spin up the actual
          deep-learning models.
        </p>

        <p>
          The gate is two lines in{' '}
          <a
            href="https://github.com/framersai/safeos/blob/master/apps/guardian-ui/src/lib/person-detection.ts"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            <code>person-detection.ts</code>
          </a>
          , at lines 271&ndash;272:
        </p>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 my-6 font-mono text-sm overflow-x-auto">
          <div className="text-slate-500">{`// no motion = no inference. the GPU stays asleep.`}</div>
          <div className="text-emerald-400">if (!motionTriggered) return null;</div>
        </div>

        <p>
          No motion &rarr; return null &rarr; GPU never wakes up. That single check is the
          difference between &quot;cool laptop&quot; and &quot;turbofan&quot; for the user.
        </p>

        <h2>The accurate two-tier diagram</h2>

        <p>
          The architecture SVG on safeos.sh shows the gate now (we shipped the diagram update along
          with this post). The flow:
        </p>

        <ol>
          <li>Camera, microphone, and reference photos feed into a per-frame screening pill</li>
          <li>
            Screening runs continuously: pixel-diff motion at 200 ms, FFT audio analysis at 100 ms,
            pixel-change tracking. All cheap. All on the CPU.
          </li>
          <li>
            <em>Only</em> when something crosses threshold does the frame get handed to TF.js for
            COCO-SSD detection
          </li>
          <li>
            Ambiguous detections fall through to ViT-base (Transformers.js) as a tie-breaker
          </li>
          <li>
            Confident detections feed the alert engine; everything else gets dropped on the floor
          </li>
        </ol>

        <h2>Why I built it this way</h2>

        <p>
          Three reasons, ordered by how much they actually mattered at design time.
        </p>

        <p>
          <strong>Battery and thermal.</strong> Phones have thermal envelopes. A laptop without a
          fan (an M-series MacBook Air, a Chromebook, anything passive) has even less. COCO-SSD at
          30 FPS sustained for 8 hours overnight melts that envelope. Gating the inference means
          the GPU stays in its idle state for hours at a time. The fan doesn&apos;t spin up. The
          phone stays in your pocket without burning your leg.
        </p>

        <p>
          <strong>Honest signal.</strong> Pixel-diff motion + audio FFT + pixel-change counting
          handle 90% of the &quot;is something happening?&quot; question already. Adding CV
          inference on top of that is for the part where you want to know <em>what</em> happened
          &mdash; was that motion a person, a pet, the curtain blowing? You don&apos;t need a 5 MB
          model running 24/7 to answer that question. You need it running for the few seconds
          around an event.
        </p>

        <p>
          <strong>Same idea as agent tool-forging.</strong> The{' '}
          <a
            href="https://agentos.sh"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            AgentOS
          </a>{' '}
          runtime, the Frame project I work on most days, uses the same &quot;don&apos;t do the
          expensive thing until you have to&quot; principle:{' '}
          <a
            href="https://docs.agentos.sh/features/emergent-capabilities"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            agents create Zod-validated tools on demand
          </a>{' '}
          in a sandboxed V8 context, not preemptively. Gated CV inference in SafeOS is the same
          move, applied to a different domain.
        </p>

        <h2>The numbers</h2>

        <ul>
          <li><code>MOTION_INTERVAL = 200</code> ms (5 FPS screening)</li>
          <li><code>AUDIO_INTERVAL = 100</code> ms (10 FPS FFT)</li>
          <li><code>FRAME_INTERVAL = 1000</code> ms (1 Hz gated capture)</li>
          <li><code>analyserRef.fftSize = 256</code> (audio FFT bin count)</li>
          <li>Detection canvas: 320&times;240 (model input size)</li>
          <li>
            <a
              href="https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300"
            >
              COCO-SSD
            </a>
            : ~5 MB quantized, 10&ndash;30 FPS achievable on WebGL/WebGPU when it runs
          </li>
          <li>
            <a
              href="https://huggingface.co/Xenova/vit-base-patch16-224"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300"
            >
              ViT-base
            </a>
            : ~89 MB quantized, tie-breaker only
          </li>
          <li>Lost &amp; Found: 32-bin color histogram + 8&times;8 Sobel grid &lt; 1 KB / photo</li>
        </ul>

        <h2>What I learned shipping the wrong copy</h2>

        <p>
          Two things. First, marketing copy and engineering reality drift apart fast when nobody
          re-reads them side by side. The fix isn&apos;t to be more careful &mdash; careful people
          still ship wrong copy &mdash; it&apos;s to re-audit the marketing against the code every
          time the code changes meaningfully.
        </p>

        <p>
          Second: static analysis is underrated. The thing the LLM-era AI industry undersells is
          that 90% of &quot;intelligence&quot; in a real-time pipeline is non-AI math &mdash;
          pixel-diff, FFT bins, motion vectors. The 10% that&apos;s actual deep learning matters a
          lot, but only when you need it. SafeOS&apos;s gate isn&apos;t a fancy technique. It&apos;s
          a boolean and an early return. It is also the single most important design decision in
          the whole codebase.
        </p>

        <p>
          The corrected landing copy and the updated architecture diagram are live now. The full
          pipeline is open source at{' '}
          <a
            href="https://github.com/framersai/safeos"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            github.com/framersai/safeos
          </a>
          . If you find another lie in the marketing copy, please{' '}
          <a
            href="https://github.com/framersai/safeos/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            file an issue
          </a>
          . The honest version is always better.
        </p>

        <p className="text-slate-500 italic">&mdash; Johnny Dunn, Frame</p>
      </>
    ),
  },
};

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const post = blogContent[params.slug];

  if (!post) {
    return {
      title: 'Post Not Found',
      robots: { index: false, follow: false },
    };
  }

  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    alternates: {
      canonical: `/blog/${post.slug}/`,
    },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url: `/blog/${post.slug}/`,
      publishedTime: new Date(post.date).toISOString(),
      authors: [post.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  };
}

// =============================================================================
// Main Page
// =============================================================================

export default function BlogArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const post = blogContent[params.slug];

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Post Not Found</h1>
          <p className="text-slate-400 mb-8">
            The blog post you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/blog"
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://safeos.sh').replace(/\/+$/, '');
  const articleUrl = `${siteUrl}/blog/${post.slug}/`;
  const publishedTime = new Date(post.date).toISOString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.description,
            datePublished: publishedTime,
            dateModified: publishedTime,
            author: {
              '@type': 'Organization',
              name: post.author,
            },
            publisher: {
              '@type': 'Organization',
              name: 'Frame',
              url: 'https://frame.dev',
              logo: {
                '@type': 'ImageObject',
                url: `${siteUrl}/logos/frame.svg`,
              },
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': articleUrl,
            },
          }),
        }}
      />
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/blog"
                className="flex items-center gap-2 text-slate-400 hover:text-white"
              >
                <IconChevronLeft size={20} />
                <span className="hidden sm:inline">All Posts</span>
              </Link>
            </div>
            <a
              href="https://frame.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-slate-400 hover:text-white text-sm"
            >
              Frame.dev
              <IconExternalLink size={14} />
            </a>
          </div>
        </div>
      </header>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <header className="mb-12">
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <IconClock size={14} />
              {post.date}
            </span>
            <span className="flex items-center gap-1">
              <IconUser size={14} />
              {post.author}
            </span>
            <span>{post.readTime}</span>
          </div>
        </header>

        {/* Content */}
        <div className="prose prose-invert prose-emerald max-w-none [&_h2]:text-white [&_h2]:text-[1.5rem] [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-4 [&_p]:text-slate-300 [&_p]:leading-relaxed [&_p]:mb-4 [&_.lead]:text-lg [&_.lead]:text-slate-400 [&_ul]:text-slate-300 [&_ul]:mb-4 [&_ul]:pl-6 [&_ol]:text-slate-300 [&_ol]:mb-4 [&_ol]:pl-6 [&_li]:mb-2 [&_strong]:text-white [&_a]:text-emerald-400 [&_a:hover]:text-emerald-300">
          {post.content}
        </div>

        {/* Share / Author */}
        <footer className="mt-16 pt-8 border-t border-slate-700">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
              <Image
                src="/logos/frame.svg"
                alt="Frame.dev"
                width={32}
                height={32}
                className="invert"
              />
            </div>
            <div>
              <p className="font-medium text-white">Frame.dev Team</p>
              <p className="text-sm text-slate-400">
                Building tools for humanity.{' '}
                <a
                  href="https://frame.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  Learn more →
                </a>
              </p>
            </div>
          </div>
        </footer>

        {/* Navigation */}
        <nav className="mt-12 flex justify-center gap-4">
          <Link
            href="/blog"
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
          >
            All Posts
          </Link>
          <Link
            href="/about"
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
          >
            About SafeOS
          </Link>
        </nav>
      </article>
    </div>
  );
}
