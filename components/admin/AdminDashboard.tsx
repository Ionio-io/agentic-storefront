"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandConfig } from "@/data/brand";

interface Props {
  brand: BrandConfig;
  stats: { totalProducts: number; womenProducts: number; menProducts: number };
  userStats: { total: number; newThisWeek: number; activeToday: number; noMongo: boolean };
  systemStatus: { hasVton: boolean; hasOpenRouter: boolean; hasMongo: boolean };
}

interface MetricsData {
  noMongo: boolean;
  daily: { _id: string; count: number }[];
  activeNow: number;
  newToday: number;
  total: number;
  catalog: { total: number; women: number; men: number };
}

interface DayPoint { day: string; count: number }

function buildWeek(daily: { _id: string; count: number }[]): DayPoint[] {
  const result: DayPoint[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
    const found   = daily.find((x) => x._id === dateStr);
    result.push({ day: dayName, count: found?.count ?? 0 });
  }
  return result;
}

const CHECKLIST = [
  { key: "brand",  label: "Brand identity configured",   check: (_: Props) => true },
  { key: "agent",  label: "Agent persona configured",    check: (_: Props) => true },
  { key: "prods",  label: "Product catalog loaded",      check: (_: Props) => true },
  { key: "llm",    label: "OpenRouter API connected",    check: (p: Props) => p.systemStatus.hasOpenRouter },
  { key: "vton",   label: "Virtual Try-On connected",    check: (p: Props) => p.systemStatus.hasVton },
  { key: "mongo",  label: "MongoDB persistence enabled", check: (p: Props) => p.systemStatus.hasMongo },
  { key: "users",  label: "First shopper registered",    check: (p: Props) => p.userStats.total > 0 },
];

export function AdminDashboard({ brand, stats, userStats, systemStatus }: Props) {
  const props = { brand, stats, userStats, systemStatus };
  const router = useRouter();

  const [metrics, setMetrics]  = useState<MetricsData | null>(null);
  const [lastUpdated, setLast] = useState<string>("");
  const [hovered, setHovered]  = useState<number | null>(null);

  useEffect(() => {
    function load() {
      fetch("/api/admin/metrics")
        .then((r) => r.json())
        .then((d: MetricsData) => {
          setMetrics(d);
          setLast(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        })
        .catch(() => {});
    }
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const doneCount    = CHECKLIST.filter((c) => c.check(props)).length;
  const weekData     = metrics ? buildWeek(metrics.daily) : buildWeek([]);
  const weekMax      = Math.max(...weekData.map((d) => d.count), 1);
  const liveTotal    = metrics?.total    ?? userStats.total;
  const liveActive   = metrics?.activeNow ?? userStats.activeToday;
  const liveNewToday = metrics?.newToday  ?? 0;

  // Live catalog counts — prefer metrics (fetched from MongoDB), fall back to SSR props
  const liveCatalogTotal = metrics?.catalog?.total ?? stats.totalProducts;
  const liveCatalogWomen = metrics?.catalog?.women ?? stats.womenProducts;
  const liveCatalogMen   = metrics?.catalog?.men   ?? stats.menProducts;

  return (
    <>
      <style>{`
        /* ─── Dashboard uses theme CSS variables from admin layout ─── */
        .dk {
          min-height: 100vh;
          background: var(--adm-page);
          padding-bottom: 4rem;
          font-family: var(--font-sans, 'DM Sans', system-ui, sans-serif);
          -webkit-font-smoothing: antialiased;
        }

        /* ── Banner ── */
        .dk-banner {
          background: var(--adm-surface);
          border-bottom: 1px solid var(--adm-border);
          padding: 1.75rem 2rem;
          display: flex; align-items: center; justify-content: space-between; gap: 1rem;
          position: relative; overflow: hidden;
        }
        .dk-banner::before {
          content: '';
          position: absolute; top: 0; left: 0; bottom: 0; width: 3px;
          background: var(--adm-gold);
        }
        .dk-banner-l { padding-left: 0.875rem; }
        .dk-eyebrow {
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 9px; font-weight: 600; letter-spacing: 0.3em;
          text-transform: uppercase; color: var(--adm-muted); margin: 0 0 0.4rem;
        }
        .dk-brand-name {
          font-size: 2rem; font-weight: 700; letter-spacing: -0.04em;
          color: var(--adm-ink); line-height: 1; margin: 0 0 0.3rem;
        }
        .dk-tagline { font-size: 13px; color: var(--adm-muted); margin: 0; font-weight: 400; }
        .dk-banner-r { text-align: right; flex-shrink: 0; }
        .dk-agent-label {
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 9px; font-weight: 600; letter-spacing: 0.25em;
          text-transform: uppercase; color: var(--adm-muted); margin: 0 0 0.4rem;
        }
        .dk-agent-name {
          font-size: 1.25rem; font-weight: 700; letter-spacing: -0.02em;
          color: var(--adm-ink); display: flex; align-items: center;
          gap: 0.45rem; justify-content: flex-end;
        }
        .dk-agent-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--adm-gold); flex-shrink: 0;
          animation: agentPulse 1.8s ease-in-out infinite;
        }
        @keyframes agentPulse {
          0%,100% { opacity: .4; transform: scale(.8); }
          50% { opacity: 1; transform: scale(1.15); box-shadow: 0 0 6px var(--adm-gold); }
        }

        /* ── Live badge ── */
        .dk-live {
          display: inline-flex; align-items: center; gap: 0.375rem;
          padding: 3px 10px; border-radius: 20px;
          background: #F3F4F6; border: 1px solid var(--adm-border);
          margin-top: 0.75rem;
        }
        .dk-live-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #22c55e;
          animation: livePulse 2s ease-in-out infinite;
        }
        @keyframes livePulse { 0%,100%{opacity:.5} 50%{opacity:1;box-shadow:0 0 4px #22c55e} }
        .dk-live-txt {
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 10px; font-weight: 600; color: var(--adm-ink2); letter-spacing: 0.05em;
        }

        /* ── Stat strip ── */
        .dk-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          background: var(--adm-surface); border-bottom: 1px solid var(--adm-border);
        }
        .dk-stat {
          padding: 1.75rem 2rem; border-right: 1px solid var(--adm-border);
          position: relative; transition: background 0.12s; cursor: default;
        }
        .dk-stat:last-child { border-right: none; }
        .dk-stat:hover { background: rgba(0,0,0,0.02); }
        .dk-stat::after {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: var(--adm-ink); transform: scaleX(0); transform-origin: left;
          transition: transform 0.22s ease;
        }
        .dk-stat:hover::after { transform: scaleX(1); }
        .dk-stat-lbl {
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 10px; font-weight: 600; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--adm-muted);
          display: block; margin-bottom: 0.625rem;
        }
        .dk-stat-val {
          font-size: 2.75rem; font-weight: 700; letter-spacing: -0.05em;
          color: var(--adm-ink); line-height: 1; display: block; margin-bottom: 0.45rem;
        }
        .dk-stat-sub {
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 11px; font-weight: 500; color: var(--adm-muted);
        }
        .dk-stat-sub.green { color: #16a34a; font-weight: 700; }

        /* ── Grid ── */
        .dk-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 1.25rem; padding: 1.5rem 2rem;
        }
        .dk-card {
          background: var(--adm-surface); border: 1px solid var(--adm-border);
          border-radius: 6px; padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,.05);
        }
        .dk-card-hd {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 1.25rem; padding-bottom: 1rem;
          border-bottom: 1px solid var(--adm-border-sm);
        }
        .dk-card-title {
          font-size: 11px; font-weight: 700; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--adm-ink);
        }
        .dk-card-badge {
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 10px; font-weight: 600; color: var(--adm-muted);
          background: var(--adm-page); border: 1px solid var(--adm-border);
          padding: 2px 8px; border-radius: 4px;
        }
        .dk-card-link {
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 10px; font-weight: 600; color: var(--adm-ink2);
          text-decoration: none; transition: color 0.15s;
        }
        .dk-card-link:hover { color: var(--adm-ink); }

        /* ── Bar chart ── */
        .dk-bars { display: flex; align-items: flex-end; gap: 7px; height: 110px; margin-bottom: 0.75rem; }
        .dk-bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px; height: 100%; justify-content: flex-end; position: relative; }
        .dk-bar-seg {
          width: 100%; background: #E5E7EB; border-radius: 2px 2px 0 0;
          min-height: 3px; border-top: 2px solid var(--adm-ink); transition: background 0.15s;
        }
        .dk-bar-col:hover .dk-bar-seg { background: #D1D5DB; }
        .dk-bar-tip {
          position: absolute; bottom: calc(100% + 3px); left: 50%; transform: translateX(-50%);
          background: var(--adm-ink); color: var(--adm-surface);
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 10px; font-weight: 700; padding: 3px 7px; border-radius: 3px;
          white-space: nowrap; pointer-events: none; z-index: 10;
        }
        .dk-bar-day {
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 9px; font-weight: 600; color: var(--adm-muted);
          letter-spacing: 0.05em; text-transform: uppercase;
        }
        .dk-bar-empty {
          display: flex; align-items: center; justify-content: center;
          height: 110px; font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 11px; color: var(--adm-muted);
          border: 1.5px dashed var(--adm-border); border-radius: 4px;
          text-align: center; line-height: 1.9;
        }

        /* ── Quick actions ── */
        .dk-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
        .dk-action {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.875rem 1rem; background: var(--adm-surface);
          border: 1px solid var(--adm-border); text-decoration: none;
          border-radius: 5px; transition: border-color 0.12s, box-shadow 0.12s, transform 0.1s;
        }
        .dk-action:hover {
          border-color: #9CA3AF; background: var(--adm-page);
        }
        .dk-action-ico {
          width: 32px; height: 32px; border-radius: 5px;
          background: var(--adm-page); border: 1px solid var(--adm-border);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; color: var(--adm-ink2); font-size: 14px;
          transition: background 0.12s, border-color 0.12s;
        }
        .dk-action:hover .dk-action-ico { background: #E5E7EB; border-color: #D1D5DB; }
        .dk-action-name { font-size: 13px; font-weight: 700; color: var(--adm-ink); letter-spacing: -0.01em; line-height: 1.2; }
        .dk-action-sub {
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 10px; font-weight: 500; color: var(--adm-muted); margin-top: 0.1rem;
        }

        /* ── Checklist ── */
        .dk-prog-wrap { margin-bottom: 1rem; }
        .dk-prog-row {
          display: flex; justify-content: space-between;
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 10px; font-weight: 600; color: var(--adm-muted);
          margin-bottom: 0.4rem; letter-spacing: 0.04em;
        }
        .dk-prog-track { height: 4px; background: var(--adm-border-sm); border-radius: 2px; overflow: hidden; }
        .dk-prog-fill { height: 100%; background: var(--adm-ink); border-radius: 2px; transition: width 0.6s cubic-bezier(.22,1,.36,1); }
        .dk-checks { display: flex; flex-direction: column; }
        .dk-check { display: flex; align-items: center; gap: 0.7rem; padding: 0.575rem 0; border-bottom: 1px solid var(--adm-border-sm); }
        .dk-check:last-child { border-bottom: none; }
        .dk-check-ico {
          width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 700;
        }
        .dk-check-ico.on { background: var(--adm-ink); color: #fff; }
        .dk-check-ico.off { background: transparent; border: 1.5px solid var(--adm-border); color: var(--adm-muted); }
        .dk-check-lbl { font-size: 13px; font-weight: 600; color: var(--adm-ink); }
        .dk-check-lbl.off { color: var(--adm-muted); font-weight: 400; }

        /* ── System status ── */
        .dk-svc {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.7rem 0; border-bottom: 1px solid var(--adm-border-sm);
        }
        .dk-svc:last-of-type { border-bottom: none; }
        .dk-svc-name { font-size: 13px; font-weight: 700; color: var(--adm-ink); margin: 0 0 0.1rem; }
        .dk-svc-desc {
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 10px; font-weight: 500; color: var(--adm-muted); margin: 0;
        }
        .dk-pill {
          display: flex; align-items: center; gap: 0.35rem;
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 10px; font-weight: 700; letter-spacing: 0.04em;
          padding: 3px 9px; border-radius: 20px; white-space: nowrap;
        }
        .dk-pill.ok   { background: rgba(22,163,74,.08);  color: #16a34a; }
        .dk-pill.warn { background: rgba(202,138,4,.09);  color: #a16207; }
        .dk-pill.err  { background: rgba(220,38,38,.08);  color: #dc2626; }
        .dk-pill-dot  { width: 5px; height: 5px; border-radius: 50%; background: currentColor; flex-shrink: 0; }

        /* ── Welcome message ── */
        .dk-hr { border: none; border-top: 1px solid var(--adm-border-sm); margin: 1.25rem 0 1rem; }
        .dk-welcome {
          display: flex; align-items: flex-start; gap: 0.75rem;
          padding: 0.875rem 1rem; background: var(--adm-page);
          border-radius: 5px; border: 1px solid var(--adm-border);
        }
        .dk-ava {
          width: 30px; height: 30px; border-radius: 50%; background: var(--adm-ink);
          display: flex; align-items: center; justify-content: center;
          color: var(--adm-gold); font-size: 11px; flex-shrink: 0;
        }
        .dk-welcome-txt {
          font-size: 13px; font-weight: 400; font-style: italic;
          color: var(--adm-ink2); line-height: 1.65; margin: 0;
        }
        .dk-mongo-note {
          margin-top: 0.75rem; padding: 0.75rem 0.875rem;
          background: #F9FAFB; border: 1px solid var(--adm-border);
          border-radius: 4px; font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 11px; font-weight: 500; color: var(--adm-ink2); line-height: 1.6;
        }
      `}</style>

      <div className="dk">

        {/* Banner */}
        <div className="dk-banner">
          <div className="dk-banner-l">
            <p className="dk-eyebrow">Active configuration</p>
            <h1 className="dk-brand-name">{brand.name}</h1>
            <p className="dk-tagline">{brand.tagline}</p>
          </div>
          <div className="dk-banner-r">
            <p className="dk-agent-label">AI Stylist</p>
            <div className="dk-agent-name">
              <span className="dk-agent-dot" />
              {brand.agentName}
            </div>
            {lastUpdated && (
              <div className="dk-live" style={{ justifyContent: "flex-end" }}>
                <span className="dk-live-dot" />
                <span className="dk-live-txt">Live · {lastUpdated}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats strip */}
        <div className="dk-stats">
          {([
            {
              lbl: "Products",
              val: liveCatalogTotal,
              sub: `${liveCatalogWomen}W · ${liveCatalogMen}M`,
              ok: false,
            },
            {
              lbl: "Shoppers",
              val: liveTotal,
              sub: userStats.noMongo ? "MongoDB required" : `+${userStats.newThisWeek} this week`,
              ok: !userStats.noMongo,
            },
            {
              lbl: "Active today",
              val: userStats.noMongo ? "—" : liveActive,
              sub: "Sessions · last 24 h",
              ok: false,
            },
            {
              lbl: "Setup",
              val: `${doneCount}/${CHECKLIST.length}`,
              sub: doneCount === CHECKLIST.length ? "All configured ✓" : `${CHECKLIST.length - doneCount} remaining`,
              ok: doneCount === CHECKLIST.length,
            },
          ] as { lbl: string; val: number | string; sub: string; ok: boolean }[]).map((s, i) => (
            <div key={i} className="dk-stat">
              <span className="dk-stat-lbl">{s.lbl}</span>
              <span className="dk-stat-val">{s.val}</span>
              <span className={`dk-stat-sub${s.ok ? " green" : ""}`}>{s.sub}</span>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="dk-grid">

          {/* User growth chart */}
          <div className="dk-card">
            <div className="dk-card-hd">
              <span className="dk-card-title">User Growth · 7 days</span>
              <span className="dk-card-badge">{metrics?.noMongo ? "No MongoDB" : `${liveNewToday} today`}</span>
            </div>
            {metrics?.noMongo ? (
              <div className="dk-bar-empty">Connect MongoDB<br />to see real signup data</div>
            ) : (
              <div className="dk-bars">
                {weekData.map((d, i) => (
                  <div key={d.day} className="dk-bar-col" onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
                    {hovered === i && d.count > 0 && <div className="dk-bar-tip">{d.count}</div>}
                    <div className="dk-bar-seg" style={{ height: `${Math.max((d.count / weekMax) * 100, d.count > 0 ? 8 : 3)}%` }} />
                    <span className="dk-bar-day">{d.day}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="dk-card">
            <div className="dk-card-hd"><span className="dk-card-title">Quick Actions</span></div>
            <div className="dk-actions">
              {[
                { href: "/admin/brand",       lbl: "Brand Identity", sub: "Name, tagline, color",     ico: "◎" },
                { href: "/admin/agent",       lbl: "Agent Config",   sub: "Persona & welcome",        ico: "✦" },
                { href: "/admin/catalog",     lbl: "Catalog",        sub: `${liveCatalogTotal} products`, ico: "⊞" },
                { href: "/admin/users",       lbl: "Shoppers",       sub: `${liveTotal} registered`,  ico: "○" },
                { href: "/admin/analytics",   lbl: "Analytics",      sub: "Trends & performance",     ico: "▲" },
                { href: "/admin/preview",     lbl: "Preview",        sub: "See live storefront",      ico: "◈" },
              ].map((a) => (
                <Link key={a.href} href={a.href} className="dk-action">
                  <div className="dk-action-ico">{a.ico}</div>
                  <div>
                    <div className="dk-action-name">{a.lbl}</div>
                    <div className="dk-action-sub">{a.sub}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Setup checklist */}
          <div className="dk-card">
            <div className="dk-card-hd">
              <span className="dk-card-title">Setup Checklist</span>
              <span className="dk-card-badge">{doneCount}/{CHECKLIST.length} done</span>
            </div>
            <div className="dk-prog-wrap">
              <div className="dk-prog-row">
                <span>Progress</span>
                <span>{Math.round((doneCount / CHECKLIST.length) * 100)}%</span>
              </div>
              <div className="dk-prog-track">
                <div className="dk-prog-fill" style={{ width: `${(doneCount / CHECKLIST.length) * 100}%` }} />
              </div>
            </div>
            <div className="dk-checks">
              {CHECKLIST.map((c) => {
                const done = c.check(props);
                return (
                  <div key={c.key} className="dk-check">
                    <div className={`dk-check-ico ${done ? "on" : "off"}`}>{done ? "✓" : "·"}</div>
                    <span className={`dk-check-lbl${done ? "" : " off"}`}>{c.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* System status + welcome */}
          <div className="dk-card">
            <div className="dk-card-hd">
              <span className="dk-card-title">System Status</span>
              <span className="dk-card-badge">
                {[systemStatus.hasOpenRouter, systemStatus.hasVton, systemStatus.hasMongo].filter(Boolean).length}/3 online
              </span>
            </div>
            {[
              { lbl: "AI Agent",        desc: "OpenRouter → Claude Sonnet 4.6", ok: systemStatus.hasOpenRouter, okTxt: "Connected", errTxt: "Missing OPENROUTER_API_KEY", warn: false },
              { lbl: "Virtual Try-On",  desc: "fal.ai Nano Banana 2",           ok: systemStatus.hasVton,       okTxt: "Connected", errTxt: "Missing FAL_KEY",           warn: false },
              { lbl: "Database",        desc: "MongoDB · users & brand config",  ok: systemStatus.hasMongo,     okTxt: "Connected", errTxt: "Optional — set MONGODB_URI", warn: true  },
            ].map((s) => (
              <div key={s.lbl} className="dk-svc">
                <div>
                  <p className="dk-svc-name">{s.lbl}</p>
                  <p className="dk-svc-desc">{s.desc}</p>
                </div>
                <div className={`dk-pill ${s.ok ? "ok" : s.warn ? "warn" : "err"}`}>
                  <span className="dk-pill-dot" />
                  {s.ok ? s.okTxt : s.errTxt}
                </div>
              </div>
            ))}

            <hr className="dk-hr" />

            <div className="dk-card-hd" style={{ marginBottom: ".875rem" }}>
              <span className="dk-card-title">Welcome Message</span>
              <Link href="/admin/agent" className="dk-card-link">Edit →</Link>
            </div>
            <div className="dk-welcome">
              <div className="dk-ava">✦</div>
              <p className="dk-welcome-txt">&ldquo;{brand.welcomeMessage}&rdquo;</p>
            </div>
            {userStats.noMongo && (
              <div className="dk-mongo-note">
                User accounts disabled — add MONGODB_URI to .env.local to enable registration.
              </div>
            )}
          </div>

        </div>

        {/* Sign-out (hidden — handled by sidebar) — kept for keyboard accessibility */}
        <button onClick={handleLogout} style={{ display: "none" }} aria-hidden="true" />

      </div>
    </>
  );
}
