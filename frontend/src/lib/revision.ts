// Spaced revision. A topic gets a revision AFTER all its study sessions are completed.
// Review intervals: 1, 3, 7, 14, 30 days. The student's recall result moves the topic along them.
import { USE_MOCK, getSessions, toDateStr } from "@/lib/api";

export type Result = "FORGOT" | "PARTIAL" | "GOOD" | "STRONG";
export type Revision = {
  id: string; subjectId: string; subjectName: string; topicId: string; topicTitle: string;
  dueDate: string; step: number; status: "DUE" | "DONE";
};

export const INTERVALS = [1, 3, 7, 14, 30]; // days between reviews
const KEY = "sp_revisions";
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

function read(): Revision[] {
  try { const v = localStorage.getItem(KEY); return v ? (JSON.parse(v) as Revision[]) : []; } catch { return []; }
}
function write(r: Revision[]) { localStorage.setItem(KEY, JSON.stringify(r)); }

async function http<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method, credentials: "include", headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error((await res.text()) || "Request failed (" + res.status + ")");
  return res.json() as Promise<T>;
}

export function addDays(date: string, n: number) {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

// Mock only: look at completed sessions and create the first revision for finished topics.
async function sync(): Promise<Revision[]> {
  const sessions = await getSessions();
  const revs = read();
  const byTopic: Record<string, typeof sessions> = {};
  sessions.forEach((s) => { (byTopic[s.topicId] ??= []).push(s); });
  const today = toDateStr(new Date());
  Object.values(byTopic).forEach((list) => {
    const first = list[0];
    if (!list.every((s) => s.status === "COMPLETED")) return;      // topic not finished yet
    if (revs.some((r) => r.topicId === first.topicId)) return;     // revision already exists
    const lowest = Math.min(...list.map((s) => s.confidence ?? 3));
    const doneOn = list.map((s) => s.completedOn ?? today).sort().pop() as string;
    const step = lowest >= 4 ? 1 : 0;                              // confident students start at 3 days
    revs.push({ id: "r-" + first.topicId, subjectId: first.subjectId, subjectName: first.subjectName, topicId: first.topicId, topicTitle: first.topicTitle, dueDate: addDays(doneOn, INTERVALS[step]), step, status: "DUE" });
  });
  write(revs);
  return revs;
}

export async function getRevisions(): Promise<Revision[]> {
  return USE_MOCK ? sync() : http<Revision[]>("GET", "/api/revisions");
}

// Record how the review went and schedule the next one.
export async function reviewRevision(id: string, result: Result): Promise<Revision[]> {
  if (!USE_MOCK) { await http("POST", "/api/revisions/" + id + "/review", { result }); return getRevisions(); }
  const today = toDateStr(new Date());
  const all = read().map((r) => {
    if (r.id !== id) return r;
    if (result === "FORGOT") return { ...r, step: 0, dueDate: addDays(today, 1) };       // repeat tomorrow
    if (result === "PARTIAL") return { ...r, dueDate: addDays(today, 2) };               // same step, short wait
    const next = r.step + (result === "STRONG" ? 2 : 1);                                 // good = 1 step, strong = 2 steps
    if (next >= INTERVALS.length) return { ...r, step: next, status: "DONE" as const };
    return { ...r, step: next, dueDate: addDays(today, INTERVALS[next]) };
  });
  write(all);
  return all;
}