<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  
</head>
<body>

<h1>🚀 VoloNexus.AI</h1>
<p><strong>Autonomous AI Meeting & Event Orchestration Swarm</strong></p>

<p>
VoloNexus.AI is a high-performance, agentic platform designed to automate the lifecycle 
of professional scheduling. It leverages an <strong>Autonomous Agent Swarm</strong> to parse communications, 
detect intent, resolve conflicts, and manage complex timelines using a hybrid intelligence model.
</p>

<hr>

<h2>🛠 Tech Stack</h2>

<table border="1" cellpadding="8" cellspacing="0">
  <thead>
    <tr>
      <th>Category</th>
      <th>Technology</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Backend</td><td>NestJS (Node.js)</td></tr>
    <tr><td>Frontend</td><td>Next.js 14 (App Router), Tailwind CSS</td></tr>
    <tr><td>Database</td><td>MongoDB (via Mongoose)</td></tr>
    <tr><td>Caching</td><td>Upstash Redis</td></tr>
    <tr><td>Event Broker</td><td>Native EventEmitter (Local Pub-Sub Swarm)</td></tr>
    <tr><td>AI Core</td><td>Google Gemini API</td></tr>
    <tr><td>Memory</td><td>Pinecone Vector Database</td></tr>
    <tr><td>Payments</td><td>Stripe (Knight Tier Subscriptions)</td></tr>
    <tr><td>UI/UX</td><td>Framer Motion, Lucide React</td></tr>
  </tbody>
</table>

<hr>

<h2>🔄 System Workflow: Lifecycle of an Event</h2>

<p>VoloNexus.AI operates on an <strong>Event-Driven Architecture</strong>.</p>

<ol>
  <li>
    <h3>📥 Ingestion Layer</h3>
    <ul>
      <li>Monitors connected accounts via Google OAuth</li>
      <li>Captures raw data through Webhooks Module</li>
      <li>Publishes <code>email.received</code> event to Local Pub-Sub Broker</li>
    </ul>
  </li>

  <li>
    <h3>🧠 Analysis Phase (The Swarm)</h3>
    <ul>
      <li><strong>Email Agent:</strong> Classifies intent (Meeting, Cancellation, Reschedule)</li>
      <li><strong>Context Agent:</strong> Fetches user history from Pinecone Vector DB</li>
    </ul>
  </li>

  <li>
    <h3>⚙️ Orchestration & Conflict Resolution</h3>
    <ul>
      <li><strong>Scheduler Agent:</strong> Checks conflicts against MongoDB state</li>
      <li><strong>Finalization:</strong> Sends results via Notification Agent (Dashboard / WhatsApp)</li>
    </ul>
  </li>
</ol>

<hr>

<h2>🧠 Hybrid Scheduling Engine</h2>

<h3>1. AI-Driven Reasoning (Probabilistic)</h3>
<ul>
  <li>Uses Gemini LLM for linguistic understanding</li>
  <li>Extracts structured data:
    <ul>
      <li><strong>Entities:</strong> Titles, participants, timeframes</li>
      <li><strong>Soft Constraints:</strong> e.g., "afternoon", "if possible"</li>
      <li><strong>Intent:</strong> Booking vs Inquiry</li>
    </ul>
  </li>
</ul>

<h3>2. Deterministic Scheduling (Rule-Based)</h3>
<ul>
  <li><strong>Overlapping Logic:</strong> Interval-tree collision detection</li>
  <li><strong>Priority Displacement:</strong> Moves low-priority events if needed</li>
  <li><strong>Resolution Math:</strong> Finds nearest valid time gap</li>
</ul>

<p><strong>Guarantee:</strong> No two events occupy the same millisecond.</p>

<hr>

<h2>🚀 Key Features</h2>

<ul>
  <li>
    <h3>🎙 The Orchestrator Assistant</h3>
    <ul>
      <li>Handles complex queries like: <em>"Move all Monday meetings to Thursday"</em></li>
      <li>120-second long-polling support for deep reasoning workflows</li>
    </ul>
  </li>

  <li>
    <h3>🛡 Knight Tier (Premium)</h3>
    <ul>
      <li>Expands account limit from 2 → 7</li>
      <li>Priority Swarm routing</li>
      <li>Persistent Pinecone memory access</li>
    </ul>
  </li>

  <li>
    <h3>🏛 Root Authority (Admin Dashboard)</h3>
    <ul>
      <li>Real-time swarm health monitoring</li>
      <li>Raw decision logs (progressive rendering)</li>
      <li>OAuth sync & latency tracking</li>
    </ul>
  </li>
</ul>

<hr>

<h2>⚡ Performance & Persistence</h2>

<ul>
  <li><strong>Persistent Hosting:</strong> Optimized for long-running AI tasks (e.g., Render)</li>
  <li><strong>Local Pub-Sub:</strong> Zero-latency agent communication via EventEmitter</li>
  <li><strong>Stable Connectivity:</strong> Forced IPv4 DNS resolution to prevent drops</li>
</ul>

<hr>

<h2>📌 Design Principles</h2>

<ul>
  <li>Event-Driven Architecture</li>
  <li>Hybrid Intelligence (AI + Deterministic)</li>
  <li>Agent-Based Modularity</li>
  <li>Scalable & Fault-Tolerant</li>
</ul>

<hr>

<h2>✨ Vision</h2>

<p>
VoloNexus.AI aims to redefine productivity through fully autonomous orchestration,
removing human friction from scheduling and coordination workflows.
</p>

<hr>

<h3 align="center">VoloNexus.AI — Redefining productivity through autonomous orchestration.</h3>

<hr>

<h2>🚀 Getting Started</h2>

<h3>📋 Prerequisites</h3>
<p>Ensure the following dependencies and services are available before setup:</p>
<ul>
  <li><strong>Node.js (LTS):</strong> Required for both backend and frontend environments</li>
  <li><strong>MongoDB Instance:</strong> Primary database for persistent scheduling state</li>
  <li><strong>Redis (Upstash Recommended):</strong> Used for caching and fast state access</li>
  <li><strong>API Keys:</strong>
    <ul>
      <li>Google Gemini API (AI reasoning engine)</li>
      <li>Stripe (Billing & Knight Tier subscriptions)</li>
      <li>Pinecone (Vector memory system)</li>
      <li>Google OAuth (Account integrations)</li>
    </ul>
  </li>
</ul>

<hr>

<h3>📦 Installation</h3>

<p>Install dependencies for both backend and frontend services:</p>

<pre><code class="language-bash">
# Install Backend Dependencies
cd backend
npm install

# Install Frontend Dependencies
cd frontend
npm install
</code></pre>

<p><strong>Notes:</strong></p>
<ul>
  <li>Ensure environment variables (<code>.env</code>) are properly configured before installation.</li>
  <li>Backend and frontend should be installed in separate directories as per project structure.</li>
</ul>

<hr>

<h3>⚙️ Running the App (Production Mode)</h3>

<p>Build and run both services in optimized production mode:</p>

<pre><code class="language-bash">
# Build and Start Backend
npx tsc -p tsconfig.build.json
npm run start:prod

# Build and Start Frontend
npm run build
npm run start
</code></pre>

<p><strong>Execution Flow:</strong></p>
<ul>
  <li>Backend compiles TypeScript into optimized JavaScript using <code>tsconfig.build.json</code></li>
  <li>Frontend builds a production-ready Next.js bundle</li>
  <li>Both services should be deployed on persistent hosting (e.g., Render) for long-running AI processes</li>
</ul>

<hr>

<h2>🧹 Maintenance & Cache Cleanup</h2>

<p>
Over time, build artifacts and caches can become stale or corrupted, especially in systems with 
heavy AI workflows and long-running processes. Use the following cleanup routines to maintain stability.
</p>

<h3>🖥 Frontend Cleanup</h3>

<pre><code class="language-powershell">
# Remove Next.js cache and build files
Remove-Item .next -Recurse -Force
</code></pre>

<ul>
  <li>Clears cached routes, compiled pages, and stale assets</li>
  <li>Recommended when UI changes are not reflecting correctly</li>
</ul>

<h3>🧠 Backend Cleanup & Rebuild</h3>

<pre><code class="language-powershell">
# Remove distribution folder and TS build info
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Remove-Item -Force *.tsbuildinfo, .tsconfig.tsbuildinfo -ErrorAction SilentlyContinue

# Recompile
npx tsc -p tsconfig.build.json
</code></pre>

<ul>
  <li>Deletes compiled output (<code>dist/</code>) and incremental build metadata</li>
  <li>Forces a clean TypeScript recompilation</li>
  <li>Useful when facing unexpected runtime inconsistencies or type drift</li>
</ul>

<hr>

<h3>💡 Best Practices</h3>

<ul>
  <li>Run cleanup before major deployments to avoid stale artifacts</li>
  <li>Automate cleanup in CI/CD pipelines for consistency</li>
  <li>Monitor Redis cache usage to prevent memory bloat</li>
  <li>Ensure environment variables are securely managed across environments</li>
</ul>

</body>
</html>
