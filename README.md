<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">

</head>

<body>

<h1>Now Live 🚀</h1>

<p>
  <a href="https://volo-nexus-ai.vercel.app/" target="_blank">
    <img src="https://img.shields.io/badge/Visit%20Live%20App-VoloNexus.AI-0A66C2?style=for-the-badge&logo=vercel&logoColor=white" />
  </a>
</p>

<p>
  <b><a href="https://volo-nexus-ai.vercel.app/" target="_blank">
    https://volo-nexus-ai.vercel.app/
  </a></b>
</p>

## Demo
Youtube: https://youtu.be/fM17v5htKC0

<h1>🚀 VoloNexus.AI: Autonomous Scheduling System</h1>

<p>
VoloNexus.AI is a system designed to automate professional scheduling. It processes incoming communication,
detects scheduling intent, resolves conflicts, and updates calendars without continuous user input.
</p>

<p>
The platform operates using multiple independent agents, each responsible for a specific part of the workflow.
</p>

<h2>Preview / Demo</h2>

<table>
  <tr>
    <th align="left">#</th>
    <th align="left">Description</th>
    <th align="center">Resource</th>
  </tr>

  <tr>
    <td>1</td>
    <td>Creating event manually</td>
    <td align="center">
      <a href="https://drive.google.com/file/d/1E-4cjfAXT6K4hdnY6rpW3q4FPF1dOVQj/view?usp=sharing">🔗 View</a>
    </td>
  </tr>

  <tr>
    <td>2</td>
    <td>Logging a bug</td>
    <td align="center">
      <a href="https://drive.google.com/file/d/1Z2ZYzRSmPcfxUhkpS2Y5o4P3705GcIWT/view?usp=sharing">🔗 View</a>
    </td>
  </tr>

  <tr>
    <td>3</td>
    <td>Checking bugs and Admin dashboard</td>
    <td align="center">
      <a href="https://drive.google.com/file/d/1gWgpR4YoazcOLJaAl1L3cDYSljQqHl3c/view?usp=sharing">🔗 View</a>
    </td>
  </tr>

  <tr>
    <td>4</td>
    <td>Cron job scan meeting (received via email after ~4 minutes)</td>
    <td align="center"><i>Internal / No link</i></td>
  </tr>

  <tr>
    <td>5</td>
    <td>
      Google account sync: Add multiple accounts and sync events without duplicates.
      Calendar events are prioritized and won’t be auto-rescheduled. Manual scan required.
    </td>
    <td align="center"><i>Feature note</i></td>
  </tr>
</table>

<h2>Screenshots Preview</h2>

<table>
  <tr>
    <td align="center">
      <b>Events</b><br/>
      <img src="https://github.com/user-attachments/assets/4d33ad03-4e70-45be-8bde-e2de519233c3" width="450"/>
    </td>
    <td align="center">
      <b>Accounts</b><br/>
      <img src="https://github.com/user-attachments/assets/6befb9e4-f415-470e-b17c-75f864870857" width="450"/>
    </td>
  </tr>

  <tr>
    <td align="center">
      <b>Assistant</b><br/>
      <img src="https://github.com/user-attachments/assets/acba60b1-7144-4422-aea6-eff12afaf74b" width="450"/>
    </td>
    <td align="center">
      <b>Reporting Bug</b><br/>
      <img src="https://github.com/user-attachments/assets/e34b781e-2fa4-405e-8dcc-e21a827a048e" width="450"/>
    </td>
  </tr>

  <tr>
    <td align="center">
      <b>Bug Reports</b><br/>
      <img src="https://github.com/user-attachments/assets/d2f7cbf9-492d-4737-8a44-7096ec4e41e6" width="450"/>
    </td>
    <td align="center">
      <b>Events Heatmap</b><br/>
      <img src="https://github.com/user-attachments/assets/9d3be022-e4a6-4f0d-9943-dd867340c23a" width="450"/>
    </td>
  </tr>

  <tr>
    <td align="center">
      <b>Testimonials</b><br/>
      <img src="https://github.com/user-attachments/assets/39fe76de-f5cb-47c7-ae43-9d63de6bbffc" width="450"/>
    </td>
    <td align="center">
      <b>Revenue</b><br/>
      <img src="https://github.com/user-attachments/assets/8074aae4-7da5-415f-9022-a2b8f8879dcd" width="450"/>
    </td>
  </tr>
</table>

<hr>

<h2>1. Architectural Decisions</h2>

<h3>Backend: NestJS</h3>
<ul>
<li>Modular architecture for separating agent logic</li>
<li>Dependency Injection for managing services</li>
<li>EventEmitter used for internal Pub-Sub communication</li>
<li>Supports background jobs (Cron, intervals)</li>
</ul>

<h3>Frontend: Next.js 14</h3>
<ul>
<li>Server-side rendering for faster initial load</li>
<li>Client-side updates for dashboard and assistant</li>
<li>Structured routing using App Router</li>
</ul>

<h3>Database: MongoDB</h3>
<ul>
<li>Flexible schema for different event types</li>
<li>Stores users, events, tokens, and metadata</li>
<li>Schema validation using Mongoose</li>
</ul>

<hr>

<h2>2. Infrastructure & Runtime Behavior</h2>

<h3>2.1 Server Uptime (Render + Health Monitoring)</h3>

<p>
The backend runs on a hosting service that automatically stops inactive servers after a short period.
This creates a problem because background jobs (email scanning, reminders) stop running when the server is inactive.
</p>

<p>
To prevent this, an external monitoring service sends periodic requests to the backend.
</p>

<table border="1" cellpadding="8">
<tr>
<th>Component</th>
<th>Function</th>
</tr>
<tr>
<td>Backend Server</td>
<td>Runs API, agents, and scheduled jobs</td>
</tr>
<tr>
<td>/api/health</td>
<td>Lightweight endpoint used for uptime checks</td>
</tr>
<tr>
<td>Monitoring Service</td>
<td>Sends requests every few minutes to keep server active</td>
</tr>
</table>

<ul>
<li>Ensures background jobs continue running</li>
<li>Prevents loss of scheduled processing</li>
</ul>

<hr>

<h3>2.2 Authentication & Access (Google OAuth)</h3>

<p>
The system connects to user accounts using OAuth 2.0. This allows the backend to read emails and manage calendar events.
</p>

<ul>
<li>User grants permission during login</li>
<li>Backend receives access and refresh tokens</li>
<li>Refresh token is stored securely in the database</li>
</ul>

<table border="1" cellpadding="8">
<tr>
<th>Token Type</th>
<th>Purpose</th>
</tr>
<tr>
<td>Access Token</td>
<td>Used for API requests (short-lived)</td>
</tr>
<tr>
<td>Refresh Token</td>
<td>Used to generate new access tokens</td>
</tr>
</table>

<p>
This allows the system to continue working without requiring the user to log in again.
</p>

<hr>

<h3>2.3 Email Processing & State Management</h3>

<p>
Incoming emails act as the primary input for scheduling.
</p>

<ol>
<li>System fetches unread emails</li>
<li>Email content is analyzed for scheduling intent</li>
<li>Relevant data is extracted (time, participants, constraints)</li>
<li>Email is marked as processed</li>
</ol>

<table border="1" cellpadding="8">
<tr>
<th>Step</th>
<th>Action</th>
</tr>
<tr>
<td>Fetch</td>
<td>Retrieve unread messages</td>
</tr>
<tr>
<td>Analyze</td>
<td>Detect scheduling intent</td>
</tr>
<tr>
<td>Store</td>
<td>Save structured data</td>
</tr>
<tr>
<td>Update</td>
<td>Mark email as processed</td>
</tr>
</table>

<p>
Marking emails prevents repeated processing of the same message.
</p>

<hr>

<h3>2.4 Data Storage & Performance</h3>

<table border="1" cellpadding="8">
<tr>
<th>System</th>
<th>Role</th>
</tr>
<tr>
<td>MongoDB</td>
<td>Primary data storage</td>
</tr>
<tr>
<td>Pinecone</td>
<td>Stores embeddings for preference lookup</td>
</tr>
<tr>
<td>Redis</td>
<td>Caches frequently accessed data</td>
</tr>
</table>

<h4>Pinecone</h4>
<ul>
<li>Stores vector representations of past events</li>
<li>Used to retrieve similar past behavior</li>
</ul>

<h4>Redis</h4>
<ul>
<li>Caches availability data</li>
<li>Reduces repeated external API calls</li>
<li>Improves dashboard performance</li>
</ul>

<hr>

<h2>3. Autonomous Agent System</h2>

<table border="1" cellpadding="8">
<tr>
<th>Agent</th>
<th>Input</th>
<th>Output</th>
</tr>

<tr>
<td>Email Parser</td>
<td>Email content</td>
<td>Structured intent data</td>
</tr>

<tr>
<td>Context Agent</td>
<td>User ID</td>
<td>User preferences and history</td>
</tr>

<tr>
<td>Scheduler</td>
<td>Intent + context</td>
<td>Final scheduling decision</td>
</tr>

<tr>
<td>Notification</td>
<td>Decision</td>
<td>User-facing messages</td>
</tr>
</table>

<hr>

<h2>4. Conflict Resolution System</h2>

<h3>4.1 Detection</h3>
<ul>
<li>Compare new event time with existing events</li>
<li>Check for overlapping intervals</li>
</ul>

<h3>4.2 Priority Handling</h3>

<table border="1" cellpadding="8">
<tr>
<th>Priority Level</th>
<th>Description</th>
</tr>
<tr><td>1</td><td>Low</td></tr>
<tr><td>2</td><td>Medium</td></tr>
<tr><td>3</td><td>High</td></tr>
<tr><td>4</td><td>Critical</td></tr>
</table>

<ul>
<li>If new event has higher priority → existing event may be moved</li>
<li>If lower priority → alternatives are suggested</li>
</ul>

<h3>4.3 Resolution</h3>
<ul>
<li>Find next available time slot</li>
<li>Move lower-priority event if allowed</li>
<li>Notify affected participants</li>
</ul>

<hr>

<h2>5. Assistant (Manual Control)</h2>

<p>
The assistant allows users to interact with the system using natural language.
</p>

<ul>
<li>Accepts commands like rescheduling or deleting events</li>
<li>Translates input into backend function calls</li>
<li>Waits for processing before returning results</li>
</ul>

<p>
Long-running operations are supported by keeping the request open until processing is complete.
</p>

<hr>

<h2>6. Real-Time Updates</h2>

<ul>
<li>System sends updates without requiring page refresh</li>
<li>Used for scheduling changes and alerts</li>
</ul>

<table border="1" cellpadding="8">
<tr>
<th>Channel</th>
<th>Purpose</th>
</tr>
<tr>
<td>WebSocket</td>
<td>Dashboard updates</td>
</tr>
<tr>
<td>Messaging</td>
<td>External notifications</td>
</tr>
</table>

<hr>

<h2>7. Installation & Setup</h2>

<h3>Clone Repository</h3>
<pre><code>
git clone https://github.com/your-repo/VoloNexus.AI.git
cd VoloNexus.AI
</code></pre>

<h3>Backend</h3>
<pre><code>
cd backend
npm install
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue; Remove-Item -Force *.tsbuildinfo, .tsconfig.tsbuildinfo -ErrorAction SilentlyContinue
npx tsc -p tsconfig.build.json                       npm run start:prod 
</code></pre>

<table border="1" cellpadding="8">
<tr><th>Variable</th><th>Purpose</th></tr>
<tr><td>GEMINI_API_KEY</td><td>AI processing</td></tr>
<tr><td>MONGO_URL</td><td>Database</td></tr>
<tr><td>PINECONE_API_KEY</td><td>Vector storage</td></tr>
<tr><td>STRIPE_SECRET_KEY</td><td>Billing</td></tr>
<tr><td>GOOGLE_CLIENT_ID / SECRET</td><td>OAuth</td></tr>
</table>

<h3>Frontend</h3>
<pre><code>
cd ../frontend
npm install
Remove-Item .next -Recurse -Force
npm run build
npm start
</code></pre>

<ul>
<li>NEXT_PUBLIC_API_URL → Backend URL</li>
<li>NEXT_PUBLIC_SOCKET_URL → WebSocket endpoint</li>
</ul>

<hr>

<h2>8. Stripe Local Testing</h2>

<pre><code>
stripe listen --forward-to localhost:8001/api/stripe/webhook
</code></pre>

<hr>

<h2>9. Maintenance</h2>

<pre><code>
Stop-Process -Name "node" -Force
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force dist
</code></pre>

<hr>

<h2>Environmental Variables Needed to Run App</h2>

<p>This project requires environment variables for both frontend and backend services. 
Make sure to configure separate values for <b>local development</b> and <b>production deployment</b>.</p>

---

<h3>Frontend Environment (frontend.env.local)</h3>

<table>
  <thead>
    <tr>
      <th>Variable</th>
      <th>Local Value</th>
      <th>Production Value</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>NEXT_PUBLIC_API_URL</td>
      <td>http://localhost:8001</td>
      <td>https://your-backend-domain.com</td>
      <td>Base URL for backend API requests</td>
    </tr>
    <tr>
      <td>NEXT_PUBLIC_SOCKET_URL</td>
      <td>http://localhost:8001/events</td>
      <td>https://your-backend-domain.com/events</td>
      <td>WebSocket endpoint for real-time events</td>
    </tr>
  </tbody>
</table>

---

<h3>Backend Environment (backend.env)</h3>

<table>
  <thead>
    <tr>
      <th>Variable</th>
      <th>Local Value</th>
      <th>Production Value</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>PORT</td>
      <td>8001</td>
      <td>Provided by hosting (e.g., Render/Vercel)</td>
      <td>Port on which backend server runs</td>
    </tr>
    <tr>
      <td>NODE_ENV</td>
      <td>development</td>
      <td>production</td>
      <td>Environment mode</td>
    </tr>
    <tr>
      <td>MONGO_URL</td>
      <td>Local/Atlas connection string</td>
      <td>Production MongoDB URI</td>
      <td>MongoDB database connection string</td>
    </tr>
    <tr>
      <td>MONGO_DB_NAME</td>
      <td>meetflow</td>
      <td>Production DB name</td>
      <td>Database name</td>
    </tr>
    <tr>
      <td>JWT_SECRET</td>
      <td>Random secure string</td>
      <td>Strong production secret</td>
      <td>Used for signing JWT tokens</td>
    </tr>
    <tr>
      <td>JWT_EXPIRATION</td>
      <td>1d</td>
      <td>1d (or shorter)</td>
      <td>Access token expiry</td>
    </tr>
    <tr>
      <td>JWT_REFRESH_EXPIRATION</td>
      <td>1d</td>
      <td>7d (recommended)</td>
      <td>Refresh token expiry</td>
    </tr>
    <tr>
      <td>ADMIN_EMAIL</td>
      <td>admin mail id</td>
      <td>Secure admin email</td>
      <td>Default admin login email</td>
    </tr>
    <tr>
      <td>ADMIN_PASSWORD</td>
      <td>admin password</td>
      <td>Strong password</td>
      <td>Default admin password</td>
    </tr>
    <tr>
      <td>FRONTEND_URL</td>
      <td>http://localhost:3000</td>
      <td>https://your-frontend-domain.com</td>
      <td>Frontend origin for CORS</td>
    </tr>
    <tr>
      <td>GOOGLE_CLIENT_ID</td>
      <td>Google OAuth client ID</td>
      <td>Same or new production credential</td>
      <td>Used for Google authentication</td>
    </tr>
    <tr>
      <td>GOOGLE_CLIENT_SECRET</td>
      <td>Google OAuth secret</td>
      <td>Production secret</td>
      <td>OAuth client secret</td>
    </tr>
    <tr>
      <td>GOOGLE_CALLBACK_URL</td>
      <td>http://localhost:8001/api/accounts/google/callback</td>
      <td>https://your-backend-domain.com/api/accounts/google/callback</td>
      <td>OAuth redirect URL</td>
    </tr>
    <tr>
      <td>GEMINI_API_KEY</td>
      <td>API key</td>
      <td>Production API key</td>
      <td>Used for AI features</td>
    </tr>
    <tr>
      <td>REDIS_URL</td>
      <td>Local/Upstash Redis URL</td>
      <td>Production Redis URL</td>
      <td>Used for caching and queues</td>
    </tr>
    <tr>
      <td>SUPABASE_URL</td>
      <td>Project URL</td>
      <td>Production Supabase URL</td>
      <td>Backend-as-a-service endpoint</td>
    </tr>
    <tr>
      <td>SUPABASE_KEY</td>
      <td>Publishable key</td>
      <td>Production key</td>
      <td>Public Supabase key</td>
    </tr>
    <tr>
      <td>SUPABASE_ANON_KEY</td>
      <td>Anon key</td>
      <td>Production anon key</td>
      <td>Client-safe key</td>
    </tr>
    <tr>
      <td>SUPABASE_SERVICE_ROLE_KEY</td>
      <td>Service role key</td>
      <td>Production service key</td>
      <td>Admin-level access (keep secret)</td>
    </tr>
    <tr>
      <td>PINECONE_API_KEY</td>
      <td>API key</td>
      <td>Production key</td>
      <td>Vector database access</td>
    </tr>
    <tr>
      <td>PINECONE_ENVIRONMENT</td>
      <td>ap-northeast-1</td>
      <td>Production environment</td>
      <td>Pinecone region</td>
    </tr>
    <tr>
      <td>PINECONE_INDEX</td>
      <td>volonexus-ai-context</td>
      <td>Production index</td>
      <td>Vector index name</td>
    </tr>
    <tr>
      <td>STRIPE_SECRET_KEY</td>
      <td>Test secret key</td>
      <td>Live secret key</td>
      <td>Payment processing key</td>
    </tr>
    <tr>
      <td>STRIPE_WEBHOOK_SECRET</td>
      <td>Local webhook secret</td>
      <td>Production webhook secret</td>
      <td>Stripe webhook verification</td>
    </tr>
  </tbody>
</table>

---

<p align="center">
<strong>VoloNexus.AI — 2026</strong>
</p>

</body>
</html>
