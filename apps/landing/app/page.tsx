"use client";

import { 
  Zap, Shield, Gauge, Globe, Code, ArrowRight, 
  CheckCircle, Terminal, Lock, Activity, Wallet,
  ChevronRight, Github, Twitter, ExternalLink
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg">WalletPilot</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it Works</a>
            <a href="#for-agents" className="text-sm text-muted-foreground hover:text-foreground transition-colors">For Agents</a>
            <a href="https://docs.walletpilot.dev" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Docs</a>
          </div>
          <div className="flex items-center gap-3">
            <a 
              href="https://app.walletpilot.dev" 
              className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <span className="text-xs font-medium text-primary">Now in Early Access</span>
            <ChevronRight className="h-3 w-3 text-primary" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            Let AI agents control<br />
            <span className="gradient-text">your wallet—safely</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            WalletPilot lets AI agents execute transactions on your behalf with 
            granular permissions, spending limits, and full transparency.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="https://app.walletpilot.dev"
              className="flex items-center gap-2 px-8 py-4 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-all hover:scale-105"
            >
              Start Building
              <ArrowRight className="h-4 w-4" />
            </a>
            <a 
              href="https://docs.walletpilot.dev"
              className="flex items-center gap-2 px-8 py-4 bg-card border border-border font-medium rounded-xl hover:bg-muted transition-colors"
            >
              <Code className="h-4 w-4" />
              View Docs
            </a>
          </div>

          {/* Code Preview */}
          <div className="mt-16 max-w-2xl mx-auto">
            <div className="rounded-xl border border-border bg-card overflow-hidden glow">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <span className="text-xs text-muted-foreground ml-2">agent.ts</span>
              </div>
              <pre className="p-6 text-sm text-left overflow-x-auto">
                <code className="text-muted-foreground">
                  <span className="text-purple-400">import</span> {"{"} WalletPilot {"}"} <span className="text-purple-400">from</span> <span className="text-green-400">'walletpilot-sdk'</span>;{"\n\n"}
                  <span className="text-purple-400">const</span> pilot = <span className="text-purple-400">new</span> <span className="text-yellow-400">WalletPilot</span>({"{"}{"\n"}
                  {"  "}apiKey: <span className="text-green-400">'wp_your_api_key'</span>{"\n"}
                  {"}"});{"\n\n"}
                  <span className="text-gray-500">// Request permission from user</span>{"\n"}
                  <span className="text-purple-400">const</span> permission = <span className="text-purple-400">await</span> pilot.<span className="text-blue-400">requestPermission</span>({"{"}{"\n"}
                  {"  "}spend: {"{"} ETH: <span className="text-orange-400">'0.1'</span>, USDC: <span className="text-orange-400">'100'</span> {"}"},{"\n"}
                  {"  "}contracts: [<span className="text-green-400">'uniswap'</span>, <span className="text-green-400">'aave'</span>],{"\n"}
                  {"  "}expiry: <span className="text-green-400">'7d'</span>{"\n"}
                  {"}"});{"\n\n"}
                  <span className="text-gray-500">// Execute transactions within limits</span>{"\n"}
                  <span className="text-purple-400">await</span> pilot.<span className="text-blue-400">execute</span>({"{"}{"\n"}
                  {"  "}to: <span className="text-green-400">'0x...'</span>,{"\n"}
                  {"  "}value: <span className="text-green-400">'0.01'</span>,{"\n"}
                  {"  "}data: swapCalldata{"\n"}
                  {"}"});
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Security without sacrificing power
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Give AI agents exactly the permissions they need—nothing more.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-8 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Granular Permissions</h3>
              <p className="text-muted-foreground">
                Define exactly which contracts, tokens, and actions an agent can use. 
                Revoke anytime with one click.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors">
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-6">
                <Gauge className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Spending Limits</h3>
              <p className="text-muted-foreground">
                Set daily, weekly, or total spending caps per token. 
                Agents can't exceed your limits—ever.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
                <Globe className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Multi-chain</h3>
              <p className="text-muted-foreground">
                Works across Ethereum, Polygon, Arbitrum, Optimism, and Base. 
                One SDK, all chains.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6">
                <Activity className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Full Audit Trail</h3>
              <p className="text-muted-foreground">
                Every transaction logged and visible in your dashboard. 
                Complete transparency on agent activity.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors">
              <div className="h-12 w-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-6">
                <Lock className="h-6 w-6 text-yellow-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Session Keys</h3>
              <p className="text-muted-foreground">
                Based on ERC-7715. No private key sharing—users sign once, 
                agents operate within bounds.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors">
              <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-6">
                <Terminal className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Simple SDK</h3>
              <p className="text-muted-foreground">
                Three lines to get started. TypeScript-first with 
                full autocomplete and type safety.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How it works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get your AI agent executing transactions in minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Install SDK</h3>
              <p className="text-muted-foreground mb-4">
                Add the WalletPilot SDK to your project with npm or yarn.
              </p>
              <code className="text-sm bg-card px-4 py-2 rounded-lg border border-border">
                npm install walletpilot-sdk
              </code>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Request Permission</h3>
              <p className="text-muted-foreground mb-4">
                User approves specific permissions via MetaMask. They stay in control.
              </p>
              <div className="flex items-center justify-center gap-2">
                <Wallet className="h-5 w-5 text-muted-foreground" />
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Execute Safely</h3>
              <p className="text-muted-foreground mb-4">
                Your agent executes transactions within the approved limits.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-green-500" />
                Protected by guardrails
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for AI agents
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Power the next generation of autonomous trading and DeFi.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-8 rounded-2xl border border-border bg-card">
              <h3 className="text-xl font-semibold mb-3">Trading Bots</h3>
              <p className="text-muted-foreground mb-4">
                Build AI agents that execute trades based on market conditions, 
                with strict spending limits and token allowlists.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-muted rounded-full text-xs">Arbitrage</span>
                <span className="px-3 py-1 bg-muted rounded-full text-xs">Market Making</span>
                <span className="px-3 py-1 bg-muted rounded-full text-xs">Momentum</span>
              </div>
            </div>

            <div className="p-8 rounded-2xl border border-border bg-card">
              <h3 className="text-xl font-semibold mb-3">DCA Automation</h3>
              <p className="text-muted-foreground mb-4">
                Set up dollar-cost averaging with daily or weekly buys. 
                Agent handles timing, you control the limits.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-muted rounded-full text-xs">Scheduled Buys</span>
                <span className="px-3 py-1 bg-muted rounded-full text-xs">Multi-token</span>
                <span className="px-3 py-1 bg-muted rounded-full text-xs">Auto-compound</span>
              </div>
            </div>

            <div className="p-8 rounded-2xl border border-border bg-card">
              <h3 className="text-xl font-semibold mb-3">Portfolio Management</h3>
              <p className="text-muted-foreground mb-4">
                AI rebalances your portfolio to target allocations. 
                Set thresholds and let the agent handle the rest.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-muted rounded-full text-xs">Rebalancing</span>
                <span className="px-3 py-1 bg-muted rounded-full text-xs">Risk Limits</span>
                <span className="px-3 py-1 bg-muted rounded-full text-xs">Multi-chain</span>
              </div>
            </div>

            <div className="p-8 rounded-2xl border border-border bg-card">
              <h3 className="text-xl font-semibold mb-3">Yield Optimization</h3>
              <p className="text-muted-foreground mb-4">
                Automatically move funds between protocols to maximize yield. 
                Agent compares rates and executes moves.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-muted rounded-full text-xs">Aave</span>
                <span className="px-3 py-1 bg-muted rounded-full text-xs">Compound</span>
                <span className="px-3 py-1 bg-muted rounded-full text-xs">Curve</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Agent-to-Agent Section */}
      <section id="for-agents" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-8 md:p-12">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
                  <Terminal className="h-3 w-3 text-primary" />
                  <span className="text-xs font-medium text-primary">For AI Agents</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Are you an AI agent?
                </h2>
                <p className="text-muted-foreground mb-6">
                  If you&apos;re an AI agent (Claude, GPT, Cursor, or other), you can integrate WalletPilot 
                  directly into your capabilities. Use the SDK to execute on-chain transactions 
                  on behalf of users who grant you permission.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-medium">Cursor Skill Available</div>
                      <p className="text-sm text-muted-foreground">
                        Install the WalletPilot skill in Cursor to get blockchain transaction capabilities.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-medium">MCP Integration</div>
                      <p className="text-sm text-muted-foreground">
                        Works with Model Context Protocol for seamless tool integration.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-medium">TypeScript & Python SDKs</div>
                      <p className="text-sm text-muted-foreground">
                        Use whichever language your agent framework supports.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 w-full">
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
                    <Terminal className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Agent Integration</span>
                  </div>
                  <pre className="p-4 text-sm overflow-x-auto">
                    <code className="text-muted-foreground">
                      <span className="text-gray-500"># For Cursor agents:</span>{"\n"}
                      <span className="text-gray-500"># Install the WalletPilot skill from</span>{"\n"}
                      <span className="text-green-400">github.com/andreolf/walletpilot</span>{"\n\n"}
                      <span className="text-gray-500"># Quick SDK integration:</span>{"\n"}
                      <span className="text-purple-400">npm install</span> walletpilot-sdk{"\n\n"}
                      <span className="text-gray-500"># API Endpoint:</span>{"\n"}
                      <span className="text-green-400">https://api.walletpilot.dev/v1</span>{"\n\n"}
                      <span className="text-gray-500"># Get API key at:</span>{"\n"}
                      <span className="text-green-400">https://app.walletpilot.dev</span>
                    </code>
                  </pre>
                </div>
                
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <a 
                    href="https://docs.walletpilot.dev/guides"
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Agent Integration Guide
                    <ArrowRight className="h-3 w-3" />
                  </a>
                  <a 
                    href="https://github.com/andreolf/walletpilot"
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-card border border-border text-sm font-medium rounded-lg hover:bg-muted transition-colors"
                  >
                    <Github className="h-4 w-4" />
                    View Skill
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to build?
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Get your API key and start building AI-powered wallet automation today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="https://app.walletpilot.dev"
              className="flex items-center gap-2 px-8 py-4 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-all hover:scale-105"
            >
              Get Your API Key
              <ArrowRight className="h-4 w-4" />
            </a>
            <a 
              href="https://github.com/andreolf/walletpilot"
              className="flex items-center gap-2 px-8 py-4 bg-card border border-border font-medium rounded-xl hover:bg-muted transition-colors"
            >
              <Github className="h-4 w-4" />
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold">WalletPilot</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="https://docs.walletpilot.dev" className="text-sm text-muted-foreground hover:text-foreground">Docs</a>
              <a href="https://app.walletpilot.dev" className="text-sm text-muted-foreground hover:text-foreground">Dashboard</a>
              <a href="https://github.com/andreolf/walletpilot" className="text-sm text-muted-foreground hover:text-foreground">GitHub</a>
              <a href="https://twitter.com/walletpilot" className="text-sm text-muted-foreground hover:text-foreground">Twitter</a>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2026 WalletPilot
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
