"use client";

import { useEffect, useState } from "react";

interface DayData { _id: string; count: number }
interface MetricsData {
  noMongo: boolean;
  daily: DayData[];
  activeNow: number;
  newToday: number;
  total: number;
  catalog: { total: number; women: number; men: number };
}
interface DayPoint { day: string; date: string; count: number }

function buildWeek(daily: DayData[]): DayPoint[] {
  const result: DayPoint[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
    const found   = daily.find((x) => x._id === dateStr);
    result.push({ day: dayName, date: dateStr, count: found?.count ?? 0 });
  }
  return result;
}

export default function AnalyticsPage() {
  const [metrics, setMetrics]       = useState<MetricsData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  useEffect(() => {
    function load() {
      fetch("/api/admin/metrics")
        .then((r) => r.json())
        .then((d: MetricsData) => {
          setMetrics(d);
          setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        })
        .catch(() => {});
    }
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  const weekData = metrics ? buildWeek(metrics.daily) : buildWeek([]);
  const weekMax  = Math.max(...weekData.map((d) => d.count), 1);
  const weekTotal = weekData.reduce((s, d) => s + d.count, 0);

  return (
    <>
      <style>{`
        .ap {
          min-height: 100vh;
          background: var(--adm-content, #F5F3EE);
          font-family: 'DM Sans', system-ui, sans-serif;
          padding-bottom: 5rem;
        }

        .ap-topbar {
          background: var(--adm-surface, #fff);
          border-bottom: 1px solid var(--adm-border, #E6DDD2);
          padding: 1.25rem 2rem;
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 1rem;
        }

        .ap-topbar h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.75rem;
          font-weight: 400;
          color: var(--adm-text, #1A1710);
          margin: 0;
          line-height: 1;
        }

        .ap-live-pill {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.05em;
          color: var(--adm-text3, #A89F94);
        }

        .live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #4A9A5A;
          animation: livepulse 2s ease-in-out infinite;
        }
        @keyframes livepulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

        .ap-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          padding: 2rem;
        }

        .ap-card {
          background: var(--adm-surface, #fff);
          border: 1px solid var(--adm-border, #E6DDD2);
          padding: 1.5rem;
          border-radius: 2px;
        }

        .ap-card-full { grid-column: 1 / -1; }

        .card-hd {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .card-hd-title {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--adm-text3, #A89F94);
        }

        .card-hd-eyebrow {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          color: rgba(184,148,30,0.7);
        }

        .big-stat {
          font-family: 'Cormorant Garamond', serif;
          font-size: 4rem;
          font-weight: 400;
          color: var(--adm-text, #1A1710);
          line-height: 1;
          margin-bottom: 0.3rem;
        }

        .big-stat-sub {
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--adm-text3, #A89F94);
        }

        .big-stat-delta {
          display: inline-block;
          margin-top: 0.5rem;
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          padding: 3px 8px;
          background: rgba(74,122,90,0.1);
          color: #4A7A5A;
          border-radius: 2px;
        }

        /* Bar chart */
        .bar-chart {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          height: 140px;
          margin-bottom: 0.75rem;
        }

        .bar-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          height: 100%;
          justify-content: flex-end;
          cursor: default;
          position: relative;
        }

        .bar-seg {
          width: 100%;
          background: var(--adm-gold-bg, rgba(184,148,30,0.12));
          border-top: 2px solid var(--adm-gold, #B8941E);
          min-height: 3px;
          border-radius: 1px 1px 0 0;
          transition: background 0.2s;
        }

        .bar-col:hover .bar-seg { background: rgba(184,148,30,0.22); }

        .bar-tooltip {
          position: absolute;
          bottom: calc(100% - 10px);
          left: 50%;
          transform: translateX(-50%);
          background: var(--adm-text, #1A1710);
          color: #fff;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          padding: 3px 8px;
          border-radius: 2px;
          white-space: nowrap;
          pointer-events: none;
          z-index: 10;
        }
        [data-theme="dark"] .bar-tooltip { background: #EDE5D8; color: #1A1710; }

        .bar-day {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: var(--adm-text3, #A89F94);
        }

        .bar-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 140px;
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          color: var(--adm-text3, #A89F94);
          letter-spacing: 0.05em;
          border: 1px dashed var(--adm-border, #E6DDD2);
          line-height: 1.6;
          text-align: center;
        }

        /* Catalog split */
        .cat-split {
          display: flex;
          height: 10px;
          border-radius: 1px;
          overflow: hidden;
          margin-bottom: 1rem;
        }
        .cat-split-w { background: var(--adm-gold, #B8941E); opacity: 0.7; transition: width 0.6s ease; }
        .cat-split-m { background: var(--adm-gold-bg, rgba(184,148,30,0.2)); flex: 1; }

        .cat-legend {
          display: flex;
          gap: 1.5rem;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          color: var(--adm-text2, #6B6155);
          letter-spacing: 0.05em;
        }
        .legend-dot { width: 10px; height: 10px; border-radius: 1px; }

        /* Funnel */
        .funnel { display: flex; flex-direction: column; gap: 0.75rem; }

        .funnel-step { display: flex; flex-direction: column; gap: 0.3rem; }
        .funnel-top {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
        }
        .funnel-label {
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--adm-text2, #6B6155);
        }
        .funnel-val {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.25rem;
          color: var(--adm-text, #1A1710);
          font-weight: 400;
        }
        .funnel-note {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: var(--adm-text3, #A89F94);
          margin-left: 0.5rem;
        }
        .funnel-bar {
          height: 4px;
          background: var(--adm-border, #E6DDD2);
          border-radius: 2px;
          overflow: hidden;
        }
        .funnel-bar-fill {
          height: 100%;
          background: var(--adm-gold, #B8941E);
          opacity: 0.6;
          border-radius: 2px;
          transition: width 0.6s ease;
        }

        /* Dark overrides */
        [data-theme="dark"] .ap         { background: #0E0C09; }
        [data-theme="dark"] .ap-topbar  { background: #0E0C09; border-color: #1E1B17; }
        [data-theme="dark"] .ap-topbar h1 { color: #EDE5D8; }
        [data-theme="dark"] .ap-live-pill { color: #3D3528; }
        [data-theme="dark"] .ap-card    { background: #141210; border-color: #1E1B17; }
        [data-theme="dark"] .big-stat   { color: #EDE5D8; }
        [data-theme="dark"] .funnel-val { color: #EDE5D8; }
        [data-theme="dark"] .funnel-label { color: #6A5F50; }
        [data-theme="dark"] .legend-item { color: #6A5F50; }
        [data-theme="dark"] .bar-empty  { border-color: #1E1B17; }
        [data-theme="dark"] .funnel-bar { background: #1E1B17; }
      `}</style>

      <div className="ap">
        <div className="ap-topbar">
          <h1>Analytics</h1>
          {lastUpdated && (
            <div className="ap-live-pill">
              <span className="live-dot" />
              Live · updated {lastUpdated}
            </div>
          )}
        </div>

        <div className="ap-grid">

          {/* Registered users */}
          <div className="ap-card">
            <div className="card-hd">
              <span className="card-hd-title">Registered Users</span>
              <span className="card-hd-eyebrow">All time</span>
            </div>
            <div className="big-stat">{metrics?.noMongo ? "—" : (metrics?.total ?? "…")}</div>
            <div className="big-stat-sub">Shopper accounts</div>
            {!metrics?.noMongo && metrics?.newToday != null && (
              <div className="big-stat-delta">+{metrics.newToday} today</div>
            )}
          </div>

          {/* Catalog */}
          <div className="ap-card">
            <div className="card-hd">
              <span className="card-hd-title">Catalog</span>
              <span className="card-hd-eyebrow">Products</span>
            </div>
            <div className="big-stat">{metrics?.catalog?.total ?? "…"}</div>
            <div className="big-stat-sub">Total products</div>
            {metrics?.catalog && (
              <>
                <div style={{ height: "1.25rem" }} />
                <div className="cat-split">
                  <div
                    className="cat-split-w"
                    style={{ width: `${(metrics.catalog.women / metrics.catalog.total) * 100}%` }}
                  />
                  <div className="cat-split-m" />
                </div>
                <div className="cat-legend">
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: "var(--adm-gold,#B8941E)", opacity: 0.7 }} />
                    Women · {metrics.catalog.women}
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: "rgba(184,148,30,0.2)" }} />
                    Men · {metrics.catalog.men}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Real 7-day signup chart */}
          <div className="ap-card">
            <div className="card-hd">
              <span className="card-hd-title">User signups · last 7 days</span>
              <span className="card-hd-eyebrow">
                {metrics?.noMongo ? "Needs MongoDB" : `${weekTotal} total`}
              </span>
            </div>
            {metrics?.noMongo ? (
              <div className="bar-empty">
                Connect MongoDB<br />to see real signup data
              </div>
            ) : (
              <div className="bar-chart">
                {weekData.map((d, i) => (
                  <div
                    key={d.day}
                    className="bar-col"
                    onMouseEnter={() => setHoveredBar(i)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    {hoveredBar === i && (
                      <div className="bar-tooltip">{d.count} signup{d.count !== 1 ? "s" : ""}</div>
                    )}
                    <div
                      className="bar-seg"
                      style={{ height: `${Math.max((d.count / weekMax) * 100, d.count > 0 ? 6 : 2)}%` }}
                    />
                    <span className="bar-day">{d.day}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active users + quick stats */}
          <div className="ap-card">
            <div className="card-hd">
              <span className="card-hd-title">Active users</span>
              <span className="card-hd-eyebrow">Last 24 h</span>
            </div>
            <div className="big-stat">
              {metrics?.noMongo ? "—" : (metrics?.activeNow ?? "…")}
            </div>
            <div className="big-stat-sub">Unique sessions</div>
            <div style={{ height: "1.5rem" }} />
            <div className="funnel">
              {[
                { label: "Total registered", val: String(metrics?.total ?? "—"), pct: 100 },
                { label: "Active today",     val: String(metrics?.activeNow ?? "—"), pct: metrics?.total ? Math.round(((metrics?.activeNow ?? 0) / metrics.total) * 100) : 0 },
                { label: "New today",        val: String(metrics?.newToday ?? "—"),  pct: metrics?.total ? Math.round(((metrics?.newToday ?? 0) / metrics.total) * 100) : 0 },
              ].map((s) => (
                <div key={s.label} className="funnel-step">
                  <div className="funnel-top">
                    <span className="funnel-label">{s.label}</span>
                    <span className="funnel-val">
                      {s.val}
                      {s.pct < 100 && s.pct > 0 && (
                        <span className="funnel-note">{s.pct}%</span>
                      )}
                    </span>
                  </div>
                  <div className="funnel-bar">
                    <div className="funnel-bar-fill" style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
