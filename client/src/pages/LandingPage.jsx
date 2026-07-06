import { Link } from "react-router-dom";
import { GitBranch, Zap, BarChart3, ArrowRight, Check, GitCommit, MessageSquare, FileText } from "lucide-react";

/* ─── Landing page ────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="bg-gh-canvas text-gh-fg font-sans overflow-x-hidden">
      <LandingNav />
      <HeroSection />
      <DemoSection />
      <FeaturesSection />
      <HowItWorks />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
}

/* ─── Nav ─────────────────────────────────────────────────────────── */
function LandingNav() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-gh-line/50 bg-gh-canvas/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gh-accent flex items-center justify-center">
            <GitBranch className="w-3.5 h-3.5 text-gh-canvas" />
          </div>
          <span className="font-semibold text-gh-fg text-sm">GitPulse</span>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm text-gh-muted">
          <a href="#features" className="hover:text-gh-fg transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-gh-fg transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-gh-fg transition-colors">Pricing</a>
        </div>

        <a
          href="/auth/github"
          className="flex items-center gap-2 bg-gh-accent hover:bg-gh-accent-em text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Get started free
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </nav>
  );
}

/* ─── Hero ────────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 px-6 text-center overflow-hidden">
      {/* Background radial */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gh-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-gh-accent/8 rounded-full blur-2xl" />
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Badge */}
        <div className="anim-fade-up inline-flex items-center gap-2 bg-gh-accent/10 border border-gh-accent/25 text-gh-accent text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <Zap className="w-3 h-3" />
          Multi-agent AI — now in beta
        </div>

        {/* Headline */}
        <h1 className="anim-delay-1 text-5xl md:text-6xl lg:text-7xl font-extrabold text-gh-fg leading-[1.08] tracking-tight mb-6">
          Turn commits into
          <br />
          <span className="gradient-text">clarity.</span>
        </h1>

        {/* Sub */}
        <p className="anim-delay-2 text-lg text-gh-muted max-w-2xl mx-auto leading-relaxed mb-8">
          GitPulse reads every commit and PR in your GitHub repos and generates beautiful
          AI-written summaries — for your standup, your clients, or your founder.
          Zero friction. Just push code.
        </p>

        {/* CTAs */}
        <div className="anim-delay-3 flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
          <a
            href="/auth/github"
            className="flex items-center gap-2.5 bg-gh-accent hover:bg-gh-accent-em text-white font-semibold px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-gh-accent/20 text-sm"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Start for free
          </a>
          <a
            href="#how-it-works"
            className="flex items-center gap-2 text-gh-muted hover:text-gh-fg border border-gh-border hover:border-gh-muted font-medium px-6 py-3 rounded-xl transition-all text-sm"
          >
            See how it works
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* App mockup preview */}
        <div className="anim-delay-4 relative accent-glow rounded-2xl border border-gh-border overflow-hidden">
          {/* Browser chrome */}
          <div className="bg-gh-inset border-b border-gh-border px-4 py-3 flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>
            <div className="flex-1 bg-gh-surface border border-gh-border rounded-md px-3 py-1 text-xs text-gh-subtle font-mono text-center">
              app.gitpulse.io/overview
            </div>
          </div>

          {/* Fake dashboard */}
          <div className="bg-gh-canvas flex" style={{ height: 340 }}>
            {/* Sidebar */}
            <div className="w-44 bg-gh-surface border-r border-gh-border p-3 space-y-0.5 shrink-0">
              <div className="flex items-center gap-2 px-2 py-2 mb-3">
                <div className="w-5 h-5 rounded bg-gh-accent flex items-center justify-center">
                  <GitBranch className="w-2.5 h-2.5 text-white" />
                </div>
                <span className="text-xs font-semibold text-gh-fg">GitPulse</span>
              </div>
              {["Overview","Repositories","Summaries","Settings"].map((item, i) => (
                <div key={item} className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs ${i === 0 ? "bg-gh-accent/10 text-gh-accent border-l-2 border-gh-accent" : "text-gh-muted"}`}>
                  <div className="w-3 h-3 rounded bg-gh-border" />
                  {item}
                </div>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 p-5 overflow-hidden">
              <p className="text-xs font-semibold text-gh-muted uppercase tracking-wider mb-3">Overview</p>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[["3", "Repositories"], ["12", "Summaries"], ["148", "Commits"]].map(([val, label]) => (
                  <div key={label} className="bg-gh-surface border border-gh-border rounded-lg p-3">
                    <p className="text-lg font-bold text-gh-fg">{val}</p>
                    <p className="text-[10px] text-gh-subtle">{label}</p>
                  </div>
                ))}
              </div>
              {/* Summary cards */}
              <div className="space-y-2">
                {[
                  { type: "Standup", repo: "api-server", date: "Today" },
                  { type: "Client Report", repo: "mobile-app", date: "Yesterday" },
                ].map((s) => (
                  <div key={s.repo} className="bg-gh-surface border border-gh-border rounded-lg px-3 py-2 flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-gh-accent shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-gh-fg">{s.type}</span>
                      <span className="text-[10px] text-gh-subtle ml-2 font-mono">{s.repo}</span>
                    </div>
                    <span className="text-[10px] text-gh-subtle">{s.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Demo: commits → summary ─────────────────────────────────────── */
function DemoSection() {
  return (
    <section className="py-20 px-6 bg-gh-surface/30">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gh-fg mb-3">See it in action</h2>
          <p className="text-gh-muted">Raw commits go in — beautiful summaries come out.</p>
        </div>

        <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
          {/* Before: git log */}
          <div className="bg-gh-surface border border-gh-border rounded-xl overflow-hidden">
            <div className="bg-gh-inset border-b border-gh-border px-4 py-2.5 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gh-red" />
              <div className="w-2 h-2 rounded-full bg-gh-yellow" />
              <div className="w-2 h-2 rounded-full bg-gh-green" />
              <span className="ml-2 text-xs text-gh-subtle font-mono">git log --oneline</span>
            </div>
            <div className="p-4 font-mono text-xs space-y-2">
              {[
                ["3f2a1b9", "Fix OAuth callback session persistence"],
                ["8e4c2d1", "Add rate limiting middleware to /api"],
                ["1a9f3e7", "Update User schema, add org_id index"],
                ["f4b8e3a", "Refactor webhook signature verification"],
                ["2c9d1a5", "Add BullMQ retry logic with backoff"],
              ].map(([hash, msg]) => (
                <div key={hash} className="flex gap-2">
                  <span className="text-gh-accent shrink-0">{hash}</span>
                  <span className="text-gh-muted">{msg}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center gap-2 px-4">
            <div className="w-10 h-10 rounded-full bg-gh-accent/15 border border-gh-accent/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-gh-accent" />
            </div>
            <ArrowRight className="w-5 h-5 text-gh-border hidden md:block" />
            <span className="text-xs text-gh-subtle">AI</span>
          </div>

          {/* After: summary */}
          <div className="bg-gh-surface border border-gh-accent/30 rounded-xl overflow-hidden accent-glow-sm">
            <div className="bg-gh-accent/5 border-b border-gh-accent/20 px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-gh-accent">Daily Standup — Dec 4</span>
              <span className="text-[10px] text-gh-subtle bg-gh-green/10 text-gh-green border border-gh-green/20 px-2 py-0.5 rounded-full">✓ Generated</span>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div>
                <p className="text-xs font-semibold text-gh-muted uppercase tracking-wide mb-1.5">✅ Shipped</p>
                <p className="text-gh-fg text-xs leading-relaxed">OAuth session persistence fixed. Rate limiting added to all API endpoints.</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gh-muted uppercase tracking-wide mb-1.5">🔧 In progress</p>
                <p className="text-gh-fg text-xs leading-relaxed">User schema migration underway. Webhook reliability improvements.</p>
              </div>
              <div className="flex gap-4 pt-1 border-t border-gh-line">
                <span className="text-[11px] text-gh-subtle"><span className="text-gh-fg font-semibold">5</span> commits</span>
                <span className="text-[11px] text-gh-subtle"><span className="text-gh-green font-semibold">3</span> features</span>
                <span className="text-[11px] text-gh-subtle"><span className="text-gh-red font-semibold">1</span> fix</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Features ────────────────────────────────────────────────────── */
function FeaturesSection() {
  const features = [
    {
      icon: <MessageSquare className="w-5 h-5 text-gh-blue" />,
      bg: "bg-gh-blue/10 border-gh-blue/20",
      title: "Async Standup Bot",
      desc: "Replace daily standups with AI-generated morning updates. What shipped, what's in progress, and what's blocked — automatically.",
    },
    {
      icon: <FileText className="w-5 h-5 text-gh-accent" />,
      bg: "bg-gh-accent/10 border-gh-accent/20",
      title: "Client Report Generator",
      desc: "Translate raw commits into polished, client-friendly progress reports. Perfect for agencies billing hourly or milestone-based.",
    },
    {
      icon: <BarChart3 className="w-5 h-5 text-gh-green" />,
      bg: "bg-gh-green/10 border-gh-green/20",
      title: "Executive Dashboard",
      desc: "Give non-technical founders and PMs real visibility into the codebase — categorized as Features, Bug Fixes, and Chores.",
    },
  ];

  return (
    <section id="features" className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gh-fg mb-3">Three products. One integration.</h2>
          <p className="text-gh-muted max-w-xl mx-auto">
            Connect once and get reports tailored for every audience — your team, your clients, and your leadership.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="bg-gh-surface border border-gh-border rounded-2xl p-6 hover:border-gh-muted hover:shadow-xl hover:shadow-black/30 transition-all duration-200 group">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${f.bg}`}>
                {f.icon}
              </div>
              <h3 className="text-base font-semibold text-gh-fg mb-2">{f.title}</h3>
              <p className="text-sm text-gh-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── How it works ────────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    { n: "01", title: "Connect your repo", desc: "Sign in with GitHub, add any repository in seconds. We set up the webhook automatically." },
    { n: "02", title: "We monitor every push", desc: "Our AI reads commits, diffs, and PRs in real time. Nothing is missed, nothing needs manual input." },
    { n: "03", title: "Get beautiful summaries", desc: "Receive daily AI reports to your dashboard, Slack, Discord, or email — in the format your audience needs." },
  ];

  return (
    <section id="how-it-works" className="py-20 px-6 bg-gh-surface/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gh-fg mb-3">Zero friction setup</h2>
          <p className="text-gh-muted">Three steps and you're live. No YAML, no config files.</p>
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-8 left-[calc(16.67%-1px)] right-[calc(16.67%-1px)] h-px bg-gh-border" />

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.n} className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-gh-inset border border-gh-border flex items-center justify-center mb-4 relative z-10">
                  <span className="text-lg font-black text-gh-accent font-mono">{s.n}</span>
                </div>
                <h3 className="text-base font-semibold text-gh-fg mb-2">{s.title}</h3>
                <p className="text-sm text-gh-muted leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing ─────────────────────────────────────────────────────── */
function PricingSection() {
  const plans = [
    {
      name: "Free", price: "$0", period: "forever",
      desc: "For solo devs exploring GitPulse.",
      cta: "Get started",
      ctaStyle: "bg-gh-inset border border-gh-border hover:border-gh-muted text-gh-fg",
      features: ["1 report total", "1 repository", "Manual trigger only", "Dashboard access"],
      missing: ["Slack / Discord", "PDF export", "Team members"],
    },
    {
      name: "Pro", price: "$19", period: "/month",
      desc: "For teams that ship daily.",
      cta: "Start free trial",
      ctaStyle: "bg-gh-accent hover:bg-gh-accent-em text-white",
      highlight: true,
      badge: "Most popular",
      features: ["Unlimited reports", "Up to 10 repositories", "Auto-trigger on push", "Slack + Discord delivery", "PDF export", "All 3 report types"],
      missing: ["Custom branding"],
    },
    {
      name: "Agency", price: "$49", period: "/month",
      desc: "For agencies managing multiple clients.",
      cta: "Contact us",
      ctaStyle: "bg-gh-inset border border-gh-border hover:border-gh-muted text-gh-fg",
      ctaHref: "#",
      features: ["Unlimited everything", "Unlimited repositories", "Up to 10 team members", "White-label reports", "Custom branding", "Priority support"],
      missing: [],
    },
  ];

  return (
    <section id="pricing" className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gh-fg mb-3">Simple, transparent pricing</h2>
          <p className="text-gh-muted">Start free, upgrade when you're ready.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 items-start">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl p-6 border ${
                p.highlight
                  ? "bg-gh-accent-bg border-gh-accent/40 accent-glow-sm relative"
                  : "bg-gh-surface border-gh-border"
              }`}
            >
              {p.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gh-accent text-white text-xs font-semibold px-3 py-0.5 rounded-full">
                  {p.badge}
                </div>
              )}
              <p className="text-sm font-semibold text-gh-muted mb-1">{p.name}</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-black text-gh-fg">{p.price}</span>
                <span className="text-gh-subtle text-sm">{p.period}</span>
              </div>
              <p className="text-xs text-gh-subtle mb-5">{p.desc}</p>

              <a
                href={p.ctaHref ?? "/auth/github"}
                className={`block w-full text-center text-sm font-semibold py-2.5 rounded-xl transition-colors mb-5 ${p.ctaStyle}`}
              >
                {p.cta}
              </a>

              <div className="space-y-2">
                {p.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-xs text-gh-fg">
                    <Check className="w-3.5 h-3.5 text-gh-green shrink-0" />
                    {f}
                  </div>
                ))}
                {p.missing.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-xs text-gh-subtle line-through">
                    <div className="w-3.5 h-3.5 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ─────────────────────────────────────────────────────────── */
function CTASection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <div className="bg-gh-surface border border-gh-border rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gh-accent/3 rounded-3xl" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-gh-accent/8 blur-3xl rounded-full" />
          </div>
          <div className="relative">
            <h2 className="text-3xl font-bold text-gh-fg mb-3">
              Ready to stop writing standup updates?
            </h2>
            <p className="text-gh-muted mb-8 max-w-lg mx-auto">
              Connect your GitHub in 30 seconds. No credit card required.
            </p>
            <a
              href="/auth/github"
              className="inline-flex items-center gap-2.5 bg-gh-accent hover:bg-gh-accent-em text-white font-semibold px-8 py-3.5 rounded-xl transition-all hover:shadow-xl hover:shadow-gh-accent/20 text-sm"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Start for free with GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ──────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-gh-line py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gh-accent flex items-center justify-center">
            <GitBranch className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-semibold text-gh-fg">GitPulse</span>
          <span className="text-xs text-gh-subtle ml-2">© 2025</span>
        </div>
        <div className="flex items-center gap-5 text-xs text-gh-subtle">
          <span className="cursor-default">Privacy</span>
          <span className="cursor-default">Terms</span>
          <span className="cursor-default">Docs</span>
          <span className="cursor-default">GitHub</span>
        </div>
      </div>
    </footer>
  );
}
