import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Check,
  Copy,
  Key,
  LockKey,
  MapTrifold,
  Package,
  Truck,
  WarningCircle,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

const tokenCurl = `curl --request POST "$LOGIFLOW_API_URL/api/v1/api-keys/token" \\
  --header "x-api-key: $LOGIFLOW_API_KEY" \\
  --header "Content-Type: application/json"`;

const createShipmentCurl = `curl --request POST "$LOGIFLOW_API_URL/api/v1/shipments" \\
  --header "Authorization: Bearer $LOGIFLOW_ACCESS_TOKEN" \\
  --header "Content-Type: application/json" \\
  --data '{
    "pickupBranchId": "YOUR_BRANCH_ID",
    "recipientName": "Jordan Lee",
    "recipientPhone": "+15551234567",
    "recipientEmail": "jordan@example.com",
    "recipientAddress": "12 Market Street, Colombo",
    "recipientLat": 6.9271,
    "recipientLng": 79.8612,
    "weightKg": 1.4,
    "lengthCm": 24,
    "widthCm": 18,
    "heightCm": 8,
    "priority": "STANDARD"
  }'`;

const nodeExample = `const apiUrl = process.env.LOGIFLOW_API_URL;
const apiKey = process.env.LOGIFLOW_API_KEY;

async function getAccessToken() {
  const response = await fetch(\`${'${apiUrl}'}/api/v1/api-keys/token\`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey },
  });

  if (!response.ok) throw new Error(\`Token request failed: \${response.status}\`);
  const { accessToken } = await response.json();
  return accessToken;
}

async function createShipment(shipment) {
  const accessToken = await getAccessToken();
  const response = await fetch(\`${'${apiUrl}'}/api/v1/shipments\`, {
    method: 'POST',
    headers: {
      Authorization: \`Bearer \${accessToken}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(shipment),
  });

  if (!response.ok) throw new Error(\`Shipment request failed: \${response.status}\`);
  return response.json();
}`;

const sections = [
  { id: 'overview', label: 'Platform overview' },
  { id: 'workflow', label: 'How LogiFlow works' },
  { id: 'roles', label: 'Roles and access' },
  { id: 'api-setup', label: 'Create an API key' },
  { id: 'authentication', label: 'Authenticate requests' },
  { id: 'create-shipment', label: 'Create a shipment' },
  { id: 'api-reference', label: 'API reference' },
  { id: 'security', label: 'Security and limits' },
];

function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-surface-5 bg-[#0c0c0c]">
      <div className="flex items-center justify-between border-b border-surface-5 px-4 py-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted">{language}</span>
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg"
          aria-label={copied ? 'Copied code' : 'Copy code'}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-6 text-fg sm:text-[13px]"><code>{code}</code></pre>
    </div>
  );
}

function Section({ id, eyebrow, title, children }: {
  id: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 border-b border-surface-5 py-10 first:pt-0 sm:py-12">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-status-available">{eyebrow}</p>
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      <div className="mt-5 space-y-5 text-sm leading-7 text-fg-muted">{children}</div>
    </section>
  );
}

function Callout({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'warning' }) {
  return (
    <div className={`flex gap-3 rounded-2xl border p-4 ${tone === 'warning' ? 'border-status-break/30 bg-status-break/[0.06]' : 'border-surface-5 bg-surface-2'}`}>
      {tone === 'warning' ? (
        <WarningCircle size={20} className="mt-0.5 shrink-0 text-status-break" />
      ) : (
        <LockKey size={20} className="mt-0.5 shrink-0 text-fg-muted" />
      )}
      <div className="text-sm leading-6 text-fg-muted">{children}</div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, children }: { icon: typeof Package; title: string; children: ReactNode }) {
  return (
    <article className="rounded-2xl border border-surface-5 bg-surface-2 p-5">
      <Icon size={22} className="mb-3 text-status-available" />
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-fg-muted">{children}</p>
    </article>
  );
}

export default function Docs() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-32 sm:px-6 sm:pt-36 lg:px-8">
      <header className="relative mb-10 overflow-hidden rounded-[2rem] border border-surface-5 bg-surface-2 p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-28 h-72 w-72 rounded-full bg-status-available/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-status-available/25 bg-status-available/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-status-available">
            <Key size={14} /> Platform guide
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">LogiFlow documentation</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-fg-muted sm:text-base">
            Learn how shipments move through LogiFlow, how teams use the operations platform, and how to connect an external system with the REST API.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/register">Create a workspace <ArrowUpRight size={16} /></Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/login">Open your dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
        <nav aria-label="Documentation sections" className="h-fit lg:sticky lg:top-28">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-fg-muted">On this page</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-col">
            {sections.map(({ id, label }, index) => (
              <a
                key={id}
                href={`#${id}`}
                className="flex min-w-0 items-center gap-2 rounded-lg border border-surface-5 bg-surface-2 px-2 py-2 text-[11px] leading-4 text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg sm:px-3 sm:text-xs lg:border-transparent lg:bg-transparent"
              >
                <span className="shrink-0 font-mono text-[10px] text-surface-5">{String(index + 1).padStart(2, '0')}</span>
                <span className="min-w-0">{label}</span>
              </a>
            ))}
          </div>
        </nav>

        <main className="min-w-0">
          <Section id="overview" eyebrow="01 / Overview" title="One workspace for the delivery lifecycle">
            <p>
              LogiFlow is a multi tenant logistics platform for managing delivery teams, dispatching shipments, and sharing delivery progress with recipients. Business data is separated by organization, while team access is controlled by role.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <FeatureCard icon={Package} title="Shipment operations">
                Create individual shipments, import a CSV or Excel file, review status, retry dispatch, and manage delivery exceptions.
              </FeatureCard>
              <FeatureCard icon={MapTrifold} title="Dispatch and tracking">
                Review the dispatch queue, compare eligible drivers, follow active trips on a live map, and share public tracking references.
              </FeatureCard>
              <FeatureCard icon={Truck} title="Driver and fleet tools">
                Manage vehicles and driver eligibility. Drivers use the Driver Portal to manage a shift, respond to offers, and update delivery progress.
              </FeatureCard>
            </div>
          </Section>

          <Section id="workflow" eyebrow="02 / Workflow" title="From order to confirmed delivery">
            <ol className="space-y-4">
              {[
                ['Set up the workspace', 'A business administrator adds depots, invites dispatchers and drivers, assigns vehicles, and configures dispatch preferences.'],
                ['Create a shipment', 'A dispatcher enters the recipient, parcel dimensions, pickup depot, priority, and delivery window. Integrations can create shipments through the REST API.'],
                ['Dispatch to a driver', 'LogiFlow ranks eligible drivers using distance, vehicle capacity, and shift availability. Offers are sent to drivers, and dispatchers can monitor or intervene.'],
                ['Track the delivery', 'The driver updates pickup and delivery progress. Operations staff can follow active fleet activity, and recipients can use the public tracking reference.'],
                ['Confirm the handoff', 'A recipient verification code is used to complete delivery. Shipment status and operational history are then available to the team.'],
              ].map(([title, body], index) => (
                <li key={title} className="flex gap-4 rounded-2xl border border-surface-5 bg-surface-2 p-4 sm:p-5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-surface-3 font-mono text-xs text-status-available">0{index + 1}</span>
                  <div><h3 className="font-semibold text-fg">{title}</h3><p className="mt-1 text-sm leading-6">{body}</p></div>
                </li>
              ))}
            </ol>
          </Section>

          <Section id="roles" eyebrow="03 / Access" title="Roles in a workspace">
            <div className="overflow-hidden rounded-2xl border border-surface-5 bg-surface-2">
              <div className="grid grid-cols-[140px_minmax(0,1fr)] border-b border-surface-5 bg-surface-3/60 px-4 py-3 text-xs font-semibold text-fg sm:grid-cols-[180px_minmax(0,1fr)]"><span>Role</span><span>Typical access</span></div>
              {[
                ['Business admin', 'Workspace settings, depots, team access, API keys, fleet and delivery operations.'],
                ['Dispatcher', 'Shipment queue, dispatch tools, fleet map, and day to day delivery operations.'],
                ['Driver', 'Personal driver profile, shift controls, delivery offers, active jobs, and delivery updates.'],
              ].map(([role, description]) => <div key={role} className="grid grid-cols-[140px_minmax(0,1fr)] gap-3 border-b border-surface-5 px-4 py-3 text-xs last:border-0 sm:grid-cols-[180px_minmax(0,1fr)]"><span className="font-medium text-fg">{role}</span><span>{description}</span></div>)}
            </div>
          </Section>

          <Section id="api-setup" eyebrow="04 / API setup" title="Create an API key">
            <p>API keys are managed by a business administrator in <strong className="font-semibold text-fg">Dashboard → Settings → API Keys</strong>.</p>
            <ol className="list-decimal space-y-2 pl-5 marker:text-fg">
              <li>Choose <strong className="text-fg">Create API Key</strong> and give it a name that identifies the integration.</li>
              <li>Select only the scopes the integration needs: <code className="rounded bg-surface-3 px-1.5 py-0.5 text-fg">shipments:write</code> to create shipments and look up pickup depots, and <code className="rounded bg-surface-3 px-1.5 py-0.5 text-fg">shipments:read</code> to read a shipment by ID.</li>
              <li>Optionally add the integration server&apos;s public IP addresses to the allowlist. Leave the list empty only when the integration does not have stable outbound IPs.</li>
              <li>Copy the secret when it is shown. LogiFlow stores a hash and does not show the secret again.</li>
            </ol>
            <Callout tone="warning"><strong className="text-fg">Treat the key as a password.</strong> Store it in your server&apos;s secret manager or environment configuration. Never put it in browser JavaScript, a mobile app bundle, source control, or a public support ticket.</Callout>
          </Section>

          <Section id="authentication" eyebrow="05 / Authentication" title="Exchange the key for a short lived token">
            <p>Send the API key to the token endpoint using the <code className="rounded bg-surface-3 px-1.5 py-0.5 text-fg">x-api-key</code> header. The response contains a bearer access token valid for one hour. Exchange the key again when the token expires; API key tokens do not include a refresh token.</p>
            <CodeBlock code={tokenCurl} />
            <p>Use the returned <code className="rounded bg-surface-3 px-1.5 py-0.5 text-fg">accessToken</code> as a bearer token on protected API calls. Set the API URL to the LogiFlow gateway origin supplied by your deployment administrator. For local development, the gateway commonly runs at <code className="rounded bg-surface-3 px-1.5 py-0.5 text-fg">http://localhost:3000</code>.</p>
            <Callout>Keep both the API key and access token in server side code. Use HTTPS for production integrations.</Callout>
          </Section>

          <Section id="create-shipment" eyebrow="06 / First integration" title="Create a shipment from your project">
            <p>Use your API token to create a shipment. First call <code className="rounded bg-surface-3 px-1.5 py-0.5 text-fg">GET /api/v1/branches</code> with the same token to find your depot ID. Keep credentials in environment variables.</p>
            <CodeBlock code={createShipmentCurl} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-surface-5 bg-surface-2 p-4"><h3 className="text-sm font-semibold text-fg">Required fields</h3><p className="mt-2 text-xs leading-6">Pickup branch ID, recipient name, phone and address, parcel weight, and length, width, and height in centimeters.</p></div>
              <div className="rounded-2xl border border-surface-5 bg-surface-2 p-4"><h3 className="text-sm font-semibold text-fg">Optional fields</h3><p className="mt-2 text-xs leading-6">Recipient email and coordinates, delivery window, and priority. Priority values are STANDARD, EXPRESS, or URGENT.</p></div>
            </div>
            <p>The response includes the created shipment and its tracking reference. Share that reference with the recipient using your own order confirmation flow.</p>
            <details className="group rounded-2xl border border-surface-5 bg-surface-2">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-fg">Node.js server example <span className="float-right text-fg-muted group-open:rotate-180">⌄</span></summary>
              <div className="border-t border-surface-5 p-3"><CodeBlock code={nodeExample} language="javascript" /></div>
            </details>
          </Section>

          <Section id="api-reference" eyebrow="07 / API reference" title="Available integration endpoints">
            <p>All REST endpoints use the gateway prefix <code className="rounded bg-surface-3 px-1.5 py-0.5 text-fg">/api/v1</code>. The key scopes currently cover the endpoints shown below.</p>
            <div className="overflow-x-auto rounded-2xl border border-surface-5">
              <table className="w-full min-w-[620px] border-collapse bg-surface-2 text-left text-xs">
                <thead className="bg-surface-3/70 text-fg-muted"><tr><th className="px-4 py-3 font-semibold">Method and path</th><th className="px-4 py-3 font-semibold">Access</th><th className="px-4 py-3 font-semibold">Purpose</th></tr></thead>
                <tbody className="divide-y divide-surface-5">
                  <tr><td className="px-4 py-3 font-mono text-fg">POST /api-keys/token</td><td className="px-4 py-3">API key header</td><td className="px-4 py-3">Exchange a key for a one hour access token.</td></tr>
                  <tr><td className="px-4 py-3 font-mono text-fg">POST /shipments</td><td className="px-4 py-3">shipments:write</td><td className="px-4 py-3">Create one shipment.</td></tr>
                  <tr><td className="px-4 py-3 font-mono text-fg">GET /branches</td><td className="px-4 py-3">shipments:write</td><td className="px-4 py-3">Look up the organization&apos;s pickup depot IDs and locations.</td></tr>
                  <tr><td className="px-4 py-3 font-mono text-fg">GET /shipments/:id</td><td className="px-4 py-3">shipments:read</td><td className="px-4 py-3">Read one shipment by its internal ID.</td></tr>
                  <tr><td className="px-4 py-3 font-mono text-fg">GET /shipments/track/:code</td><td className="px-4 py-3">Public tracking reference</td><td className="px-4 py-3">Read recipient safe tracking status and delivery window.</td></tr>
                </tbody>
              </table>
            </div>
            <Callout tone="warning"><strong className="text-fg">Current scope limits:</strong> shipment list, batch import, cancellation, and retry endpoints require a signed in workspace role; the API key scopes do not grant those routes. Public tracking returns a limited response and does not require an API key.</Callout>
            <p>Shipment statuses are PENDING, DISPATCHING, ASSIGNED, PICKED_UP, IN_TRANSIT, DELIVERED, CANCELLED, and FAILED. Use the tracking reference for recipient facing tracking. The internal shipment ID is used by authenticated detail endpoints.</p>
          </Section>

          <Section id="security" eyebrow="08 / Security" title="Protect credentials and tenant data">
            <ul className="list-disc space-y-2 pl-5 marker:text-fg">
              <li>Create separate keys for separate integrations and grant the fewest scopes possible.</li>
              <li>Restrict keys with an IP allowlist when your integration has fixed outbound addresses.</li>
              <li>Keep secrets on a trusted server. Do not include them in a frontend bundle or client application.</li>
              <li>Revoke a key from Settings if it is exposed or no longer needed. This prevents new token exchanges; tokens already issued remain usable until their one hour expiry.</li>
              <li>Use the recipient tracking code only for customer facing tracking. Do not expose internal shipment IDs or API tokens to recipients.</li>
            </ul>
            <div className="rounded-2xl border border-surface-5 bg-surface-2 p-5">
              <h3 className="text-sm font-semibold text-fg">Common responses</h3>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                <div><dt className="font-mono text-xs text-fg">401 Unauthorized</dt><dd className="mt-1 text-xs leading-5">Token is missing, invalid, or expired. Exchange the key again.</dd></div>
                <div><dt className="font-mono text-xs text-fg">403 Forbidden</dt><dd className="mt-1 text-xs leading-5">Key is invalid or the request lacks the required scope or allowed IP.</dd></div>
                <div><dt className="font-mono text-xs text-fg">404 Not Found</dt><dd className="mt-1 text-xs leading-5">Shipment ID or tracking reference was not found.</dd></div>
                <div><dt className="font-mono text-xs text-fg">400 Bad Request</dt><dd className="mt-1 text-xs leading-5">A required field is missing or a value failed validation.</dd></div>
              </dl>
            </div>
          </Section>

          <div className="mt-10 flex flex-col justify-between gap-4 rounded-3xl border border-surface-5 bg-surface-2 p-6 sm:flex-row sm:items-center sm:p-8">
            <div><h2 className="text-lg font-semibold">Ready to connect your system?</h2><p className="mt-1 text-sm text-fg-muted">Create a workspace, then configure an API key in Settings.</p></div>
            <Button asChild><Link to="/register">Get started <ArrowUpRight size={16} /></Link></Button>
          </div>
        </main>
      </div>
    </div>
  );
}
