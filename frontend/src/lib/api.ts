// Simple file containing all Spring Boot backend calls.
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export type Topic = { id: string; title: string; difficulty: "EASY" | "MEDIUM" | "HARD"; estimatedMinutes: number };
export type Unit = { id: string; title: string; topics: Topic[] };
export type Subject = { id: string; name: string; examDate: string; units: Unit[] };
export type Session = {
  id: string; date: string; subjectId: string; subjectName: string; topicId: string; topicTitle: string;
  minutes: number; status: "PLANNED" | "COMPLETED"; completedOn?: string;
};
export type Resource = {
  title: string; channel: string; duration: string; score: number; url: string;
};
export type User = { name: string; email: string };

// Helper to call Spring Boot JSON endpoints
async function http<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error((await res.text()) || "Request failed (" + res.status + ")");
  if (res.status === 204 || res.headers.get("content-length") === "0") return undefined as T;
  return res.json() as Promise<T>;
}

// Local date formatted as YYYY-MM-DD
export function toDateStr(d: Date) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

// ---------- 1. AUTH (Login / Register / Logout) ----------
export async function register(name: string, email: string, password: string): Promise<User> {
  const u = await http<User>("POST", "/api/auth/register", { name, email, password });
  localStorage.setItem("sp_user", JSON.stringify(u));
  return u;
}

export async function login(email: string, password: string): Promise<User> {
  const u = await http<User>("POST", "/api/auth/login", { email, password });
  localStorage.setItem("sp_user", JSON.stringify(u));
  return u;
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem("sp_user");
    return v ? (JSON.parse(v) as User) : null;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem("sp_user");
}

// ---------- 2. SUBJECTS (Add via Text or PDF, List, Delete) ----------
export async function addSubject(name: string, examDate: string, text: string): Promise<Subject> {
  return http<Subject>("POST", "/api/syllabi/text", { name, examDate, text });
}

export async function addSubjectPdf(name: string, examDate: string, file: File): Promise<Subject> {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("examDate", examDate);
  formData.append("file", file);

  const res = await fetch(BASE + "/api/syllabi/pdf", {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  if (!res.ok) throw new Error((await res.text()) || "PDF upload failed");
  return res.json() as Promise<Subject>;
}

export async function getSubjects(): Promise<Subject[]> {
  return http<Subject[]>("GET", "/api/syllabi");
}

export async function deleteSubject(id: string): Promise<void> {
  await http("DELETE", "/api/syllabi/" + id);
}

// ---------- 3. STUDY PLAN & TODAY'S WORK ----------
export async function generatePlan(dailyMinutes: number): Promise<Session[]> {
  const res = await http<{ sessions: Session[] }>("POST", "/api/plans/generate", { dailyMinutes });
  return res.sessions;
}

export async function getSessions(): Promise<Session[]> {
  return http<Session[]>("GET", "/api/sessions");
}

export async function completeSession(id: string): Promise<Session[]> {
  return http<Session[]>("POST", "/api/sessions/" + id + "/complete");
}

// ---------- 4. LEARNING CONTENT & RESOURCES ----------
export async function getResources(topic: string, subject: string): Promise<Resource[]> {
  const q = new URLSearchParams({ topic, subject }).toString();
  return http<Resource[]>("GET", "/api/resources?" + q);
}