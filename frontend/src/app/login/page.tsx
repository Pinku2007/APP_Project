"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import * as api from "@/lib/api";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError("");
    const cleanEmail = email.trim().toLowerCase();
    const cleanPw = password.trim();

    if (!cleanEmail) {
      setError("Please enter your email.");
      return;
    }
    if (!cleanPw) {
      setError("Please enter your password.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "register") {
        await api.register(name.trim() || "Student", cleanEmail, cleanPw);
      } else {
        await api.login(cleanEmail, cleanPw);
      }
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  // Quick 1-click login for presentations / demos
  async function quickLogin(demoEmail: string, demoPw: string) {
    setError("");
    setEmail(demoEmail);
    setPassword(demoPw);
    setBusy(true);
    try {
      await api.login(demoEmail, demoPw);
      router.push("/");
    } catch {
      // If backend was completely reset and demo user missing, register it automatically
      try {
        await api.register(demoEmail.startsWith("student") ? "Harpreet Singh" : "Demo Student", demoEmail, demoPw);
        router.push("/");
      } catch (regErr) {
        setError(regErr instanceof Error ? regErr.message : "Login failed");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="sp-root">
      {/* LEFT: brand panel */}
      <section className="sp-brand">
        <span className="sp-orb sp-orb-1" aria-hidden="true" />
        <span className="sp-orb sp-orb-2" aria-hidden="true" />

        <div className="sp-logo">
          <div className="sp-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" fillOpacity="0.25" />
            </svg>
          </div>
          <span className="sp-logo-name">StudyPilot</span>
        </div>

        <div className="sp-hero">
          <h1 className="sp-title">Add your subjects. Get a plan that gives each one the time it needs.</h1>
          <p className="sp-sub">A study schedule balanced automatically around your deadlines and strengths.</p>

          <ul className="sp-features">
            {[
              "Add every subject with its syllabus and exam date",
              "See how your daily hours are split across subjects",
              "Track what you finished and how confident you feel",
            ].map((text) => (
              <li key={text}>
                <span className="sp-check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ul>

          <div className="sp-preview" aria-hidden="true">
            <div className="sp-mini sp-mini-main">
              <div className="sp-mini-head">
                <span className="sp-tag">Object Oriented Programming</span>
                <span className="sp-meta">Exam in 14 days</span>
              </div>
              <div className="sp-mini-row">
                <span>Syllabus covered</span>
                <b>68%</b>
              </div>
              <div className="sp-bar"><span /></div>
            </div>

            <div className="sp-mini-stats">
              <div className="sp-mini sp-mini-stat">
                <svg className="sp-ring" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#eeeafd" strokeWidth="3.5" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#6d58d1" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="75 100" />
                </svg>
                <div>
                  <p className="sp-stat-title">3.0 hrs planned today</p>
                  <p className="sp-stat-sub">Persistent H2 database</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div />
      </section>

      {/* RIGHT: form */}
      <section className="sp-form-side">
        <div className="sp-logo sp-mobile-brand">
          <div className="sp-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" fillOpacity="0.25" />
            </svg>
          </div>
          <span className="sp-logo-name">StudyPilot</span>
        </div>

        <div className="sp-card">
          <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
          <p className="sp-card-sub">
            {mode === "login" ? "Log in to view or generate your study timetable." : "Sign up in seconds to start planning."}
          </p>

          <div className="sp-tabs" role="tablist" aria-label="Log in or create account">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              className={"sp-tab " + (mode === "login" ? "active" : "")}
              onClick={() => { setMode("login"); setError(""); }}
            >
              Log in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "register"}
              className={"sp-tab " + (mode === "register" ? "active" : "")}
              onClick={() => { setMode("register"); setError(""); }}
            >
              Create account
            </button>
          </div>

          <form className="sp-form" onSubmit={submit}>
            {mode === "register" && (
              <div>
                <label className="sp-label" htmlFor="name">Your Name</label>
                <input
                  id="name"
                  className="sp-input"
                  placeholder="e.g. Harpreet Singh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label className="sp-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="sp-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="sp-label" htmlFor="password">Password</label>
              <div className="sp-pw">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  className="sp-input"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button type="button" className="sp-toggle" onClick={() => setShowPw(!showPw)}>
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div className="sp-error" role="alert">
                {error}
                {error.includes("No account found") && mode === "login" && (
                  <div style={{ marginTop: "6px" }}>
                    <button
                      type="button"
                      style={{ background: "none", border: "none", color: "#6d58d1", cursor: "pointer", fontWeight: 600, padding: 0, textDecoration: "underline", font: "inherit", fontSize: "0.85rem" }}
                      onClick={() => { setMode("register"); setError(""); }}
                    >
                      Click here to sign up with this email
                    </button>
                  </div>
                )}
              </div>
            )}

            <button className="sp-btn" type="submit" disabled={busy}>
              {busy ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>

          {/* Quick Demo Section for College Presentation */}
          <div className="sp-divider">One-click Demo for Presentation</div>
          <div className="sp-demo-box">
            <div className="sp-demo-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span>Instant Test &amp; Presentation Login</span>
            </div>
            <div className="sp-demo-actions">
              <button
                type="button"
                className="sp-demo-btn"
                disabled={busy}
                onClick={() => quickLogin("demo@studypilot.com", "password123")}
              >
                Demo Student
              </button>
              <button
                type="button"
                className="sp-demo-btn"
                disabled={busy}
                onClick={() => quickLogin("student@studypilot.com", "password123")}
              >
                Harpreet Singh
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
