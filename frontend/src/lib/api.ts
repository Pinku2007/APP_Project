// ALL backend calls live in this one file.
// USE_MOCK = true  -> fake data saved in the browser (localStorage), no backend needed.
// USE_MOCK = false -> real Spring Boot endpoints (set NEXT_PUBLIC_API_URL if backend runs on another port).
export const USE_MOCK = true;
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export type Topic = { id: string; title: string; difficulty: "EASY" | "MEDIUM" | "HARD"; estimatedMinutes: number };
export type Unit = { id: string; title: string; topics: Topic[] };
export type Subject = { id: string; name: string; examDate: string; units: Unit[] };
export type Session = {
  id: string; date: string; subjectId: string; subjectName: string; topicId: string; topicTitle: string;
  minutes: number; status: "PLANNED" | "COMPLETED" | "SKIPPED"; actualMinutes?: number; confidence?: number; completedOn?: string;
};
// missing = minutes that do NOT fit before the exam, per subject id
export type PlanResult = { sessions: Session[]; missing: Record<string, number> };
export type User = { name: string; email: string };

// ---------- small helpers ----------
function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
function write(key: string, value: unknown) { localStorage.setItem(key, JSON.stringify(value)); }

async function http<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method, credentials: "include", headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error((await res.text()) || "Request failed (" + res.status + ")");
  return res.json() as Promise<T>;
}

// local date as YYYY-MM-DD (avoids timezone bugs)
export function toDateStr(d: Date) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

// ---------- AUTH ----------
export async function register(name: string, email: string, password: string): Promise<User> {
  if (USE_MOCK) { const u = { name, email }; write("sp_user", u); return u; }
  return http<User>("POST", "/api/auth/register", { name, email, password });
}
export async function login(email: string, password: string): Promise<User> {
  if (USE_MOCK) { const u = read<User>("sp_user", { name: email.split("@")[0], email }); write("sp_user", u); return u; }
  return http<User>("POST", "/api/auth/login", { email, password });
}
export function getUser(): User | null { return read<User | null>("sp_user", null); }
export function logout() { localStorage.removeItem("sp_user"); }

// ---------- SUBJECTS ----------
// Mock parser: a line starting with "Unit" starts a new unit, every other line is a topic.
function parseUnits(text: string, subjectId: string): Unit[] {
  const units: Unit[] = [];
  const levels: Topic["difficulty"][] = ["EASY", "MEDIUM", "HARD"];
  const mins = { EASY: 30, MEDIUM: 45, HARD: 60 };
  text.split("\n").map((l) => l.trim()).filter(Boolean).forEach((line, i) => {
    if (/^unit/i.test(line)) { units.push({ id: subjectId + "-u" + i, title: line, topics: [] }); return; }
    if (units.length === 0) units.push({ id: subjectId + "-u0", title: "Topics", topics: [] });
    const difficulty = levels[line.length % 3];
    units[units.length - 1].topics.push({ id: subjectId + "-t" + i, title: line, difficulty, estimatedMinutes: mins[difficulty] });
  });
  return units.filter((u) => u.topics.length > 0);
}

export async function addSubject(name: string, examDate: string, text: string): Promise<Subject> {
  if (!USE_MOCK) return http<Subject>("POST", "/api/syllabi/text", { name, examDate, text });
  const id = "s" + Date.now();
  const units = parseUnits(text, id);
  if (units.length === 0) throw new Error("No topics found. Put one topic per line.");
  const subject: Subject = { id, name, examDate, units };
  write("sp_subjects", [...read<Subject[]>("sp_subjects", []), subject]);
  return subject;
}
export async function getSubjects(): Promise<Subject[]> {
  return USE_MOCK ? read<Subject[]>("sp_subjects", []) : http<Subject[]>("GET", "/api/syllabi");
}
export async function deleteSubject(id: string): Promise<void> {
  if (!USE_MOCK) { await http("DELETE", "/api/syllabi/" + id); return; }
  write("sp_subjects", read<Subject[]>("sp_subjects", []).filter((s) => s.id !== id));
  write("sp_sessions_v2", read<Session[]>("sp_sessions_v2", []).filter((s) => s.subjectId !== id));
}

// ---------- PLAN ----------
// Mock planner. Each day: 85% of daily time is used (15% stays as buffer).
// That time is split across subjects by "required daily pace" =
//   (minutes still left in the subject) / (days left until THAT subject's exam).
// So a subject with a near exam or a big syllabus automatically gets more time.
export async function generatePlan(subjects: Subject[], dailyMinutes: number): Promise<PlanResult> {
  if (!USE_MOCK) return http<PlanResult>("POST", "/api/plans/generate", { syllabusIds: subjects.map((s) => s.id), dailyMinutes });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const cap = Math.floor(dailyMinutes * 0.85);
  const sessions: Session[] = [];

  const qs = subjects.map((s) => {
    const topics = s.units.flatMap((u) => u.topics);
    const daysAvail = Math.floor((new Date(s.examDate + "T00:00:00").getTime() - today.getTime()) / 86400000);
    if (daysAvail < 1) throw new Error("Exam date for " + s.name + " must be after today.");
    return { s, topics, idx: 0, left: topics[0]?.estimatedMinutes ?? 0, daysAvail, remaining: topics.reduce((a, t) => a + t.estimatedMinutes, 0) };
  });
  type Q = (typeof qs)[number];

  // give `mins` minutes to subject q on a given day, walking through its topics in order
  function take(q: Q, mins: number, date: string): number {
    let used = 0;
    while (mins > 0 && q.idx < q.topics.length) {
      const chunk = Math.min(mins, q.left);
      const t = q.topics[q.idx];
      sessions.push({ id: "ss" + sessions.length, date, subjectId: q.s.id, subjectName: q.s.name, topicId: t.id, topicTitle: t.title, minutes: chunk, status: "PLANNED" });
      q.left -= chunk; q.remaining -= chunk; mins -= chunk; used += chunk;
      if (q.left === 0) { q.idx++; q.left = q.topics[q.idx]?.estimatedMinutes ?? 0; }
    }
    return used;
  }

  const lastDay = Math.max(...qs.map((q) => q.daysAvail));
  for (let day = 0; day < lastDay; day++) {
    const d = new Date(today); d.setDate(today.getDate() + day);
    const date = toDateStr(d);
    const active = qs.filter((q) => q.remaining > 0 && day < q.daysAvail);
    if (active.length === 0) continue;
    const pace = (q: Q) => q.remaining / (q.daysAvail - day);
    const sum = active.reduce((a, q) => a + pace(q), 0);
    let used = 0;
    for (const q of active) used += take(q, Math.min(Math.floor((cap * pace(q)) / sum), q.remaining), date);
    // spare minutes (rounding or subjects that finished early) go to the subject with most work left
    let spare = cap - used;
    while (spare > 0) {
      const next = active.filter((q) => q.remaining > 0).sort((a, b) => b.remaining - a.remaining)[0];
      if (!next) break;
      spare -= take(next, spare, date);
    }
  }

  const missing: Record<string, number> = {};
  qs.forEach((q) => { if (q.remaining > 0) missing[q.s.id] = q.remaining; });
  write("sp_sessions_v2", sessions);
  return { sessions, missing };
}

export async function getSessions(): Promise<Session[]> {
  return USE_MOCK ? read<Session[]>("sp_sessions_v2", []) : http<Session[]>("GET", "/api/calendar/events");
}
export async function completeSession(id: string, actualMinutes: number, confidence: number): Promise<Session[]> {
  if (!USE_MOCK) { await http("POST", "/api/sessions/" + id + "/complete", { actualMinutes, confidence }); return getSessions(); }
  const all = read<Session[]>("sp_sessions_v2", []).map((x) =>
    x.id === id ? { ...x, status: "COMPLETED" as const, actualMinutes, confidence, completedOn: toDateStr(new Date()) } : x);
  write("sp_sessions_v2", all); return all;
}