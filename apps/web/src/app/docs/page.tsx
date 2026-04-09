import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API Documentation',
  description: 'REST API and SDK documentation for the Agent Registry.',
}

const API_ENDPOINTS = [
  {
    method: 'GET',
    path: '/api/v1/agents',
    description: 'List registered agents with pagination',
    params: 'page, pageSize',
    example: '/api/v1/agents?page=1&pageSize=10',
  },
  {
    method: 'GET',
    path: '/api/v1/agents/:agentId',
    description: 'Get single agent with parsed card data and tags',
    params: 'agentId (path)',
    example: '/api/v1/agents/1',
  },
  {
    method: 'GET',
    path: '/api/v1/stats',
    description: 'Protocol-wide statistics',
    params: 'none',
    example: '/api/v1/stats',
  },
  {
    method: 'POST',
    path: '/api/v1/upload',
    description: 'Upload agent card JSON to IPFS',
    params: 'ERC-8004 agent card JSON body',
    example: '{ "type": "...", "name": "My Agent", ... }',
  },
]

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-(--color-accent-cyan)">
        Documentation
      </p>
      <h1 className="mt-2 text-3xl font-bold text-(--color-text-primary)">
        API &amp; SDK Reference
      </h1>
      <p className="mt-2 text-(--color-text-secondary)">
        Integrate with the Agent Registry programmatically. Use the REST API or the TypeScript SDK.
      </p>

      {/* SDK Quick Start */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-(--color-text-primary)">SDK Quick Start</h2>
        <div className="mt-4 rounded-xl border border-(--color-border) bg-(--color-bg-secondary) p-5 font-mono text-sm">
          <div className="flex items-center gap-2 border-b border-(--color-border) pb-3 text-xs text-(--color-text-muted)">
            <span className="h-3 w-3 rounded-full bg-red-500/60" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/60" />
            <span className="h-3 w-3 rounded-full bg-green-500/60" />
            <span className="ml-2">terminal</span>
          </div>
          <pre className="mt-4 overflow-x-auto text-xs leading-7">
            <code>
              <span className="text-(--color-text-muted)">{'# Install'}</span>{'\n'}
              <span className="text-(--color-accent-green)">npm</span>{' install @agent-registry/sdk viem\n\n'}
              <span className="text-(--color-text-muted)">{'# Use'}</span>{'\n'}
              <span className="text-(--color-accent-violet-bright)">import</span>{' { AgentRegistryClient } '}
              <span className="text-(--color-accent-violet-bright)">from</span>{' '}
              <span className="text-(--color-accent-green)">{"'@agent-registry/sdk'"}</span>{'\n\n'}
              <span className="text-(--color-accent-violet-bright)">const</span>{' client = '}
              <span className="text-(--color-accent-violet-bright)">new</span>{' '}
              <span className="text-(--color-accent-amber)">AgentRegistryClient</span>
              {"({ chain: 'base-sepolia' })\n\n"}
              <span className="text-(--color-text-muted)">{'// Get agent details'}</span>{'\n'}
              <span className="text-(--color-accent-violet-bright)">const</span>{' uri = '}
              <span className="text-(--color-accent-violet-bright)">await</span>{' client.identity.getAgentURI(1n)\n\n'}
              <span className="text-(--color-text-muted)">{'// Gasless registration (zero ETH needed)'}</span>{'\n'}
              <span className="text-(--color-accent-violet-bright)">const</span>{' result = '}
              <span className="text-(--color-accent-violet-bright)">await</span>{' client.identity.'}
              <span className="text-(--color-accent-amber)">registerGasless</span>
              {"({\n  agentURI: 'ipfs://Qm...',\n  tags: ['defi'],\n})"}
            </code>
          </pre>
        </div>
      </section>

      {/* REST API */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-(--color-text-primary)">REST API Endpoints</h2>
        <div className="mt-4 space-y-4">
          {API_ENDPOINTS.map((endpoint) => (
            <div
              key={endpoint.path}
              className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-md px-2 py-0.5 font-mono text-xs font-bold ${
                    endpoint.method === 'GET'
                      ? 'bg-(--color-accent-cyan)/10 text-(--color-accent-cyan)'
                      : 'bg-(--color-accent-amber)/10 text-(--color-accent-amber)'
                  }`}
                >
                  {endpoint.method}
                </span>
                <code className="font-mono text-sm text-(--color-text-primary)">
                  {endpoint.path}
                </code>
              </div>
              <p className="mt-2 text-sm text-(--color-text-secondary)">{endpoint.description}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-(--color-text-muted)">
                <span>
                  <span className="font-mono text-(--color-text-muted)">Params:</span>{' '}
                  <span className="text-(--color-text-secondary)">{endpoint.params}</span>
                </span>
              </div>
              <div className="mt-2">
                <code className="rounded-md bg-(--color-bg-secondary) px-2 py-1 font-mono text-xs text-(--color-text-muted)">
                  {endpoint.example}
                </code>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contract Addresses */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-(--color-text-primary)">Contract Addresses</h2>
        <div className="mt-4 rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-(--color-border)/50">
                <td className="py-2 pr-4 text-(--color-text-muted)">Identity Registry</td>
                <td className="py-2 font-mono text-xs text-(--color-accent-cyan) break-all">
                  0x8004A818BFB912233c491871b3d84c89A494BD9e
                </td>
              </tr>
              <tr className="border-b border-(--color-border)/50">
                <td className="py-2 pr-4 text-(--color-text-muted)">Reputation Registry</td>
                <td className="py-2 font-mono text-xs text-(--color-accent-violet-bright) break-all">
                  0x8004B663056A597Dffe9eCcC1965A193B7388713
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-(--color-text-muted)">Wrapper (ours)</td>
                <td className="py-2 font-mono text-xs text-(--color-accent-amber) break-all">
                  0xC02DE01B0ecBcE17c4E71fc7A0Ad86764B3DF64C
                </td>
              </tr>
            </tbody>
          </table>
          <p className="mt-3 font-mono text-xs text-(--color-text-muted)">
            Network: Base Sepolia (Chain ID: 84532)
          </p>
        </div>
      </section>
    </div>
  )
}
