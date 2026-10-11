"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as api from "@/lib/api";
import type { Subject, Session, Resource } from "@/lib/api";

type Tab = "subjects" | "plan" | "today";

const SAMPLE =
  "Unit 1: Classes and Objects\nIntroduction to OOP\nConstructors\nStatic members\nUnit 2: Inheritance\nTypes of inheritance\nMethod overriding";

// days from today until a date (YYYY-MM-DD)
function daysUntil(date: string) {
  return Math.ceil((new Date(date + "T00:00:00").getTime() - Date.now()) / 86400000);
}

export default function Workspace() {
  const router = useRouter();
  // "add subject" form
  const [name, setName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [text, setText] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  // plan setting (study hours per day)
  const [hours, setHours] = useState(3);
  // results
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tab, setTab] = useState<Tab>("subjects");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // learning content & resources state
  const [selectedTopic, setSelectedTopic] = useState("");
  const [resources, setResources] = useState<Resource[]>([]);
  const [loadingRes, setLoadingRes] = useState(false);

  // on first load: check login, then load saved subjects and sessions
  useEffect(() => {
    const u = api.getUser();
    if (!u) { router.replace("/login"); return; }
    api.getSubjects().then(setSubjects).catch(() => {});
    api.getSessions().then(setSessions).catch(() => {});
  }, [router]);

  async function run<T>(fn: () => Promise<T>) {
    setBusy(true); setError("");
    try { return await fn(); }
    catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); }
    finally { setBusy(false); }
  }

  const add = () => run(async () => {
    if (!name.trim()) throw new Error("Enter a subject name.");
    if (!examDate) throw new Error("Pick the exam date for this subject.");
    if (pdfFile) {
      await api.addSubjectPdf(name.trim(), examDate, pdfFile);
    } else {
      if (!text.trim()) throw new Error("Paste syllabus text or select a PDF file.");
      await api.addSubject(name.trim(), examDate, text);
    }
    setSubjects(await api.getSubjects());
    setName(""); setExamDate(""); setText(""); setPdfFile(null); setTab("subjects");
  });

  const remove = (id: string) => run(async () => {
    await api.deleteSubject(id);
    setSubjects(await api.getSubjects());
    setSessions(await api.getSessions());
  });

  const generate = () => run(async () => {
    if (subjects.length === 0) throw new Error("Add at least one subject first.");
    const list = await api.generatePlan(Math.round(hours * 60));
    setSessions(list);
    setTab("plan");
  });

  const complete = (id: string) => run(async () => {
    setSessions(await api.completeSession(id));
  });

  const loadResources = async (topicTitle: string, subjectName: string) => {
    setSelectedTopic(topicTitle);
    setLoadingRes(true);
    try {
      const data = await api.getResources(topicTitle, subjectName);
      setResources(data);
    } catch {
      setResources([]);
    } finally {
      setLoadingRes(false);
    }
  };

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
        {/* LEFT: input & resources */}
        <div className="col-lg-4">
          <div className="panel p-3 mb-3">
            <h2 className="h6">Add a subject</h2>
            <label className="form-label small mb-1">Subject name</label>
            <input className="form-control mb-2" placeholder="e.g. Object Oriented Programming" value={name} onChange={(e) => setName(e.target.value)} />

            <label className="form-label small mb-1">Exam date</label>
            <input type="date" className="form-control mb-2" value={examDate} onChange={(e) => setExamDate(e.target.value)} />

            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label small mb-0">Upload Syllabus PDF (optional)</label>
              <a href="http://localhost:8080/api/syllabi/sample-pdf" className="small">Sample PDF</a>
            </div>
            <input
              type="file"
              accept=".pdf"
              className="form-control form-control-sm mb-2"
              onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
            />
            {pdfFile && (
              <div className="small text-secondary mb-2">
                Selected: <strong>{pdfFile.name}</strong>{" "}
                <button type="button" className="btn btn-link btn-sm p-0 ms-1" onClick={() => setPdfFile(null)}>Clear</button>
              </div>
            )}

            <label className="form-label small mb-1">Or paste syllabus text</label>
            <textarea
              className="form-control mb-2"
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={SAMPLE}
              disabled={!!pdfFile}
            />
            <div className="d-flex gap-2">
              <button className="btn btn-dark" disabled={busy} onClick={add}>Add subject</button>
              <button className="btn btn-outline-dark" onClick={() => { setPdfFile(null); setText(SAMPLE); }}>Use sample</button>
            </div>
          </div>

          {error && <div className="note mb-3">{error}</div>}

          <div className="panel p-3 mb-3">
            <h2 className="h6">Make the plan</h2>
            <label className="form-label small mb-1">Total study hours per day</label>
            <input type="number" min={0.5} max={14} step={0.5} className="form-control mb-3" value={hours} onChange={(e) => setHours(Number(e.target.value))} />
            <button className="btn btn-dark w-100" disabled={busy} onClick={generate}>Generate study plan</button>
          </div>

          {/* STUDY CONTENT & RESOURCES PANEL */}
          {selectedTopic && (
            <div className="panel p-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h2 className="h6 mb-0">Study Resources &amp; Videos</h2>
                <button className="btn btn-sm btn-outline-dark py-0 px-2" onClick={() => setSelectedTopic("")}>Close</button>
              </div>
              <div className="small text-secondary mb-2">Topic: <strong>{selectedTopic}</strong></div>
              {loadingRes ? (
                <div className="small text-secondary">Finding best lectures...</div>
              ) : (
                resources.map((r, i) => (
                  <div key={i} className="row-line py-2 small">
                    <div className="fw-semibold">{r.title}</div>
                    <div className="d-flex justify-content-between align-items-center mt-1">
                      <span className="text-secondary">{r.channel} · {r.duration} · <span className="tag tag-soft">Score {r.score}%</span></span>
                      <a href={r.url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-dark py-0 px-2">Open</a>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* RIGHT: results */}
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
                  <details className="mt-2" open>
                    <summary className="small text-secondary">Show units &amp; topics</summary>
                    {s.units.map((u) => (
                      <div key={u.id} className="mt-2">
                        <div className="small fw-semibold">{u.title}</div>
                        {u.topics.map((t) => (
                          <div key={t.id} className="d-flex justify-content-between align-items-center small py-1">
                            <span>{t.title}</span>
                            <span className="d-flex align-items-center gap-2">
                              <span className="tag tag-soft">{t.difficulty.toLowerCase()}</span>
                              <span className="text-secondary">{t.estimatedMinutes} min</span>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-dark py-0 px-2"
                                onClick={() => loadResources(t.title, s.name)}
                              >
                                Resources
                              </button>
                            </span>
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
                <h3 className="h6 mt-4">Day by day</h3>
                {Object.entries(byDate).map(([date, list]) => (
                  <div key={date} className="mb-3">
                    <div className="small fw-semibold mb-1">{new Date(date + "T00:00:00").toDateString()}</div>
                    {list.map((s) => (
                      <div key={s.id} className="d-flex justify-content-between align-items-center small py-1">
                        <span><span className="tag me-2">{s.subjectName}</span>{s.topicTitle}</span>
                        <span className="d-flex align-items-center gap-2 text-secondary">
                          <span>{s.minutes} min{s.status === "COMPLETED" ? " (done)" : ""}</span>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-dark py-0 px-2"
                            onClick={() => loadResources(s.topicTitle, s.subjectName)}
                          >
                            Resources
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </>
            ))}

            {tab === "today" && (todays.length === 0 ? <div className="empty">No sessions scheduled for today.</div> : todays.map((s) => (
              <div key={s.id} className="row-line d-flex align-items-center justify-content-between gap-2 py-2">
                <span>
                  <span className="tag me-2">{s.subjectName}</span>
                  {s.topicTitle} <span className="text-secondary small">({s.minutes} min)</span>
                </span>
                <span className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-dark"
                    onClick={() => loadResources(s.topicTitle, s.subjectName)}
                  >
                    Resources
                  </button>
                  {s.status === "COMPLETED" ? (
                    <span className="tag">Completed</span>
                  ) : (
                    <button className="btn btn-sm btn-dark" onClick={() => complete(s.id)}>Mark complete</button>
                  )}
                </span>
              </div>
            )))}
          </div>
        </div>
      </div>
    </main>
  );
}