"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginContent() {
  const router  = useRouter();
  const params  = useSearchParams();
  const from    = params.get("from") ?? "/admin";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [status, setStatus]     = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [phase, setPhase]       = useState(0);
  const userRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 80);
    const t2 = setTimeout(() => setPhase(2), 900);
    const t3 = setTimeout(() => { setPhase(3); userRef.current?.focus(); }, 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password || status === "loading") return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        router.push(from);
        router.refresh();
      } else {
        const d = await res.json();
        setErrorMsg(d.error ?? "Incorrect credentials");
        setStatus("error");
        setPassword("");
      }
    } catch {
      setErrorMsg("Network error — please try again");
      setStatus("error");
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,500&family=Josefin+Sans:wght@100;200;300;400&family=Josefin+Mono:wght@200;300;400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:      #FFFFFF;
          --panel:   #F7F4F0;
          --surface: #FAFAF8;
          --border:  #E8E3DC;
          --border2: #D4CEC6;
          --dim:     #A89E92;
          --muted:   #7A7268;
          --body:    #3D3830;
          --dark:    #0D0B08;
          --gold:    #B8963E;
          --gold2:   #C9A84C;
          --gold-bg: rgba(184,150,62,0.06);
          --red:     #C04040;
        }

        body { background: var(--bg); }

        .lr {
          min-height: 100vh;
          display: flex;
          background: var(--bg);
          font-family: 'Josefin Sans', system-ui, sans-serif;
          overflow: hidden;
        }

        /* ── LEFT PANEL ── */
        .lr-left {
          flex: 0 0 52%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          background: var(--panel);
          overflow: hidden;
          padding: 3rem;
        }

        .lr-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(184,150,62,0.10) 1px, transparent 1px);
          background-size: 44px 44px;
          pointer-events: none;
          opacity: 0.5;
        }

        .lr-left::after {
          content: '';
          position: absolute;
          top: 15%; bottom: 15%; right: 0;
          width: 1px;
          background: linear-gradient(180deg, transparent, rgba(184,150,62,0.18) 30%, rgba(184,150,62,0.18) 70%, transparent);
          pointer-events: none;
        }

        .lr-corner {
          position: absolute;
          top: 2.5rem; left: 2.5rem;
          pointer-events: none;
        }
        .lr-corner-br {
          top: auto; left: auto;
          bottom: 2.5rem; right: 2.5rem;
          transform: rotate(180deg);
        }
        .corner-svg { display: block; }

        .lr-status {
          position: absolute;
          top: 2.75rem; right: 3rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: 'Josefin Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--dim);
        }

        .status-light {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--gold);
          animation: blink 2.8s ease-in-out infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 1; box-shadow: 0 0 6px var(--gold2); }
        }

        /* ── Diamond ── */
        .cipher-wrap {
          position: relative;
          width: min(260px, 40vw);
          height: min(260px, 40vw);
          margin-bottom: 3.5rem;
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        .cipher-wrap.phase1 { opacity: 1; }
        .cipher-svg { width: 100%; height: 100%; overflow: visible; }

        .cipher-outer {
          fill: none; stroke: var(--gold);
          stroke-width: 0.6;
          stroke-dasharray: 600; stroke-dashoffset: 600;
        }
        .cipher-wrap.phase1 .cipher-outer {
          animation: drawLine 1.1s cubic-bezier(0.4,0,0.2,1) 0.1s forwards;
        }

        .cipher-inner {
          fill: none; stroke: rgba(184,150,62,0.22);
          stroke-width: 0.4;
          stroke-dasharray: 420; stroke-dashoffset: 420;
        }
        .cipher-wrap.phase1 .cipher-inner {
          animation: drawLine 0.9s cubic-bezier(0.4,0,0.2,1) 0.3s forwards;
        }

        .cipher-cross {
          stroke: rgba(184,150,62,0.15); stroke-width: 0.4;
          stroke-dasharray: 200; stroke-dashoffset: 200;
        }
        .cipher-wrap.phase1 .cipher-cross {
          animation: drawLine 0.7s ease 0.6s forwards;
        }

        .cipher-w { opacity: 0; transition: opacity 0.6s ease; }
        .cipher-wrap.phase1 .cipher-w {
          animation: fadeIn 0.6s ease 1s forwards;
        }

        .cipher-arc {
          fill: none; stroke: rgba(184,150,62,0.4);
          stroke-width: 0.6;
          stroke-dasharray: 30; stroke-dashoffset: 30;
        }
        .cipher-wrap.phase1 .cipher-arc {
          animation: drawLine 0.4s ease 0.8s forwards;
        }

        @keyframes drawLine { to { stroke-dashoffset: 0; } }
        @keyframes fadeIn   { to { opacity: 1; } }

        /* ── Left text ── */
        .left-text {
          text-align: center;
          opacity: 0; transform: translateY(12px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .left-text.phase2 { opacity: 1; transform: translateY(0); }

        .left-wordmark {
          font-family: 'Josefin Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.5em;
          text-transform: uppercase;
          color: var(--gold);
          display: block;
          margin-bottom: 1rem;
        }

        .left-headline {
          font-family: 'Playfair Display', serif;
          font-size: clamp(1.75rem, 3.5vw, 2.5rem);
          font-weight: 400;
          font-style: italic;
          color: var(--dark);
          line-height: 1.2;
          letter-spacing: -0.01em;
        }
        .left-headline strong {
          font-style: normal; font-weight: 500;
          color: var(--body); display: block;
        }

        .left-tag {
          margin-top: 1.25rem;
          display: flex; align-items: center; justify-content: center; gap: 0.75rem;
          font-family: 'Josefin Mono', monospace;
          font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase;
          color: var(--dim);
        }
        .tag-rule {
          display: inline-block; width: 2rem; height: 1px;
          background: var(--gold); opacity: 0.4;
        }

        /* ── RIGHT PANEL ── */
        .lr-right {
          flex: 1;
          display: flex; align-items: center; justify-content: center;
          padding: 3rem 2rem;
          background: var(--bg);
          position: relative;
        }
        .lr-right::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 30% 40%, rgba(184,150,62,0.04) 0%, transparent 65%);
          pointer-events: none;
        }

        /* ── Form wrapper ── */
        .fw {
          width: 100%; max-width: 360px;
          opacity: 0; transform: translateX(16px);
          transition: opacity 0.55s ease, transform 0.55s ease;
        }
        .fw.phase3 { opacity: 1; transform: translateX(0); }

        .fw-eyebrow {
          display: flex; align-items: center; gap: 0.6rem;
          font-family: 'Josefin Mono', monospace;
          font-size: 9px; letter-spacing: 0.35em; text-transform: uppercase;
          color: var(--dim);
          margin-bottom: 0.75rem;
        }
        .fw-eyebrow-dot {
          width: 4px; height: 4px; border-radius: 50%;
          background: var(--gold); opacity: 0.8;
        }

        .fw-title {
          font-family: 'Playfair Display', serif;
          font-size: 2.75rem; font-weight: 400; font-style: italic;
          color: var(--dark);
          line-height: 1; margin-bottom: 0.35rem; letter-spacing: -0.02em;
        }
        .fw-sub {
          font-size: 12px; font-weight: 300;
          color: var(--muted); letter-spacing: 0.05em; margin-bottom: 2.5rem;
        }

        /* ── Fields ── */
        .fld { margin-bottom: 1.125rem; position: relative; }

        .fld-label {
          display: block;
          font-family: 'Josefin Mono', monospace;
          font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase;
          color: var(--dim); margin-bottom: 0.5rem; transition: color 0.2s;
        }
        .fld:focus-within .fld-label { color: var(--gold); }

        .fld-box {
          position: relative;
          border: 1px solid var(--border);
          background: var(--surface);
          transition: border-color 0.2s, background 0.2s;
        }
        .fld-box:focus-within {
          border-color: var(--gold);
          background: var(--bg);
          box-shadow: 0 0 0 3px rgba(184,150,62,0.08);
        }

        .fld-box::before, .fld-box::after {
          content: ''; position: absolute;
          width: 6px; height: 6px; opacity: 0; transition: opacity 0.2s;
        }
        .fld-box::before { top: -1px; left: -1px; border-top: 1px solid var(--gold); border-left: 1px solid var(--gold); }
        .fld-box::after  { bottom: -1px; right: -1px; border-bottom: 1px solid var(--gold); border-right: 1px solid var(--gold); }
        .fld-box:focus-within::before,
        .fld-box:focus-within::after { opacity: 1; }

        .fld-input {
          width: 100%; background: transparent; border: none; outline: none;
          padding: 0.875rem 2.75rem 0.875rem 1rem;
          font-family: 'Josefin Sans', system-ui, sans-serif;
          font-size: 14px; font-weight: 300; letter-spacing: 0.05em;
          color: var(--dark); caret-color: var(--gold);
        }
        .fld-input::placeholder { color: var(--border2); font-size: 13px; }

        .fld-eye {
          position: absolute; right: 0.875rem; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: var(--dim); padding: 0.25rem; line-height: 1; transition: color 0.2s;
        }
        .fld-eye:hover { color: var(--body); }

        /* ── Error ── */
        .fw-error {
          display: flex; align-items: flex-start; gap: 0.625rem;
          padding: 0.75rem 1rem;
          background: rgba(192,64,64,0.05);
          border: 1px solid rgba(192,64,64,0.18);
          margin-bottom: 1.125rem;
          font-family: 'Josefin Mono', monospace;
          font-size: 10px; letter-spacing: 0.04em;
          color: var(--red); line-height: 1.5;
          animation: errorSlide 0.2s ease;
        }
        @keyframes errorSlide {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fw-error svg { flex-shrink: 0; margin-top: 0.05rem; }

        /* ── Submit ── */
        .fw-btn {
          width: 100%; padding: 0.9rem 1.5rem;
          background: var(--dark);
          border: 1px solid var(--dark);
          cursor: pointer;
          font-family: 'Josefin Mono', monospace;
          font-size: 10px; letter-spacing: 0.4em; text-transform: uppercase;
          color: #FAFAF8;
          transition: background 0.2s, color 0.2s, border-color 0.2s;
          margin-top: 0.5rem;
          position: relative; overflow: hidden;
        }
        .fw-btn::before {
          content: ''; position: absolute; inset: 0;
          background: var(--gold);
          transform: translateX(-101%);
          transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
        }
        .fw-btn span { position: relative; z-index: 1; }
        .fw-btn:hover:not(:disabled)::before { transform: translateX(0); }
        .fw-btn:hover:not(:disabled) { border-color: var(--gold); }
        .fw-btn:hover:not(:disabled) span { color: var(--dark); }
        .fw-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        .btn-spinner {
          display: inline-block; width: 10px; height: 10px;
          border: 1px solid rgba(250,250,248,0.3);
          border-top-color: #FAFAF8;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          vertical-align: middle; margin-right: 0.6rem;
          position: relative; z-index: 1;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Footer ── */
        .fw-footer {
          margin-top: 2rem; padding-top: 1.5rem;
          border-top: 1px solid var(--border);
          display: flex; flex-direction: column; gap: 0.625rem;
        }
        .fw-hint {
          font-family: 'Josefin Mono', monospace;
          font-size: 9px; letter-spacing: 0.05em;
          color: var(--dim); line-height: 1.7;
        }
        .fw-back {
          font-family: 'Josefin Mono', monospace;
          font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--muted); text-decoration: none; transition: color 0.2s;
        }
        .fw-back:hover { color: var(--dark); }

        @media (max-width: 760px) {
          .lr-left { display: none; }
          .lr-right { background: var(--surface); }
        }
      `}</style>

      <div className="lr">
        {/* LEFT PANEL */}
        <div className="lr-left">
          <div className="lr-corner">
            <svg className="corner-svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M28 1H1V28" stroke="rgba(184,150,62,0.35)" strokeWidth="0.75"/>
            </svg>
          </div>
          <div className="lr-corner lr-corner-br">
            <svg className="corner-svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M28 1H1V28" stroke="rgba(184,150,62,0.35)" strokeWidth="0.75"/>
            </svg>
          </div>

          <div className="lr-status">
            <span className="status-light" />
            System online
          </div>

          <div className={`cipher-wrap ${phase >= 1 ? "phase1" : ""}`}>
            <svg className="cipher-svg" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon className="cipher-inner" points="100,28 172,100 100,172 28,100" />
              <polygon className="cipher-outer" points="100,10 190,100 100,190 10,100" />
              <line className="cipher-cross" x1="100" y1="0" x2="100" y2="200" />
              <line className="cipher-cross" x1="0" y1="100" x2="200" y2="100" />
              <path className="cipher-arc" d="M100 4 A96 96 0 0 1 118 6" />
              <path className="cipher-arc" d="M194 100 A96 96 0 0 1 192 118" />
              <path className="cipher-arc" d="M100 196 A96 96 0 0 1 82 194" />
              <path className="cipher-arc" d="M6 100 A96 96 0 0 1 8 82" />
              <text
                className="cipher-w"
                x="100" y="115"
                textAnchor="middle"
                fontFamily="Playfair Display, serif"
                fontSize="52"
                fontStyle="italic"
                fontWeight="400"
                fill="rgba(184,150,62,0.7)"
              >W</text>
              <line x1="100" y1="5"   x2="100" y2="12"  stroke="rgba(184,150,62,0.35)" strokeWidth="0.75"/>
              <line x1="195" y1="100" x2="188" y2="100" stroke="rgba(184,150,62,0.35)" strokeWidth="0.75"/>
              <line x1="100" y1="195" x2="100" y2="188" stroke="rgba(184,150,62,0.35)" strokeWidth="0.75"/>
              <line x1="5"   y1="100" x2="12"  y2="100" stroke="rgba(184,150,62,0.35)" strokeWidth="0.75"/>
            </svg>
          </div>

          <div className={`left-text ${phase >= 2 ? "phase2" : ""}`}>
            <span className="left-wordmark">Westside AI</span>
            <h1 className="left-headline">
              The intelligence<br />
              <strong>behind the storefront.</strong>
            </h1>
            <p className="left-tag">
              <span className="tag-rule" />
              Admin Console
              <span className="tag-rule" />
            </p>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="lr-right">
          <div className={`fw ${phase >= 3 ? "phase3" : ""}`}>
            <div className="fw-eyebrow">
              <span className="fw-eyebrow-dot" />
              Restricted access
            </div>
            <h2 className="fw-title">Sign in</h2>
            <p className="fw-sub">Enter your credentials to continue</p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="fld">
                <label className="fld-label" htmlFor="usr">Username</label>
                <div className="fld-box">
                  <input
                    ref={userRef}
                    id="usr"
                    className="fld-input"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    placeholder="admin"
                  />
                </div>
              </div>

              <div className="fld">
                <label className="fld-label" htmlFor="pwd">Password</label>
                <div className="fld-box">
                  <input
                    id="pwd"
                    className="fld-input"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="fld-eye"
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={showPass ? "Hide password" : "Show password"}
                  >
                    {showPass ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {status === "error" && (
                <div className="fw-error">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                className="fw-btn"
                disabled={!username || !password || status === "loading"}
              >
                {status === "loading" ? (
                  <>
                    <span className="btn-spinner" />
                    <span>Authenticating…</span>
                  </>
                ) : (
                  <span>Authenticate →</span>
                )}
              </button>
            </form>

            <div className="fw-footer">
              <p className="fw-hint">
                Default: admin / westside2024 &nbsp;·&nbsp; Override via env vars.
              </p>
              <a href="/" className="fw-back">← Back to storefront</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
