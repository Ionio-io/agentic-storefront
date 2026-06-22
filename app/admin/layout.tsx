"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type Theme = "dark" | "light";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      {
        href: "/admin", exact: true, label: "Dashboard",
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="3" y="3" width="7" height="7" rx="0.5"/><rect x="14" y="3" width="7" height="7" rx="0.5"/><rect x="3" y="14" width="7" height="7" rx="0.5"/><rect x="14" y="14" width="7" height="7" rx="0.5"/></svg>,
      },
      {
        href: "/admin/analytics", exact: false, label: "Analytics",
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
      },
      {
        href: "/admin/users", exact: false, label: "Shoppers",
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      },
    ],
  },
  {
    label: "Configure",
    items: [
      {
        href: "/admin/brand", exact: false, label: "Brand Identity",
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>,
      },
      {
        href: "/admin/agent", exact: false, label: "Agent Config",
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
      },
      {
        href: "/admin/catalog", exact: false, label: "Catalog",
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
      },
    ],
  },
  {
    label: "Test",
    items: [
      {
        href: "/admin/preview", exact: false, label: "Live Preview",
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
      },
    ],
  },
];

function SunIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>("light");
  const [brandName, setBrandName] = useState("AI Storefront");

  useEffect(() => {
    fetch("/api/brand")
      .then((r) => r.json())
      .then((d) => { if (d?.name) setBrandName(d.name); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const saved = (localStorage.getItem("admin-theme") ?? "light") as Theme;
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("admin-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }

  if (pathname === "/admin/login") return <>{children}</>;

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        /* ─────────────────────────────
           LIGHT (default)
           ───────────────────────────── */
        :root, [data-theme="light"] {
          --adm-page:      #F4F6F9;
          --adm-surface:   #FFFFFF;
          --adm-border:    #E2E8F0;
          --adm-border-sm: #EEF2F7;
          --adm-gold:      #C9A84C;
          --adm-gold-bg:   rgba(201,168,76,0.07);
          --adm-gold-md:   rgba(201,168,76,0.15);
          --adm-ink:       #0D1117;
          --adm-ink2:      #4A5568;
          --adm-muted:     #8896A5;
          /* sidebar — WHITE in light mode */
          --adm-sb-bg:     #FFFFFF;
          --adm-sb-border: #E2E8F0;
          --adm-sb-brand:  #0D1117;
          --adm-sb-role:   #8896A5;
          --adm-sb-label:  #B0BBC8;
          --adm-sb-link:   #4A5568;
          --adm-sb-link-h: #0D1117;
          --adm-sb-active: #0D1117;
          --adm-sb-active-bg: rgba(201,168,76,0.08);
          --adm-sb-footer: rgba(0,0,0,0.04);
          --adm-sb-toggle: #8896A5;
        }

        /* ─────────────────────────────
           DARK override
           ───────────────────────────── */
        [data-theme="dark"] {
          --adm-page:      #0A0C10;
          --adm-surface:   #111318;
          --adm-border:    #1E2330;
          --adm-border-sm: #191E28;
          --adm-gold:      #C9A84C;
          --adm-gold-bg:   rgba(201,168,76,0.06);
          --adm-gold-md:   rgba(201,168,76,0.12);
          --adm-ink:       #EDF2F7;
          --adm-ink2:      #718096;
          --adm-muted:     #4A5568;
          --adm-sb-bg:     #0D1117;
          --adm-sb-border: #1A1F2E;
          --adm-sb-brand:  #C9A84C;
          --adm-sb-role:   rgba(201,168,76,0.35);
          --adm-sb-label:  rgba(255,255,255,0.18);
          --adm-sb-link:   rgba(255,255,255,0.35);
          --adm-sb-link-h: rgba(255,255,255,0.7);
          --adm-sb-active: #EDF2F7;
          --adm-sb-active-bg: rgba(201,168,76,0.08);
          --adm-sb-footer: rgba(255,255,255,0.03);
          --adm-sb-toggle: rgba(255,255,255,0.3);
        }

        body { background: var(--adm-page); margin: 0; }

        .admin-shell {
          display: flex;
          min-height: 100vh;
          font-family: 'DM Sans', system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        /* ─── Sidebar ─── */
        .admin-sidebar {
          width: 220px;
          flex-shrink: 0;
          background: var(--adm-sb-bg);
          border-right: 1px solid var(--adm-sb-border);
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0; bottom: 0; left: 0;
          z-index: 40;
        }

        .sidebar-brand {
          padding: 1.375rem 1.375rem 1.125rem;
          border-bottom: 1px solid var(--adm-sb-border);
        }

        .sidebar-wordmark {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: -0.01em;
          color: var(--adm-sb-brand);
          display: block;
        }

        .sidebar-role {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--adm-sb-role);
          margin-top: 0.25rem;
          display: block;
        }

        .sidebar-nav {
          flex: 1;
          padding: 0.625rem 0;
          overflow-y: auto;
        }

        .nav-section-label {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--adm-sb-label);
          padding: 1rem 1.375rem 0.375rem;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.575rem 1.375rem;
          text-decoration: none;
          color: var(--adm-sb-link);
          font-size: 13px;
          font-weight: 500;
          border-left: 2px solid transparent;
          transition: color 0.12s, background 0.12s;
          margin: 1px 0;
        }

        .nav-link:hover {
          color: var(--adm-sb-link-h);
          background: var(--adm-sb-footer);
        }

        .nav-link.active {
          color: var(--adm-sb-active);
          font-weight: 700;
          border-left-color: var(--adm-gold);
          background: var(--adm-sb-active-bg);
        }

        .nav-link svg { flex-shrink: 0; transition: opacity 0.12s; }
        .nav-link.active svg { color: var(--adm-gold); }

        /* Footer */
        .sidebar-footer {
          border-top: 1px solid var(--adm-sb-border);
          padding: 0.625rem;
        }

        .footer-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          width: 100%;
          background: none;
          border: none;
          cursor: pointer;
          text-decoration: none;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--adm-sb-toggle);
          transition: color 0.12s, background 0.12s;
          text-align: left;
          border-radius: 3px;
        }

        .footer-btn:hover {
          background: var(--adm-sb-footer);
          color: var(--adm-sb-link-h);
        }
        .footer-btn.danger:hover { color: #C0392B; }

        .theme-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          margin-bottom: 2px;
          cursor: pointer;
          background: var(--adm-sb-footer);
          border: 1px solid var(--adm-sb-border);
          border-radius: 3px;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--adm-sb-toggle);
          transition: all 0.12s;
          width: 100%;
          text-align: left;
        }

        .theme-toggle:hover {
          border-color: var(--adm-gold-md);
          color: var(--adm-sb-link-h);
        }

        .theme-indicator {
          width: 22px; height: 12px;
          border-radius: 99px;
          background: var(--adm-border);
          position: relative;
          margin-left: auto;
          flex-shrink: 0;
          transition: background 0.2s;
        }

        .theme-indicator.on { background: var(--adm-gold); }

        .theme-indicator::after {
          content: '';
          position: absolute;
          top: 2px; left: 2px;
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #fff;
          transition: transform 0.2s;
          box-shadow: 0 1px 2px rgba(0,0,0,0.15);
        }

        .theme-indicator.on::after { transform: translateX(10px); }

        /* Main content */
        .admin-main {
          flex: 1;
          margin-left: 220px;
          min-height: 100vh;
          background: var(--adm-page);
          overflow: auto;
        }
      `}</style>

      <div className="admin-shell">
        <aside className="admin-sidebar">
          <div className="sidebar-brand">
            <span className="sidebar-wordmark">{brandName}</span>
            <span className="sidebar-role">Admin Panel</span>
          </div>

          <nav className="sidebar-nav">
            {NAV_SECTIONS.map((section) => (
              <div key={section.label}>
                <div className="nav-section-label">{section.label}</div>
                {section.items.map(({ href, exact, label, icon }) => {
                  const active = exact ? pathname === href : pathname.startsWith(href);
                  return (
                    <Link key={href} href={href} className={`nav-link ${active ? "active" : ""}`}>
                      {icon}
                      {label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="sidebar-footer">
            <button onClick={toggleTheme} className="theme-toggle">
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
              {theme === "dark" ? "Light mode" : "Dark mode"}
              <div className={`theme-indicator ${theme === "dark" ? "on" : ""}`} />
            </button>

            <a href="/" target="_blank" className="footer-btn">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Storefront
            </a>
            <button onClick={handleLogout} className="footer-btn danger">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign out
            </button>
          </div>
        </aside>

        <main className="admin-main">{children}</main>
      </div>
    </>
  );
}
