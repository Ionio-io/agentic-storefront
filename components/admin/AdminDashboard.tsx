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

  const [metrics, setMetrics]     = useState<MetricsData | null>(null);
  const [lastUpdated, setLast]    = useState<string>("");
  const [hovered, setHovered]     = useState<number | null>(null);

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

  const GOLD   = "#C9A84C";
  const GOLD_B = "rgba(201,168,76,0.08)";
  const GOLD_M = "rgba(201,168,76,0.18)";

  return (
    <>
      <style>{`
        /* Dashboard — white, crisp, gold-accented */
        .d { min-height:100vh; background:#F4F6F9; font-family:'DM Sans',system-ui,sans-serif; -webkit-font-smoothing:antialiased; padding-bottom:4rem; }

        /* ── topbar ── */
        .d-bar {
          background:#fff;
          border-bottom:1px solid #E2E8F0;
          height:52px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:0 1.75rem;
          position:sticky;
          top:0;
          z-index:20;
        }
        .d-bar-l { display:flex; align-items:center; gap:.625rem; }
        .d-bar-dot { width:8px; height:8px; border-radius:50%; background:${GOLD}; flex-shrink:0; }
        .d-bar-title { font-size:14px; font-weight:800; letter-spacing:-.02em; color:#0D1117; }
        .d-bar-sep { width:1px; height:14px; background:#E2E8F0; }
        .d-bar-sub { font-family:'DM Mono',monospace; font-size:11px; font-weight:500; color:#8896A5; letter-spacing:.03em; }
        .d-bar-r { display:flex; align-items:center; gap:1rem; }
        .d-live {
          display:flex; align-items:center; gap:.375rem;
          padding:3px 10px; border-radius:20px;
          background:${GOLD_B}; border:1px solid ${GOLD_M};
        }
        .d-live-dot {
          width:6px; height:6px; border-radius:50%; background:#22C55E;
          animation:lp 2s ease-in-out infinite;
        }
        @keyframes lp { 0%,100%{opacity:.5} 50%{opacity:1;box-shadow:0 0 5px #22C55E} }
        .d-live-txt { font-family:'DM Mono',monospace; font-size:10px; font-weight:600; color:${GOLD}; letter-spacing:.05em; }
        .d-bar-link { font-size:12px; font-weight:600; color:#4A5568; text-decoration:none; transition:color .12s; }
        .d-bar-link:hover { color:#0D1117; }
        .d-bar-btn { font-size:12px; font-weight:600; color:#8896A5; background:none; border:none; cursor:pointer; padding:0; transition:color .12s; }
        .d-bar-btn:hover { color:#C0392B; }

        /* ── brand banner — white with gold accent ── */
        .d-banner {
          background:#fff;
          border-bottom:1px solid #E2E8F0;
          padding:1.625rem 1.75rem;
          display:flex; align-items:center; justify-content:space-between; gap:1rem;
          position:relative; overflow:hidden;
        }
        .d-banner::before {
          content:'';
          position:absolute; top:0; left:0; bottom:0; width:3px;
          background:${GOLD};
        }
        .d-banner-l { padding-left:.75rem; }
        .d-banner-eyebrow { font-family:'DM Mono',monospace; font-size:9px; font-weight:600; letter-spacing:.3em; text-transform:uppercase; color:#8896A5; margin:0 0 .35rem; }
        .d-banner-name { font-size:1.75rem; font-weight:800; letter-spacing:-.04em; color:#0D1117; line-height:1; margin:0 0 .25rem; }
        .d-banner-tag { font-size:12px; color:#8896A5; font-weight:400; }
        .d-banner-r { text-align:right; flex-shrink:0; }
        .d-banner-rl { font-family:'DM Mono',monospace; font-size:9px; font-weight:600; letter-spacing:.25em; text-transform:uppercase; color:#8896A5; margin:0 0 .35rem; }
        .d-banner-agent { font-size:1.25rem; font-weight:800; letter-spacing:-.02em; color:#0D1117; display:flex; align-items:center; gap:.45rem; justify-content:flex-end; }
        .d-agent-dot { width:7px; height:7px; border-radius:50%; background:${GOLD}; animation:ap 1.8s ease-in-out infinite; flex-shrink:0; }
        @keyframes ap { 0%,100%{opacity:.4;transform:scale(.85)} 50%{opacity:1;transform:scale(1.1);box-shadow:0 0 5px ${GOLD}} }

        /* ── stats strip ── */
        .d-stats { display:grid; grid-template-columns:repeat(4,1fr); background:#fff; border-bottom:1px solid #E2E8F0; }
        .d-stat {
          padding:1.5rem 1.75rem;
          border-right:1px solid #E2E8F0;
          position:relative;
          transition:background .12s;
          cursor:default;
        }
        .d-stat:last-child { border-right:none; }
        .d-stat:hover { background:${GOLD_B}; }
        .d-stat::after {
          content:'';
          position:absolute;
          top:0; left:0; right:0; height:3px;
          background:${GOLD};
          transform:scaleX(0);
          transform-origin:left;
          transition:transform .2s ease;
        }
        .d-stat:hover::after { transform:scaleX(1); }
        .d-stat-lbl { font-family:'DM Mono',monospace; font-size:9px; font-weight:600; letter-spacing:.25em; text-transform:uppercase; color:#8896A5; display:block; margin-bottom:.5rem; }
        .d-stat-val { font-size:3rem; font-weight:800; letter-spacing:-.05em; color:#0D1117; line-height:1; display:block; margin-bottom:.35rem; }
        .d-stat-sub { font-family:'DM Mono',monospace; font-size:11px; font-weight:500; color:#8896A5; }
        .d-stat-sub.ok { color:#1A8A4A; font-weight:700; }

        /* ── grid ── */
        .d-grid { display:grid; grid-template-columns:1fr 1fr; gap:1.125rem; padding:1.375rem 1.75rem; }
        .d-card { background:#fff; border:1px solid #E2E8F0; border-radius:6px; padding:1.375rem 1.5rem; box-shadow:0 1px 4px rgba(13,17,23,.04); }
        .d-card-hd { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.125rem; padding-bottom:.875rem; border-bottom:1px solid #EEF2F7; }
        .d-card-title { font-size:11px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:#0D1117; }
        .d-card-badge { font-family:'DM Mono',monospace; font-size:10px; font-weight:600; color:#8896A5; background:#F4F6F9; border:1px solid #E2E8F0; padding:2px 8px; border-radius:4px; }
        .d-card-link { font-family:'DM Mono',monospace; font-size:10px; font-weight:600; color:${GOLD}; text-decoration:none; transition:opacity .15s; }
        .d-card-link:hover { opacity:.65; }

        /* ── bar chart ── */
        .d-bars { display:flex; align-items:flex-end; gap:7px; height:110px; margin-bottom:.75rem; }
        .d-bar-col { flex:1; display:flex; flex-direction:column; align-items:center; gap:5px; height:100%; justify-content:flex-end; position:relative; }
        .d-bar-seg {
          width:100%;
          background:${GOLD_M};
          border-radius:2px 2px 0 0;
          min-height:3px;
          border-top:2px solid ${GOLD};
          transition:background .15s;
        }
        .d-bar-col:hover .d-bar-seg { background:rgba(201,168,76,.32); }
        .d-bar-tip {
          position:absolute; bottom:calc(100% - 4px); left:50%; transform:translateX(-50%);
          background:#0D1117; color:#fff;
          font-family:'DM Mono',monospace; font-size:10px; font-weight:700;
          padding:3px 7px; border-radius:3px; white-space:nowrap; pointer-events:none; z-index:10;
        }
        .d-bar-day { font-family:'DM Mono',monospace; font-size:9px; font-weight:600; color:#8896A5; letter-spacing:.06em; text-transform:uppercase; }
        .d-bar-empty {
          display:flex; align-items:center; justify-content:center;
          height:110px; font-family:'DM Mono',monospace; font-size:11px; font-weight:500;
          color:#8896A5; border:1.5px dashed #E2E8F0; border-radius:4px; text-align:center; line-height:1.9;
        }

        /* ── actions ── */
        .d-actions { display:grid; grid-template-columns:1fr 1fr; gap:.5rem; }
        .d-action {
          display:flex; align-items:center; gap:.75rem;
          padding:.875rem 1rem;
          background:#fff; border:1px solid #E2E8F0;
          text-decoration:none; border-radius:5px;
          transition:border-color .12s, box-shadow .12s, transform .1s;
        }
        .d-action:hover { border-color:${GOLD}; box-shadow:0 0 0 3px ${GOLD_B}; transform:translateY(-1px); }
        .d-action-ico {
          width:32px; height:32px; border-radius:5px;
          background:#F4F6F9; border:1px solid #E2E8F0;
          display:flex; align-items:center; justify-content:center;
          flex-shrink:0; color:${GOLD}; font-size:13px;
          transition:background .12s, border-color .12s;
        }
        .d-action:hover .d-action-ico { background:${GOLD_B}; border-color:${GOLD_M}; }
        .d-action-lbl { font-size:12px; font-weight:700; color:#0D1117; letter-spacing:-.01em; line-height:1.2; }
        .d-action-sub { font-family:'DM Mono',monospace; font-size:10px; font-weight:500; color:#8896A5; margin-top:.1rem; }

        /* ── checklist ── */
        .d-prog-wrap { margin-bottom:1rem; }
        .d-prog-row { display:flex; justify-content:space-between; font-family:'DM Mono',monospace; font-size:10px; font-weight:600; color:#8896A5; margin-bottom:.4rem; letter-spacing:.04em; }
        .d-prog-track { height:4px; background:#EEF2F7; border-radius:2px; overflow:hidden; }
        .d-prog-fill { height:100%; background:${GOLD}; border-radius:2px; transition:width .6s cubic-bezier(.22,1,.36,1); }
        .d-checks { display:flex; flex-direction:column; }
        .d-check { display:flex; align-items:center; gap:.7rem; padding:.575rem 0; border-bottom:1px solid #EEF2F7; }
        .d-check:last-child { border-bottom:none; }
        .d-check-ico {
          width:18px; height:18px; border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          flex-shrink:0; font-size:9px; font-weight:800;
        }
        .d-check-ico.on { background:${GOLD}; color:#fff; }
        .d-check-ico.off { background:#fff; border:1.5px solid #E2E8F0; color:#B0BBC8; }
        .d-check-lbl { font-size:13px; font-weight:600; color:#0D1117; }
        .d-check-lbl.off { color:#8896A5; font-weight:400; }

        /* ── system status ── */
        .d-status { display:flex; align-items:center; justify-content:space-between; padding:.7rem 0; border-bottom:1px solid #EEF2F7; }
        .d-status:last-of-type { border-bottom:none; }
        .d-status-name { font-size:13px; font-weight:700; color:#0D1117; margin:0 0 .1rem; }
        .d-status-desc { font-family:'DM Mono',monospace; font-size:10px; font-weight:500; color:#8896A5; margin:0; }
        .d-pill { display:flex; align-items:center; gap:.35rem; font-family:'DM Mono',monospace; font-size:10px; font-weight:700; letter-spacing:.04em; padding:3px 9px; border-radius:20px; white-space:nowrap; }
        .d-pill.ok   { background:rgba(26,138,74,.07); color:#1A8A4A; }
        .d-pill.warn { background:rgba(212,128,10,.07); color:#D4800A; }
        .d-pill.err  { background:rgba(192,57,43,.07);  color:#C0392B; }
        .d-pill-dot  { width:5px; height:5px; border-radius:50%; background:currentColor; flex-shrink:0; }

        /* ── welcome ── */
        .d-hr { border:none; border-top:1px solid #EEF2F7; margin:1.125rem 0 1rem; }
        .d-welcome { display:flex; align-items:flex-start; gap:.75rem; padding:.875rem 1rem; background:#F4F6F9; border-radius:5px; border:1px solid #E2E8F0; }
        .d-ava { width:30px; height:30px; border-radius:50%; background:#0D1117; display:flex; align-items:center; justify-content:center; color:${GOLD}; font-size:11px; flex-shrink:0; }
        .d-welcome-txt { font-size:13px; font-weight:400; font-style:italic; color:#4A5568; line-height:1.65; margin:0; }
        .d-mongo-note { margin-top:.75rem; padding:.75rem .875rem; background:${GOLD_B}; border:1px solid ${GOLD_M}; border-radius:4px; font-family:'DM Mono',monospace; font-size:11px; font-weight:500; color:${GOLD}; line-height:1.6; }
      `}</style>

      <div className="d">

        {/* topbar */}
        <div className="d-bar">
          <div className="d-bar-l">
            <div className="d-bar-dot" />
            <span className="d-bar-title">Dashboard</span>
            <div className="d-bar-sep" />
            <span className="d-bar-sub">Westside Admin</span>
          </div>
          <div className="d-bar-r">
            {lastUpdated && (
              <div className="d-live">
                <span className="d-live-dot" />
                <span className="d-live-txt">Live · {lastUpdated}</span>
              </div>
            )}
            <Link href="/chat" target="_blank" className="d-bar-link">Storefront ↗</Link>
            <button onClick={handleLogout} className="d-bar-btn">Sign out</button>
          </div>
        </div>

        {/* brand banner */}
        <div className="d-banner">
          <div className="d-banner-l">
            <p className="d-banner-eyebrow">Active configuration</p>
            <h2 className="d-banner-name">{brand.name}</h2>
            <p className="d-banner-tag">{brand.tagline}</p>
          </div>
          <div className="d-banner-r">
            <p className="d-banner-rl">AI Stylist</p>
            <div className="d-banner-agent">
              <span className="d-agent-dot" />
              {brand.agentName}
            </div>
          </div>
        </div>

        {/* stats */}
        <div className="d-stats">
          {[
            { lbl: "Products",    val: stats.totalProducts,                           sub: `${stats.womenProducts}W · ${stats.menProducts}M`, ok: false },
            { lbl: "Shoppers",    val: liveTotal,                                     sub: userStats.noMongo ? "MongoDB required" : `+${userStats.newThisWeek} this week`, ok: !userStats.noMongo },
            { lbl: "Active today",val: userStats.noMongo ? "—" : liveActive,          sub: "Sessions · last 24 h", ok: false },
            { lbl: "Setup",       val: `${doneCount}/${CHECKLIST.length}`,            sub: doneCount === CHECKLIST.length ? "All configured ✓" : `${CHECKLIST.length - doneCount} remaining`, ok: doneCount === CHECKLIST.length },
          ].map((s, i) => (
            <div key={i} className="d-stat">
              <span className="d-stat-lbl">{s.lbl}</span>
              <span className="d-stat-val">{s.val}</span>
              <span className={`d-stat-sub${s.ok ? " ok" : ""}`}>{s.sub}</span>
            </div>
          ))}
        </div>

        {/* grid */}
        <div className="d-grid">

          {/* chart */}
          <div className="d-card">
            <div className="d-card-hd">
              <span className="d-card-title">User Growth · 7 days</span>
              <span className="d-card-badge">{metrics?.noMongo ? "No MongoDB" : `${liveNewToday} today`}</span>
            </div>
            {metrics?.noMongo ? (
              <div className="d-bar-empty">Connect MongoDB<br />to see real signup data</div>
            ) : (
              <div className="d-bars">
                {weekData.map((d, i) => (
                  <div key={d.day} className="d-bar-col" onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
                    {hovered === i && d.count > 0 && <div className="d-bar-tip">{d.count}</div>}
                    <div className="d-bar-seg" style={{ height: `${Math.max((d.count / weekMax) * 100, d.count > 0 ? 8 : 3)}%` }} />
                    <span className="d-bar-day">{d.day}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* actions */}
          <div className="d-card">
            <div className="d-card-hd"><span className="d-card-title">Quick Actions</span></div>
            <div className="d-actions">
              {[
                { href: "/admin/brand",     lbl: "Brand Identity", sub: "Name, tagline, color",    ico: "◎" },
                { href: "/admin/agent",     lbl: "Agent Config",   sub: "Persona & welcome",       ico: "✦" },
                { href: "/admin/catalog",   lbl: "Catalog",        sub: "Products & uploads",      ico: "⊞" },
                { href: "/admin/users",     lbl: "Shoppers",       sub: `${liveTotal} registered`, ico: "○" },
                { href: "/admin/analytics", lbl: "Analytics",      sub: "Trends & performance",    ico: "▲" },
                { href: "/admin/preview",   lbl: "Preview",        sub: "See live storefront",     ico: "◈" },
              ].map((a) => (
                <Link key={a.href} href={a.href} className="d-action">
                  <div className="d-action-ico">{a.ico}</div>
                  <div>
                    <div className="d-action-lbl">{a.lbl}</div>
                    <div className="d-action-sub">{a.sub}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* checklist */}
          <div className="d-card">
            <div className="d-card-hd">
              <span className="d-card-title">Setup Checklist</span>
              <span className="d-card-badge">{doneCount}/{CHECKLIST.length} done</span>
            </div>
            <div className="d-prog-wrap">
              <div className="d-prog-row">
                <span>Progress</span>
                <span>{Math.round((doneCount / CHECKLIST.length) * 100)}%</span>
              </div>
              <div className="d-prog-track">
                <div className="d-prog-fill" style={{ width: `${(doneCount / CHECKLIST.length) * 100}%` }} />
              </div>
            </div>
            <div className="d-checks">
              {CHECKLIST.map((c) => {
                const done = c.check(props);
                return (
                  <div key={c.key} className="d-check">
                    <div className={`d-check-ico ${done ? "on" : "off"}`}>{done ? "✓" : "·"}</div>
                    <span className={`d-check-lbl${done ? "" : " off"}`}>{c.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* status + welcome */}
          <div className="d-card">
            <div className="d-card-hd">
              <span className="d-card-title">System Status</span>
              <span className="d-card-badge">
                {[systemStatus.hasOpenRouter, systemStatus.hasVton, systemStatus.hasMongo].filter(Boolean).length}/3 online
              </span>
            </div>
            {[
              { lbl: "AI Agent",       desc: "OpenRouter → gpt-4o-mini",     ok: systemStatus.hasOpenRouter, okTxt: "Connected", errTxt: "Missing OPENROUTER_API_KEY", warn: false },
              { lbl: "Virtual Try-On", desc: "fal.ai Nano Banana 2",               ok: systemStatus.hasVton,       okTxt: "Connected", errTxt: "Missing FAL_KEY",           warn: false },
              { lbl: "Database",       desc: "MongoDB · users & brand config",ok: systemStatus.hasMongo,     okTxt: "Connected", errTxt: "Optional — set MONGODB_URI", warn: true  },
            ].map((s) => (
              <div key={s.lbl} className="d-status">
                <div>
                  <p className="d-status-name">{s.lbl}</p>
                  <p className="d-status-desc">{s.desc}</p>
                </div>
                <div className={`d-pill ${s.ok ? "ok" : s.warn ? "warn" : "err"}`}>
                  <span className="d-pill-dot" />
                  {s.ok ? s.okTxt : s.errTxt}
                </div>
              </div>
            ))}

            <hr className="d-hr" />

            <div className="d-card-hd" style={{ marginBottom: ".875rem" }}>
              <span className="d-card-title">Welcome Message</span>
              <Link href="/admin/agent" className="d-card-link">Edit →</Link>
            </div>
            <div className="d-welcome">
              <div className="d-ava">✦</div>
              <p className="d-welcome-txt">&ldquo;{brand.welcomeMessage}&rdquo;</p>
            </div>
            {userStats.noMongo && (
              <div className="d-mongo-note">
                User accounts disabled — add MONGODB_URI to .env.local to enable registration.
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
