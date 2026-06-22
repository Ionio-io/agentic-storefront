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
          background: var(--adm-content, #0E0C09);
          font-family: 'DM Sans', system-ui, sans-serif;
        }

        .users-topbar {
          background: var(--adm-surface, #141210);
          border-bottom: 1px solid var(--adm-border, #1E1B17);
          padding: 1.5rem 2.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .users-title-area h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.75rem;
          font-weight: 300;
          color: var(--adm-text, #EDE5D8);
          margin: 0 0 0.15rem;
          line-height: 1;
        }

        .users-title-area p {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--adm-text2, #6A5F50);
          margin: 0;
        }

        .users-search-wrap {
          position: relative;
        }

        .users-search-wrap svg {
          position: absolute;
          left: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--adm-text3, #3D3528);
          pointer-events: none;
        }

        .users-search {
          background: var(--adm-card, #161310);
          border: 1px solid var(--adm-border, #1E1B17);
          color: var(--adm-text, #EDE5D8);
          padding: 0.65rem 1rem 0.65rem 2.5rem;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 13px;
          width: 260px;
          outline: none;
          transition: border-color 0.15s;
          caret-color: #C9A84C;
        }

        .users-search::placeholder { color: var(--adm-text3, #3D3528); }
        .users-search:focus { border-color: #C9A84C; }

        /* Stats chips */
        .users-stats {
          display: flex;
          gap: 1rem;
          padding: 1rem 2.5rem;
          border-bottom: 1px solid var(--adm-border, #1E1B17);
          flex-wrap: wrap;
        }

        .stat-chip {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .stat-chip-val {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          font-weight: 300;
          color: var(--adm-text, #EDE5D8);
          line-height: 1;
        }

        .stat-chip-label {
          font-family: 'DM Mono', monospace;
          font-size: 8px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--adm-text3, #3D3528);
        }

        .stat-chip-divider {
          width: 1px;
          background: var(--adm-border, #1E1B17);
          align-self: stretch;
          margin: 0 0.5rem;
        }

        /* No MongoDB state */
        .no-mongo {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 5rem 2rem;
          text-align: center;
        }

        .no-mongo-icon {
          width: 48px;
          height: 48px;
          border: 1px solid var(--adm-border2, #2A2520);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--adm-text3, #3D3528);
        }

        .no-mongo h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          font-weight: 300;
          color: var(--adm-text, #EDE5D8);
          margin: 0;
        }

        .no-mongo p {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: var(--adm-text3, #3D3528);
          max-width: 36ch;
          line-height: 1.7;
          letter-spacing: 0.02em;
          margin: 0;
        }

        .no-mongo code {
          color: #C9A84C;
          background: rgba(201,168,76,0.08);
          padding: 0.1em 0.4em;
        }

        /* Table */
        .users-table-wrap {
          padding: 0 2.5rem 2.5rem;
          overflow-x: auto;
        }

        .users-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 620px;
        }

        .users-table thead tr {
          border-bottom: 1px solid var(--adm-border, #1E1B17);
        }

        .users-table th {
          font-family: 'DM Mono', monospace;
          font-size: 8.5px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--adm-text3, #3D3528);
          padding: 0.875rem 1rem 0.875rem 0;
          text-align: left;
          font-weight: 400;
          white-space: nowrap;
        }

        .users-table td {
          padding: 0.875rem 1rem 0.875rem 0;
          border-bottom: 1px solid var(--adm-border, #1E1B17);
          vertical-align: middle;
        }

        .users-table tbody tr:hover td {
          background: rgba(255,255,255,0.01);
        }

        .users-table tbody tr:last-child td {
          border-bottom: none;
        }

        /* User cell */
        .user-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: #C9A84C;
          flex-shrink: 0;
          border: 1px solid rgba(201,168,76,0.2);
        }

        .user-name {
          font-size: 13px;
          color: var(--adm-text, #EDE5D8);
          font-weight: 400;
          line-height: 1.2;
        }

        .user-email {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: var(--adm-text3, #3D3528);
          letter-spacing: 0.02em;
        }

        .td-mono {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: var(--adm-text2, #6A5F50);
          letter-spacing: 0.02em;
          white-space: nowrap;
        }

        .td-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.2em 0.6em;
          border: 1px solid var(--adm-border2, #2A2520);
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--adm-text3, #3D3528);
        }

        .td-conversations {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.1rem;
          color: var(--adm-text, #EDE5D8);
          font-weight: 300;
        }

        /* Pagination */
        .users-pagination {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0 2.5rem 2rem;
        }

        .pg-btn {
          background: none;
          border: 1px solid var(--adm-border, #1E1B17);
          color: var(--adm-text2, #6A5F50);
          padding: 0.4rem 0.75rem;
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.15s;
        }

        .pg-btn:hover:not(:disabled) {
          border-color: #C9A84C;
          color: var(--adm-text, #EDE5D8);
        }

        .pg-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .pg-info {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          color: var(--adm-text3, #3D3528);
          letter-spacing: 0.1em;
          margin: 0 0.5rem;
        }

        /* Empty state */
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
        }

        .empty-state p {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.25rem;
          font-weight: 300;
          color: var(--adm-text3, #3D3528);
        }

        .empty-state span {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          color: var(--adm-text3, #3D3528);
          opacity: 0.6;
          display: block;
          margin-top: 0.5rem;
        }

        /* Light theme overrides */
        [data-theme="light"] .users-page { background: #F7F5F0; }
        [data-theme="light"] .users-topbar { background: #fff; border-color: #E8E0D4; }
        [data-theme="light"] .users-title-area h1 { color: #1A1710; }
        [data-theme="light"] .users-title-area p { color: #8A7A68; }
        [data-theme="light"] .users-search { background: #F7F5F0; border-color: #E0D8CC; color: #1A1710; }
        [data-theme="light"] .users-search::placeholder { color: #C0B8AA; }
        [data-theme="light"] .users-stats { border-color: #E8E0D4; }
        [data-theme="light"] .stat-chip-val { color: #1A1710; }
        [data-theme="light"] .stat-chip-label { color: #B0A898; }
        [data-theme="light"] .stat-chip-divider { background: #E8E0D4; }
        [data-theme="light"] .users-table th { color: #B0A898; }
        [data-theme="light"] .users-table td { border-color: #F0EBE3; }
        [data-theme="light"] .users-table tbody tr:hover td { background: #FAFAF5; }
        [data-theme="light"] .user-name { color: #1A1710; }
        [data-theme="light"] .user-email { color: #C0B8AA; }
        [data-theme="light"] .user-avatar { color: #C9A84C; border-color: rgba(201,168,76,0.3); }
        [data-theme="light"] .td-mono { color: #8A7A68; }
        [data-theme="light"] .td-badge { border-color: #E0D8CC; color: #8A7A68; }
        [data-theme="light"] .td-conversations { color: #1A1710; }
        [data-theme="light"] .pg-btn { border-color: #E0D8CC; color: #8A7A68; }
        [data-theme="light"] .pg-info { color: #B0A898; }
        [data-theme="light"] .no-mongo h2 { color: #1A1710; }
        [data-theme="light"] .empty-state p { color: #C0B8AA; }
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
