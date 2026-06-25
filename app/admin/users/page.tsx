"use client";

import { useEffect, useState, useCallback } from "react";

interface User {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  lastActive: string;
  conversationCount: number;
  preferences?: { gender?: string; maxBudget?: number };
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  pages: number;
  noMongo?: boolean;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  "#C9A84C20", "#4A7A5A20", "#7A4A6A20", "#4A5A7A20", "#7A6A4A20",
];

export default function UsersPage() {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = useCallback(() => {
    const url = `/api/admin/users?page=${page}&limit=20${debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ""}`;
    fetch(url)
      .then((r) => r.json())
      .then((d: UsersResponse) => setData(d))
      .catch(() => {});
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  return (
    <>
      <style>{`
        .users-page {
          min-height: 100vh;
          background: var(--adm-page, #F5F6F8);
          font-family: var(--font-sans, 'DM Sans', system-ui, sans-serif);
          -webkit-font-smoothing: antialiased;
        }
        .users-topbar {
          background: var(--adm-surface, #fff);
          border-bottom: 1px solid var(--adm-border, #E4E7EC);
          padding: 1.5rem 2rem;
          display: flex; align-items: center;
          justify-content: space-between; gap: 1.5rem; flex-wrap: wrap;
        }
        .users-title-area h1 {
          font-family: var(--font-sans, 'DM Sans', sans-serif);
          font-size: 1.375rem; font-weight: 700;
          color: var(--adm-ink, #111827);
          margin: 0 0 0.15rem; line-height: 1; letter-spacing: -0.02em;
        }
        .users-title-area p {
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 9px; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--adm-muted, #6B7280); margin: 0;
        }
        .users-search-wrap { position: relative; }
        .users-search-wrap svg {
          position: absolute; left: 0.875rem; top: 50%; transform: translateY(-50%);
          color: var(--adm-muted, #9CA3AF); pointer-events: none;
        }
        .users-search {
          background: var(--adm-surface, #fff);
          border: 1px solid var(--adm-border, #E4E7EC);
          color: var(--adm-ink, #111827);
          padding: 0.6rem 1rem 0.6rem 2.5rem;
          font-family: var(--font-sans, 'DM Sans', sans-serif);
          font-size: 13px; width: 260px; outline: none;
          border-radius: 4px; transition: border-color 0.15s;
        }
        .users-search::placeholder { color: var(--adm-muted, #9CA3AF); }
        .users-search:focus { border-color: var(--adm-ink, #111827); }

        .users-stats {
          display: flex; gap: 0.5rem; padding: 1rem 2rem;
          border-bottom: 1px solid var(--adm-border, #E4E7EC); flex-wrap: wrap;
          background: var(--adm-surface, #fff);
        }
        .stat-chip { display: flex; flex-direction: column; gap: 0.15rem; }
        .stat-chip-val {
          font-family: var(--font-sans, 'DM Sans', sans-serif);
          font-size: 1.5rem; font-weight: 700;
          color: var(--adm-ink, #111827); line-height: 1; letter-spacing: -0.04em;
        }
        .stat-chip-label {
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 9px; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--adm-muted, #6B7280);
        }
        .stat-chip-divider {
          width: 1px; background: var(--adm-border, #E4E7EC);
          align-self: stretch; margin: 0 0.5rem;
        }

        .no-mongo {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 1rem; padding: 5rem 2rem; text-align: center;
        }
        .no-mongo-icon {
          width: 48px; height: 48px; border: 1px solid var(--adm-border, #E4E7EC);
          display: flex; align-items: center; justify-content: center;
          color: var(--adm-muted, #9CA3AF); border-radius: 6px;
        }
        .no-mongo h2 {
          font-family: var(--font-sans, 'DM Sans', sans-serif);
          font-size: 1.125rem; font-weight: 700;
          color: var(--adm-ink, #111827); margin: 0;
        }
        .no-mongo p {
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 11px; color: var(--adm-muted, #6B7280);
          max-width: 40ch; line-height: 1.7; margin: 0;
        }
        .no-mongo code {
          color: var(--adm-ink, #111827); background: var(--adm-page, #F5F6F8);
          padding: 0.1em 0.4em; border-radius: 3px;
          border: 1px solid var(--adm-border, #E4E7EC);
        }

        .users-table-wrap { padding: 0 2rem 2.5rem; overflow-x: auto; }
        .users-table { width: 100%; border-collapse: collapse; min-width: 620px; }
        .users-table thead tr { border-bottom: 1px solid var(--adm-border, #E4E7EC); }
        .users-table th {
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 9px; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--adm-muted, #6B7280);
          padding: 0.75rem 1rem 0.75rem 0;
          text-align: left; font-weight: 600; white-space: nowrap;
        }
        .users-table td {
          padding: 0.875rem 1rem 0.875rem 0;
          border-bottom: 1px solid var(--adm-border-sm, #EEF0F4);
          vertical-align: middle;
        }
        .users-table tbody tr:hover td { background: rgba(0,0,0,0.015); }
        .users-table tbody tr:last-child td { border-bottom: none; }

        .user-cell { display: flex; align-items: center; gap: 0.75rem; }
        .user-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 10px; font-weight: 700;
          color: var(--adm-ink, #111827); flex-shrink: 0;
          background: var(--adm-page, #F5F6F8);
          border: 1px solid var(--adm-border, #E4E7EC);
        }
        .user-name { font-size: 13px; color: var(--adm-ink, #111827); font-weight: 600; line-height: 1.2; }
        .user-email {
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 10px; color: var(--adm-muted, #6B7280);
        }
        .td-mono {
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 11px; color: var(--adm-ink2, #374151); white-space: nowrap;
        }
        .td-badge {
          display: inline-flex; align-items: center;
          padding: 0.2em 0.6em; border: 1px solid var(--adm-border, #E4E7EC);
          border-radius: 4px; font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--adm-muted, #6B7280);
        }
        .td-conversations {
          font-family: var(--font-sans, 'DM Sans', sans-serif);
          font-size: 1.25rem; font-weight: 700; letter-spacing: -0.04em;
          color: var(--adm-ink, #111827);
        }

        .users-pagination {
          display: flex; align-items: center; gap: 0.5rem; padding: 0 2rem 2rem;
        }
        .pg-btn {
          background: var(--adm-surface, #fff);
          border: 1px solid var(--adm-border, #E4E7EC);
          color: var(--adm-ink2, #374151);
          padding: 0.4rem 0.875rem;
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 10px; font-weight: 600; letter-spacing: 0.08em;
          cursor: pointer; border-radius: 4px; transition: all 0.15s;
        }
        .pg-btn:hover:not(:disabled) { border-color: var(--adm-ink, #111827); color: var(--adm-ink, #111827); }
        .pg-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .pg-info {
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 10px; color: var(--adm-muted, #6B7280);
          letter-spacing: 0.08em; margin: 0 0.375rem;
        }

        .empty-state { text-align: center; padding: 4rem 2rem; }
        .empty-state p {
          font-family: var(--font-sans, 'DM Sans', sans-serif);
          font-size: 1rem; font-weight: 600; color: var(--adm-muted, #6B7280);
        }
        .empty-state span {
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 10px; color: var(--adm-muted, #9CA3AF);
          display: block; margin-top: 0.5rem;
        }
      `}</style>

      <div className="users-page">
        {/* Top bar */}
        <div className="users-topbar">
          <div className="users-title-area">
            <h1>Shoppers</h1>
            <p>Registered user accounts</p>
          </div>
          <div className="users-search-wrap">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              className="users-search"
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Stats bar */}
        {data && !data.noMongo && (
          <div className="users-stats">
            <div className="stat-chip">
              <span className="stat-chip-val">{data.total}</span>
              <span className="stat-chip-label">Total Users</span>
            </div>
            <div className="stat-chip-divider" />
            <div className="stat-chip">
              <span className="stat-chip-val">{data.users.length}</span>
              <span className="stat-chip-label">Showing</span>
            </div>
            {debouncedSearch && (
              <>
                <div className="stat-chip-divider" />
                <div className="stat-chip">
                  <span className="stat-chip-val">{data.total}</span>
                  <span className="stat-chip-label">Matches</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Content */}
        <div className="users-table-wrap" style={{ paddingTop: "1.5rem" }}>
          {!data ? (
            <div className="empty-state"><p>Loading…</p></div>
          ) : data.noMongo || !data.users ? (
            <div className="no-mongo">
              <div className="no-mongo-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <ellipse cx="12" cy="5" rx="9" ry="3"/>
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                </svg>
              </div>
              <h2>MongoDB unavailable</h2>
              <p>
                Could not connect to MongoDB. Check that <code>MONGODB_URI</code> is set correctly in <code>.env.local</code>, your Atlas cluster is running, and this machine&apos;s IP is whitelisted in Atlas Network Access.
              </p>
            </div>
          ) : data.users.length === 0 ? (
            <div className="empty-state">
              <p>{debouncedSearch ? "No users match your search." : "No users registered yet."}</p>
              <span>{debouncedSearch ? "Try a different search term." : "Users will appear here after they create an account."}</span>
            </div>
          ) : (
            <>
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Gender</th>
                    <th>Chats</th>
                    <th>Joined</th>
                    <th>Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((user, i) => (
                    <tr key={user._id}>
                      <td>
                        <div className="user-cell">
                          <div
                            className="user-avatar"
                            style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                          >
                            {initials(user.name)}
                          </div>
                          <div>
                            <div className="user-name">{user.name}</div>
                            <div className="user-email">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="td-badge">
                          {user.preferences?.gender ?? "all"}
                        </span>
                      </td>
                      <td>
                        <span className="td-conversations">{user.conversationCount}</span>
                      </td>
                      <td>
                        <span className="td-mono">
                          {new Date(user.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </span>
                      </td>
                      <td>
                        <span className="td-mono">{timeAgo(user.lastActive)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {data.pages > 1 && (
                <div className="users-pagination">
                  <button
                    className="pg-btn"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    ← Prev
                  </button>
                  <span className="pg-info">
                    {page} / {data.pages}
                  </span>
                  <button
                    className="pg-btn"
                    onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                    disabled={page === data.pages}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
