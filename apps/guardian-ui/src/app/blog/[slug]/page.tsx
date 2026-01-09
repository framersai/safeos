/**
 * Blog Article Page
 *
 * Individual blog post display.
 *
 * @module app/blog/[slug]/page
 */

import Link from 'next/link';
import Image from 'next/image';
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
  ];
}

// =============================================================================
// Blog Content
// =============================================================================

const blogContent: Record<string, BlogContent> = {
  'why-we-built-safeos-guardian': {
    slug: 'why-we-built-safeos-guardian',
    title: 'Why We Built SafeOS Guardian',
    date: 'January 8, 2026',
    author: 'Frame.dev Team',
    readTime: '5 min read',
    tags: ['announcement', 'mission', 'privacy'],
    content: (
      <>
        <p className="lead">
          Every parent knows the feeling: you put your baby down for a nap, step into another room,
          and immediately wonder if they&apos;re okay. Traditional baby monitors cost hundreds of dollars,
          require proprietary apps, and often send your video feed to company servers. We knew there
          had to be a better way.
        </p>

        <h2>The Problem We Set Out to Solve</h2>
        <p>
          When we started researching baby monitors, we found three major issues that troubled us:
        </p>
        <ul>
          <li>
            <strong>Cost:</strong> Quality video monitors range from $150 to $400+. For many families,
            this is a significant expense on top of all the other costs of having a baby.
          </li>
          <li>
            <strong>Privacy:</strong> Most modern monitors stream video to cloud servers. Your most
            intimate family moments—your baby sleeping, crying, being comforted—pass through company
            infrastructure. Some monitors have been hacked, exposing families to strangers.
          </li>
          <li>
            <strong>Lock-in:</strong> Buy one brand&apos;s monitor, and you&apos;re stuck with their app, their
            subscription fees, and their ecosystem. When the company shuts down or discontinues support,
            your expensive monitor becomes e-waste.
          </li>
        </ul>

        <h2>Our Solution: Local-First, Free Forever</h2>
        <p>
          SafeOS Guardian takes a radically different approach. Instead of building another expensive
          gadget, we built software that turns any device with a camera into a powerful monitor.
        </p>
        <p>
          Here&apos;s what makes us different:
        </p>
        <ul>
          <li>
            <strong>100% Browser-Based:</strong> No app to download, no account to create. Just visit
            safeos.sh and start monitoring. Works on any phone, tablet, or laptop.
          </li>
          <li>
            <strong>Local Processing:</strong> All video and audio analysis happens on your device using
            TensorFlow.js. Your data never leaves your device—we couldn&apos;t see your camera feed even
            if we wanted to.
          </li>
          <li>
            <strong>Free Forever:</strong> No subscriptions, no premium tiers, no &quot;basic&quot; vs &quot;pro&quot;
            features. Everything is free because we believe monitoring your loved ones shouldn&apos;t be
            a luxury.
          </li>
        </ul>

        <h2>Why Privacy Matters</h2>
        <p>
          We&apos;re developers, but we&apos;re also parents, pet owners, and caregivers. The idea of sending
          video of our sleeping babies to corporate servers feels wrong. Even with the best security
          practices, centralized data creates risks:
        </p>
        <ul>
          <li>Data breaches expose sensitive footage</li>
          <li>Companies can change privacy policies</li>
          <li>Servers can be subpoenaed or hacked</li>
          <li>Business failures can leave your data in limbo</li>
        </ul>
        <p>
          With SafeOS Guardian, these risks don&apos;t exist because your data never leaves your device.
          It&apos;s not just privacy-friendly—it&apos;s privacy by architecture.
        </p>

        <h2>The Technology</h2>
        <p>
          Building powerful AI detection in the browser seemed impossible a few years ago. Thanks to
          TensorFlow.js and modern web APIs, we can now run sophisticated machine learning models
          directly in your browser. This means:
        </p>
        <ul>
          <li>Motion detection that catches even tiny movements</li>
          <li>Audio analysis that can distinguish cry patterns</li>
          <li>Pixel-level monitoring for ultra-sensitive sleep tracking</li>
          <li>Instant alerts with no server round-trip delay</li>
        </ul>
        <p>
          Want to learn more about how it works? Check out our{' '}
          <Link href="/blog/how-safeos-guardian-works" className="text-emerald-400 hover:text-emerald-300">
            technical deep dive
          </Link>.
        </p>

        <h2>10% for Humanity</h2>
        <p>
          If SafeOS Guardian ever generates revenue through donations or optional premium features,
          we&apos;ve committed to donating 10% to humanitarian organizations focused on child safety
          and family welfare. Technology should lift everyone up, not just those who can afford it.
        </p>

        <h2>Join Us</h2>
        <p>
          SafeOS Guardian is open source. You can inspect every line of code, contribute improvements,
          or fork it for your own use. We believe transparency builds trust, and trust is essential
          for something as sensitive as monitoring your loved ones.
        </p>
        <p>
          Visit{' '}
          <a
            href="https://frame.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            Frame.dev
          </a>{' '}
          to see what else we&apos;re building, or star us on{' '}
          <a
            href="https://github.com/super-cloud-mcps/safeos"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            GitHub
          </a>{' '}
          to follow our progress.
        </p>
        <p>
          Together, we can make safety accessible to everyone.
        </p>
        <p className="text-slate-500 italic">— The Frame.dev Team</p>
      </>
    ),
  },
  'how-safeos-guardian-works': {
    slug: 'how-safeos-guardian-works',
    title: 'How SafeOS Guardian Works: A Technical Deep Dive',
    date: 'January 10, 2026',
    author: 'Frame.dev Team',
    readTime: '8 min read',
    tags: ['technical', 'architecture', 'tensorflow'],
    content: (
      <>
        <p className="lead">
          SafeOS Guardian runs entirely in your browser, performing real-time AI analysis without
          sending data to any server. In this post, we&apos;ll explore the technology stack and
          architecture that makes this possible.
        </p>

        <h2>The Local-First Architecture</h2>
        <p>
          Traditional monitoring apps follow a client-server model: your device captures video,
          sends it to a server, the server processes it, and sends results back. This approach
          has several drawbacks: latency, privacy concerns, and infrastructure costs.
        </p>
        <p>
          SafeOS Guardian flips this model. Everything happens on your device:
        </p>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 my-6 font-mono text-sm">
          <div className="text-emerald-400">[Your Device]</div>
          <div className="text-slate-400 ml-4">↓</div>
          <div className="text-slate-300 ml-4">Camera/Microphone → MediaDevices API</div>
          <div className="text-slate-400 ml-4">↓</div>
          <div className="text-slate-300 ml-4">Video Frames → Canvas Processing</div>
          <div className="text-slate-400 ml-4">↓</div>
          <div className="text-slate-300 ml-4">TensorFlow.js → AI Detection</div>
          <div className="text-slate-400 ml-4">↓</div>
          <div className="text-slate-300 ml-4">Alert System → Browser Notifications</div>
          <div className="text-slate-400 ml-4">↓</div>
          <div className="text-slate-300 ml-4">IndexedDB → Local Storage</div>
        </div>

        <h2>Motion Detection: Frame Differencing</h2>
        <p>
          Motion detection uses a technique called frame differencing. We capture video frames
          at regular intervals and compare consecutive frames pixel by pixel. When enough pixels
          change beyond a threshold, we detect motion.
        </p>
        <p>
          The algorithm works like this:
        </p>
        <ol>
          <li>Capture a frame from the video stream</li>
          <li>Convert it to grayscale (faster to compare)</li>
          <li>Compare each pixel to the previous frame</li>
          <li>Count pixels that changed beyond the sensitivity threshold</li>
          <li>If the count exceeds the motion threshold, trigger an alert</li>
        </ol>
        <p>
          For sleep monitoring, we use &quot;pixel detection&quot; mode with ultra-low thresholds
          (3-10 pixels). This catches subtle movements like a sleeping baby stirring or
          chest movements from breathing.
        </p>

        <h2>TensorFlow.js: AI in the Browser</h2>
        <p>
          <a
            href="https://www.tensorflow.org/js"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            TensorFlow.js
          </a>{' '}
          is a JavaScript library for machine learning that runs in the browser. It can use
          WebGL for GPU acceleration, making it fast enough for real-time video analysis.
        </p>
        <p>
          We use TensorFlow.js for:
        </p>
        <ul>
          <li>
            <strong>Motion Analysis:</strong> Beyond simple frame differencing, we use ML models
            to classify motion patterns and reduce false positives from lighting changes.
          </li>
          <li>
            <strong>Audio Classification:</strong> We analyze audio frequency bands to detect
            crying, distress sounds, and unusual noise patterns.
          </li>
          <li>
            <strong>Adaptive Thresholds:</strong> Models learn from your environment to
            automatically adjust sensitivity over time.
          </li>
        </ul>

        <h2>Audio Analysis: Cry Detection</h2>
        <p>
          Audio analysis uses the Web Audio API to capture microphone input and analyze it in
          real-time. We use several techniques:
        </p>
        <ul>
          <li>
            <strong>Volume Threshold:</strong> Basic detection of sounds above a certain decibel level.
          </li>
          <li>
            <strong>Frequency Analysis:</strong> Baby cries have distinctive frequency patterns
            (typically 300-600 Hz fundamental with harmonics). We use FFT (Fast Fourier Transform)
            to analyze frequency content.
          </li>
          <li>
            <strong>Pattern Matching:</strong> Cries have characteristic duration and repetition
            patterns. We track these over time to distinguish crying from other sounds.
          </li>
        </ul>

        <h2>State Management: Zustand</h2>
        <p>
          We use{' '}
          <a
            href="https://github.com/pmndrs/zustand"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            Zustand
          </a>{' '}
          for state management. It&apos;s lightweight (less than 1KB) and works perfectly with
          React. Our stores manage:
        </p>
        <ul>
          <li>Camera and microphone state</li>
          <li>Detection settings and sensitivity</li>
          <li>Alert history and acknowledgments</li>
          <li>User preferences and profiles</li>
        </ul>
        <p>
          Zustand&apos;s persistence middleware automatically saves state to IndexedDB, ensuring
          your settings survive page refreshes and browser restarts.
        </p>

        <h2>Local Storage: IndexedDB</h2>
        <p>
          IndexedDB is a low-level browser API for storing structured data. Unlike localStorage,
          it can handle large amounts of data and supports complex queries. We store:
        </p>
        <ul>
          <li>User settings and preferences</li>
          <li>Alert history with timestamps</li>
          <li>Monitoring profiles for different scenarios</li>
          <li>Sync queue for optional cloud backup</li>
        </ul>
        <p>
          All data stays on your device. If you clear your browser data, it&apos;s gone—we have
          no backup because we never had access in the first place.
        </p>

        <h2>The Tech Stack</h2>
        <p>
          Here&apos;s our complete technology stack:
        </p>
        <ul>
          <li><strong>Next.js 14:</strong> React framework with App Router</li>
          <li><strong>React 18:</strong> UI components with hooks</li>
          <li><strong>TypeScript:</strong> Type safety throughout</li>
          <li><strong>TensorFlow.js:</strong> Browser-based machine learning</li>
          <li><strong>Zustand:</strong> Lightweight state management</li>
          <li><strong>Tailwind CSS:</strong> Utility-first styling</li>
          <li><strong>IndexedDB:</strong> Local data persistence</li>
          <li><strong>Capacitor:</strong> Native mobile app packaging</li>
        </ul>

        <h2>Performance Considerations</h2>
        <p>
          Running AI in the browser presents performance challenges. Here&apos;s how we handle them:
        </p>
        <ul>
          <li>
            <strong>Frame Sampling:</strong> We don&apos;t analyze every frame. Depending on the
            mode, we sample 2-10 frames per second.
          </li>
          <li>
            <strong>Resolution Scaling:</strong> We analyze scaled-down frames (typically 320x240)
            while displaying full resolution.
          </li>
          <li>
            <strong>Web Workers:</strong> Heavy computations run in background threads to keep
            the UI responsive.
          </li>
          <li>
            <strong>Efficient Models:</strong> We use quantized, optimized models designed for
            edge devices.
          </li>
        </ul>

        <h2>What&apos;s Next</h2>
        <p>
          We&apos;re continuously improving SafeOS Guardian. Upcoming features include:
        </p>
        <ul>
          <li>Behavior classification (sleeping, fussy, distressed)</li>
          <li>Multi-device sync with end-to-end encryption</li>
          <li>Smart home integration (HomeKit, Matter)</li>
          <li>Improved cry detection with custom training</li>
        </ul>
        <p>
          Want to contribute? Check out our{' '}
          <a
            href="https://github.com/super-cloud-mcps/safeos"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            GitHub repository
          </a>{' '}
          or reach out to us at{' '}
          <a
            href="mailto:team@frame.dev"
            className="text-emerald-400 hover:text-emerald-300"
          >
            team@frame.dev
          </a>.
        </p>
        <p className="text-slate-500 italic">— The Frame.dev Team</p>
      </>
    ),
  },
};

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
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
