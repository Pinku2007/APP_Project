"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import * as api from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false); // show/hide password
  const [busy, setBusy] = useState(false);     // disables button while working
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "register") await api.register(name, email, password);
      else await api.login(email, password);
      router.push("/"); // go to the main workspace
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-wrap">
      {/* LEFT: brand panel */}
      <section className="auth-brand">
        <h1>StudyPilot</h1>
        <p className="fs-5">Add your subjects. Get a plan that gives each one the time it needs.</p>
        <ul>
          <li>Add every subject with its syllabus and exam date</li>
          <li>See how your daily hours are split across subjects</li>
          <li>Track what you finished and how confident you feel</li>
        </ul>
      </section>

      {/* RIGHT: form */}
      <section className="auth-form">
        <div className="panel p-4" style={{ width: 380 }}>
          <h2 className="h4 mb-1">{mode === "login" ? "Welcome back" : "Create your account"}</h2>
          <p className="text-secondary small mb-3">
            {mode === "login" ? "Log in to continue your plan." : "It takes less than a minute."}
          </p>

          <ul className="nav nav-tabs mb-3">
            <li className="nav-item"><button type="button" className={"nav-link " + (mode === "login" ? "active" : "")} onClick={() => setMode("login")}>Log in</button></li>
            <li className="nav-item"><button type="button" className={"nav-link " + (mode === "register" ? "active" : "")} onClick={() => setMode("register")}>Create account</button></li>
          </ul>

          <form onSubmit={submit}>
            {mode === "register" && (
              <div className="mb-3">
                <label className="form-label">Name</label>
                <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <div className="input-group">
                <input type={showPw ? "text" : "password"} className="form-control" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                <button type="button" className="btn btn-outline-dark" onClick={() => setShowPw(!showPw)}>{showPw ? "Hide" : "Show"}</button>
              </div>
            </div>
            {error && <div className="note">{error}</div>}
            <button className="btn btn-dark w-100" type="submit" disabled={busy}>
              {busy ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}