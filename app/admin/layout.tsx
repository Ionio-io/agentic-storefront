"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { href: "/admin", exact: true, label: "Dashboard", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="3" y="3" width="7" height="7" rx="0.5"/><rect x="14" y="3" width="7" height="7" rx="0.5"/><rect x="3" y="14" width="7" height="7" rx="0.5"/><rect x="14" y="14" width="7" height="7" rx="0.5"/></svg> },
      { href: "/admin/analytics", exact: false, label: "Analytics", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
      { href: "/admin/users", exact: false, label: "Shoppers", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    ],
  },
  {
    label: "Configure",
    items: [
      { href: "/admin/brand", exact: false, label: "Brand Identity", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg> },
      { href: "/admin/agent", exact: false, label: "Agent Config", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
      { href: "/admin/catalog", exact: false, label: "Catalog", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> },
      { href: "/admin/collections", exact: false, label: "Collections", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="3" y="3" width="7" height="5" rx="0.5"/><rect x="14" y="3" width="7" height="5" rx="0.5"/><rect x="3" y="12" width="7" height="9" rx="0.5"/><rect x="14" y="12" width="7" height="9" rx="0.5"/></svg> },
      { href: "/admin/catalog/sync", exact: false, label: "Sync Stores", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg> },
    ],
  },
  {
    label: "Test",
    items: [
      { href: "/admin/preview", exact: false, label: "Live Preview", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [brandName, setBrandName] = useState("AI Storefront");

  useEffect(() => {
    fetch("/api/brand", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d?.name) setBrandName(d.name); })
      .catch(() => {});
  }, []);

  if (pathname === "/admin/login") return <>{children}</>;

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        :root {
          --adm-page:      #F5F6F8;
          --adm-surface:   #FFFFFF;
          --adm-border:    #E4E7EC;
          --adm-border-sm: #EEF0F4;
          --adm-gold:      #C9A84C;
          --adm-gold-bg:   rgba(201,168,76,0.06);
          --adm-gold-md:   rgba(201,168,76,0.15);
          --adm-ink:       #111827;
          --adm-ink2:      #374151;
          --adm-muted:     #6B7280;
          --adm-sb-bg:     #FFFFFF;
          --adm-sb-border: #E4E7EC;
          --adm-sb-brand:  #111827;
          --adm-sb-role:   #9CA3AF;
          --adm-sb-label:  #D1D5DB;
          --adm-sb-link:   #374151;
          --adm-sb-link-h: #111827;
          --adm-sb-active: #111827;
          --adm-sb-active-bg: #F5F6F8;
        }

        body { background: var(--adm-page); margin: 0; }

        .admin-shell {
          display: flex;
          min-height: 100vh;
          font-family: var(--font-sans, 'DM Sans', system-ui, sans-serif);
          -webkit-font-smoothing: antialiased;
        }

        .admin-sidebar {
          width: 216px;
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
          padding: 1.25rem 1.25rem 1rem;
          border-bottom: 1px solid var(--adm-sb-border);
        }

        .sidebar-wordmark {
          font-family: var(--font-sans, 'DM Sans', sans-serif);
          font-size: 14px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--adm-sb-brand);
          display: block;
        }

        .sidebar-role {
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--adm-sb-role);
          margin-top: 0.2rem;
          display: block;
        }

        .sidebar-nav {
          flex: 1;
          padding: 0.5rem 0;
          overflow-y: auto;
        }

        .nav-section-label {
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--adm-sb-label);
          padding: 0.875rem 1.25rem 0.3rem;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.5rem 1.25rem;
          text-decoration: none;
          color: var(--adm-sb-link);
          font-size: 13px;
          font-weight: 500;
          border-left: 2px solid transparent;
          transition: color 0.1s, background 0.1s;
          margin: 1px 0.5rem;
          border-radius: 4px;
        }

        .nav-link:hover {
          color: var(--adm-sb-link-h);
          background: var(--adm-sb-active-bg);
        }

        .nav-link.active {
          color: var(--adm-sb-active);
          font-weight: 700;
          background: var(--adm-sb-active-bg);
          border-left-color: var(--adm-gold);
        }

        .nav-link svg { flex-shrink: 0; }
        .nav-link.active svg { color: var(--adm-gold); }

        .sidebar-footer {
          border-top: 1px solid var(--adm-sb-border);
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 2px;
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
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--adm-muted);
          transition: color 0.1s, background 0.1s;
          text-align: left;
          border-radius: 3px;
        }

        .footer-btn:hover { background: var(--adm-sb-active-bg); color: var(--adm-ink); }
        .footer-btn.danger:hover { color: #dc2626; }

        .admin-main {
          flex: 1;
          margin-left: 216px;
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
            <a href="/" target="_blank" className="footer-btn">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Storefront
            </a>
            <button onClick={handleLogout} className="footer-btn danger">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
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
