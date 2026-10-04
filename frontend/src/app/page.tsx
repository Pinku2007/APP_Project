"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as api from "@/lib/api";
import type { Subject, Session } from "@/lib/api";

type Tab = "subjects" | "plan" | "today";
const SAMPLE = "Unit 1: Classes and Objects\nConstructors\nStatic members\nUnit 2: Inheritance\nTypes of inheritance\nMethod overriding";

// days from today until a date (YYYY-MM-DD)
function daysUntil(date: string) {
  return Math.ceil((new Date(date + "T00:00:00").getTime() - Date.now()) / 86400000);
}

export default function Workspace() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  // "add subject" form
  const [name, setName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [text, setText] = useState("");
  // plan setting
  const [hours, setHours] = useState(3);
  // results
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [missing, setMissing] = useState<Record<string, number>>({});
  const [tab, setTab] = useState<Tab>("subjects");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // on first load: check login, then load saved data
  useEffect(() => {
    const u = api.getUser();
    if (!u) { router.replace("/login"); return; }
    setUserName(u.name);
    api.getSubjects().then(setSubjects).catch(() => {});
    api.getSessions().then(setSessions).catch(() => {});
  }, [router]);

  // runs an action, shows any error in the grey note box
  async function run<T>(fn: () => Promise<T>) {
    setBusy(true); setError("");
    try { return await fn(); }
    catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); }
    finally { setBusy(false); }
  }

  const add = () => run(async () => {
    if (!name.trim()) throw new Error("Enter a subject name.");
    if (!examDate) throw new Error("Pick the exam date for this subject.");
    await api.addSubject(name.trim(), examDate, text);
    setSubjects(await api.getSubjects());
    setName(""); setExamDate(""); setText(""); setTab("subjects");
  });
  const remove = (id: string) => run(async () => {
    await api.deleteSubject(id);
    setSubjects(await api.getSubjects());
    setSessions(await api.getSessions());
  });
  const generate = () => run(async () => {
    if (subjects.length === 0) throw new Error("Add at least one subject first.");
    const plan = await api.generatePlan(subjects, Math.round(hours * 60));
    setSessions(plan.sessions); setMissing(plan.missing); setTab("plan");
  });
  const complete = (id: string, mins: number, conf: number) => run(async () => {
    setSessions(await api.completeSession(id, mins, conf));
  });

  // numbers for the stat row and the plan tab
  const allTopics = subjects.flatMap((s) => s.units.flatMap((u) => u.topics));
  const totalMin = allTopics.reduce((a, t) => a + t.estimatedMinutes, 0);
  const done = sessions.filter((s) => s.status === "COMPLETED").length;
  const today = api.toDateStr(new Date());
  const todays = sessions.filter((s) => s.date === today);
  const byDate = sessions.reduce<Record<string, Session[]>>((acc, s) => { (acc[s.date] ??= []).push(s); return acc; }, {});
  const plannedTotal = sessions.reduce((a, s) => a + s.minutes, 0);
  const plannedBySubject = (id: string) => sessions.filter((s) => s.subjectId === id).reduce((a, s) => a + s.minutes, 0);
  const hrs = (m: number) => Math.round((m / 60) * 10) / 10 + " h";

  return (
    <>
      

      <main className="container-fluid p-4">
        {/* stat row */}
        <div className="row g-3 mb-4">
          {[["Subjects", subjects.length], ["Topics", allTopics.length], ["Total study time", hrs(totalMin)], ["Sessions done", done + " / " + sessions.length]].map(([label, val]) => (
            <div className="col-6 col-lg-3" key={label as string}>
              <div className="panel p-3"><div className="text-secondary small">{label}</div><div className="fs-4 fw-semibold">{val}</div></div>
            </div>
          ))}
        </div>


        <div className="row g-4">
          {/* LEFT: where you give input */}
          <div className="col-lg-4">
            <div className="panel p-3 mb-3">
              <h2 className="h6">Add a subject</h2>
              <label className="form-label small mb-1">Subject name</label>
              <input className="form-control mb-2" placeholder="e.g. Object Oriented Programming" value={name} onChange={(e) => setName(e.target.value)} />
              <label className="form-label small mb-1">Exam date</label>
              <input type="date" className="form-control mb-2" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
              <label className="form-label small mb-1">Syllabus (one topic per line, start a unit with "Unit")</label>
              <textarea className="form-control mb-2" rows={7} value={text} onChange={(e) => setText(e.target.value)} placeholder={SAMPLE} />
              <div className="d-flex gap-2">
                <button className="btn btn-dark" disabled={busy} onClick={add}>Add subject</button>
                <button className="btn btn-outline-dark" onClick={() => setText(SAMPLE)}>Use sample</button>
              </div>
            </div>
            {error && <div className="note">{error}</div>}
            <div className="panel p-3">
              <h2 className="h6">Make the plan</h2>
              <label className="form-label small mb-1">Total study hours per day (all subjects)</label>
              <input type="number" min={0.5} max={14} step={0.5} className="form-control mb-3" value={hours} onChange={(e) => setHours(Number(e.target.value))} />
              <button className="btn btn-dark w-100" disabled={busy} onClick={generate}>Generate study plan</button>
            </div>
          </div>

          {/* RIGHT: where results show up */}
          <div className="col-lg-8">
            <div className="panel p-3 result-area">
              <ul className="nav nav-tabs mb-3">
                {([["subjects", "Subjects"], ["plan", "Study plan"], ["today", "Today"]] as [Tab, string][]).map(([k, label]) => (
                  <li className="nav-item" key={k}><button className={"nav-link " + (tab === k ? "active" : "")} onClick={() => setTab(k)}>{label}</button></li>
                ))}
              </ul>

              {tab === "subjects" && (subjects.length === 0 ? <div className="empty">No subjects yet. Add your first subject on the left.</div> : subjects.map((s) => {
                const topics = s.units.flatMap((u) => u.topics);
                const left = daysUntil(s.examDate);
                return (
                  <div key={s.id} className="row-line py-3">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="fw-semibold">{s.name}</div>
                        <div className="small text-secondary">Exam {s.examDate} ({left} days left) · {topics.length} topics · {hrs(topics.reduce((a, t) => a + t.estimatedMinutes, 0))}</div>
                      </div>
                      <button className="btn btn-sm btn-outline-dark" disabled={busy} onClick={() => remove(s.id)}>Remove</button>
                    </div>
                    <details className="mt-2">
                      <summary>Show topics</summary>
                      {s.units.map((u) => (
                        <div key={u.id} className="mt-2">
                          <div className="small fw-semibold">{u.title}</div>
                          {u.topics.map((t) => (
                            <div key={t.id} className="d-flex justify-content-between small py-1">
                              <span>{t.title}</span>
                              <span className="text-secondary"><span className="tag tag-soft me-2">{t.difficulty.toLowerCase()}</span>{t.estimatedMinutes} min</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </details>
                  </div>
                );
              }))}

              {tab === "plan" && (sessions.length === 0 ? <div className="empty">Add your subjects, then click Generate study plan.</div> : (
                <>
                  <h3 className="h6">Time given to each subject</h3>
                  {subjects.map((s) => {
                    const m = plannedBySubject(s.id);
                    const pct = plannedTotal ? Math.round((m / plannedTotal) * 100) : 0;
                    return (
                      <div key={s.id} className="mb-2">
                        <div className="d-flex justify-content-between small"><span>{s.name}</span><span>{hrs(m)} ({pct}%)</span></div>
                        <div className="bar"><span style={{ width: pct + "%" }} /></div>
                      </div>
                    );
                  })}
                  {Object.entries(missing).map(([id, mins]) => (
                    <div key={id} className="note mt-3">
                      Overload: {mins} minutes of {subjects.find((s) => s.id === id)?.name ?? "a subject"} do not fit before its exam. Increase daily hours or move the exam date.
                    </div>
                  ))}
                  <h3 className="h6 mt-4">Day by day</h3>
                  {Object.entries(byDate).map(([date, list]) => (
                    <div key={date} className="mb-3">
                      <div className="small fw-semibold mb-1">{new Date(date + "T00:00:00").toDateString()}</div>
                      {list.map((s) => (
                        <div key={s.id} className="d-flex justify-content-between small py-1">
                          <span><span className="tag me-2">{s.subjectName}</span>{s.topicTitle}</span>
                          <span className="text-secondary">{s.minutes} min{s.status === "COMPLETED" ? " (done)" : ""}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </>
              ))}

              {tab === "today" && (todays.length === 0 ? <div className="empty">No sessions scheduled for today.</div> : todays.map((s) => (
                <TodayRow key={s.id} s={s} onDone={complete} />
              )))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

// one row in the "Today" tab: ask actual minutes + confidence, then mark complete
function TodayRow({ s, onDone }: { s: Session; onDone: (id: string, mins: number, conf: number) => void }) {
  const [mins, setMins] = useState(s.minutes);
  const [conf, setConf] = useState(3);
  const finished = s.status === "COMPLETED";
  return (
    <div className="row-line d-flex align-items-center gap-2 py-2">
      <span className="flex-grow-1"><span className="tag me-2">{s.subjectName}</span>{s.topicTitle} <span className="text-secondary small">({s.minutes} min planned)</span></span>
      {finished ? <span className="tag">Completed</span> : (
        <>
          <input type="number" className="form-control form-control-sm" style={{ width: 70 }} value={mins} onChange={(e) => setMins(Number(e.target.value))} title="Actual minutes" />
          <select className="form-select form-select-sm" style={{ width: 130 }} value={conf} onChange={(e) => setConf(Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>Confidence {n}</option>)}
          </select>
          <button className="btn btn-sm btn-dark" onClick={() => onDone(s.id, mins, conf)}>Mark complete</button>
        </>
      )}
    </div>
  );
}