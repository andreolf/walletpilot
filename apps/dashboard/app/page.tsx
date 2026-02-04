"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, createApiKey, deleteApiKey } from "@/lib/api";
import { 
  Key, Plus, Trash2, Copy, Check, ExternalLink, 
  LogOut, Zap, Shield, Activity, BarChart3, Users, TrendingUp
} from "lucide-react";
import { UsageChart } from "@/components/analytics/usage-chart";
import { ActionBreakdown } from "@/components/analytics/action-breakdown";
import { RecentEvents } from "@/components/analytics/recent-events";

interface User {
  id: string;
  email: string;
  name?: string;
  plan: string;
}

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt?: string;
  createdAt: string;
}

interface AnalyticsStats {
  totalEvents: number;
  uniqueClients: number;
  successRate: number;
  dailyUsage: Array<{ date: string; events: number; unique_clients: number }>;
  actionBreakdown: Array<{ action: string; count: number; success_rate: number }>;
  recentEvents: Array<{
    id: string;
    created_at: string;
    event_type: string;
    success: boolean;
    client_id: string;
    sdk_version: string;
    error_type?: string;
  }>;
}

type Tab = "overview" | "analytics";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [analytics, setAnalytics] = useState<AnalyticsStats | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("walletpilot_token");
    if (!token) {
      router.push("/login");
      return;
    }
    loadUser(token);
  }, [router]);

  useEffect(() => {
    if (activeTab === "analytics" && !analytics) {
      loadAnalytics();
    }
  }, [activeTab]);

  async function loadUser(token: string) {
    const result = await getMe(token);
    if (!result.success || !result.data) {
      localStorage.removeItem("walletpilot_token");
      router.push("/login");
      return;
    }
    setUser(result.data.user);
    setApiKeys(result.data.apiKeys);
    setLoading(false);
  }

  async function loadAnalytics() {
    setAnalyticsLoading(true);
    try {
      const [statsRes, eventsRes] = await Promise.all([
        fetch("https://dashboard-lake-nine.vercel.app/api/stats"),
        fetch("https://dashboard-lake-nine.vercel.app/api/events"),
      ]);
      const stats = await statsRes.json();
      const events = await eventsRes.json();
      
      setAnalytics({
        totalEvents: stats.totalEvents || 0,
        uniqueClients: stats.uniqueClients || 0,
        successRate: stats.successRate || 0,
        dailyUsage: stats.dailyUsage || [],
        actionBreakdown: stats.actionBreakdown || [],
        recentEvents: events || [],
      });
    } catch (err) {
      console.error("Failed to load analytics:", err);
    }
    setAnalyticsLoading(false);
  }

  async function handleCreateKey() {
    if (!newKeyName.trim()) return;
    setCreating(true);
    const token = localStorage.getItem("walletpilot_token");
    if (!token) return;

    const result = await createApiKey(token, newKeyName);
    if (result.success && result.data) {
      setShowNewKey(result.data.key);
      setApiKeys([{ ...result.data, lastUsedAt: undefined, createdAt: new Date().toISOString() }, ...apiKeys]);
      setNewKeyName("");
    }
    setCreating(false);
  }

  async function handleDeleteKey(keyId: string) {
    const token = localStorage.getItem("walletpilot_token");
    if (!token) return;
    const result = await deleteApiKey(token, keyId);
    if (result.success) {
      setApiKeys(apiKeys.filter(k => k.id !== keyId));
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleLogout() {
    localStorage.removeItem("walletpilot_token");
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">WalletPilot</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full capitalize">
              {user?.plan}
            </span>
            <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "overview"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Overview
              </span>
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "analytics"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                SDK Analytics
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === "overview" ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Key className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">API Keys</span>
                </div>
                <div className="text-2xl font-bold">{apiKeys.length}</div>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">Active Permissions</span>
                </div>
                <div className="text-2xl font-bold">0</div>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Transactions (30d)</span>
                </div>
                <div className="text-2xl font-bold">0</div>
              </div>
            </div>

            {/* New Key Alert */}
            {showNewKey && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-green-500 mb-1">API Key Created!</div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Copy this key now - it won't be shown again.
                    </div>
                    <code className="bg-black/50 px-3 py-2 rounded text-sm font-mono">
                      {showNewKey}
                    </code>
                  </div>
                  <button
                    onClick={() => copyToClipboard(showNewKey)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <button
                  onClick={() => setShowNewKey(null)}
                  className="mt-3 text-sm text-muted-foreground hover:text-foreground"
                >
                  I've saved it, close this
                </button>
              </div>
            )}

            {/* API Keys */}
            <div className="bg-card border border-border rounded-lg">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">API Keys</h2>
                    <p className="text-sm text-muted-foreground">
                      Manage your API keys for SDK access
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Key name..."
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
                      onKeyDown={(e) => e.key === "Enter" && handleCreateKey()}
                    />
                    <button
                      onClick={handleCreateKey}
                      disabled={creating || !newKeyName.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                      Create Key
                    </button>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-border">
                {apiKeys.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No API keys yet. Create one to get started.
                  </div>
                ) : (
                  apiKeys.map((key) => (
                    <div key={key.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <Key className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{key.name}</div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {key.prefix}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-muted-foreground">
                          {key.lastUsedAt ? (
                            <>Last used: {new Date(key.lastUsedAt).toLocaleDateString()}</>
                          ) : (
                            <>Never used</>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteKey(key.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Start */}
            <div className="mt-8 bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-6">Quick Start</h2>
              <div className="space-y-6">
                {/* Step 1 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">1</span>
                    <span className="text-sm font-medium">Install the SDK</span>
                  </div>
                  <code className="block bg-black/50 px-4 py-3 rounded-lg text-sm font-mono">
                    npm install walletpilot-sdk
                  </code>
                </div>

                {/* Step 2 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">2</span>
                    <span className="text-sm font-medium">Initialize with your API key</span>
                  </div>
                  <code className="block bg-black/50 px-4 py-3 rounded-lg text-sm font-mono whitespace-pre">{`import { WalletPilot } from 'walletpilot-sdk';

const pilot = new WalletPilot({ 
  apiKey: '${apiKeys[0]?.prefix || 'wp_your_api_key'}' 
});`}</code>
                </div>

                {/* Step 3 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">3</span>
                    <span className="text-sm font-medium">Request permission from user</span>
                  </div>
                  <code className="block bg-black/50 px-4 py-3 rounded-lg text-sm font-mono whitespace-pre">{`// User approves spending limits via MetaMask
const permission = await pilot.requestPermission({
  spend: { 
    ETH: '0.1',      // Max 0.1 ETH
    USDC: '100'      // Max 100 USDC
  },
  contracts: ['uniswap', 'aave'],  // Allowed protocols
  chains: [1, 137],                 // Ethereum + Polygon
  expiry: '7d'                      // Valid for 7 days
});

console.log('Permission granted:', permission.id);`}</code>
                </div>

                {/* Step 4 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">4</span>
                    <span className="text-sm font-medium">Execute transactions within limits</span>
                  </div>
                  <code className="block bg-black/50 px-4 py-3 rounded-lg text-sm font-mono whitespace-pre">{`// AI agent executes a swap
const tx = await pilot.execute({
  permissionId: permission.id,
  to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',  // Uniswap
  value: '0.05',
  data: swapCalldata,
  chainId: 1
});

console.log('Transaction hash:', tx.hash);`}</code>
                </div>

                {/* Divider */}
                <div className="border-t border-border pt-6">
                  <h3 className="text-sm font-semibold mb-3">Example Use Cases</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-muted/30 border border-border">
                      <div className="font-medium text-sm mb-1">DCA Bot</div>
                      <div className="text-xs text-muted-foreground">Auto-buy ETH every day with spending limits</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 border border-border">
                      <div className="font-medium text-sm mb-1">Yield Optimizer</div>
                      <div className="text-xs text-muted-foreground">Move funds between Aave & Compound</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 border border-border">
                      <div className="font-medium text-sm mb-1">Rebalancer</div>
                      <div className="text-xs text-muted-foreground">Keep portfolio at target allocations</div>
                    </div>
                  </div>
                </div>

                <a
                  href="https://docs.walletpilot.dev"
                  target="_blank"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  View full documentation
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </>
        ) : (
          /* Analytics Tab */
          <div className="space-y-6">
            {analyticsLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading analytics...
              </div>
            ) : analytics ? (
              <>
                {/* Analytics Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Activity className="h-5 w-5 text-primary" />
                      <span className="text-sm text-muted-foreground">Total Events</span>
                    </div>
                    <div className="text-2xl font-bold">{analytics.totalEvents.toLocaleString()}</div>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="h-5 w-5 text-green-500" />
                      <span className="text-sm text-muted-foreground">Unique Clients</span>
                    </div>
                    <div className="text-2xl font-bold">{analytics.uniqueClients.toLocaleString()}</div>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      <span className="text-sm text-muted-foreground">Success Rate</span>
                    </div>
                    <div className="text-2xl font-bold">{(analytics.successRate * 100).toFixed(1)}%</div>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <UsageChart data={analytics.dailyUsage} />
                  <ActionBreakdown data={analytics.actionBreakdown} />
                </div>

                {/* Recent Events */}
                <RecentEvents events={analytics.recentEvents} />
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No analytics data available yet.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
