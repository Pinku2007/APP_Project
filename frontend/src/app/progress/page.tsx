"use client";
import { useEffect, useState } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import * as api from "@/lib/api";
import type { Session, Subject } from "@/lib/api";
import { getRevisions } from "@/lib/revision";
import type { Revision } from "@/lib/revision";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export default function ProgressPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [revs, setRevs] = useState<Revision[]>([]);

  useEffect(() => {
    api.getSessions().then(setSessions).catch(() => {});
    api.getSubjects().then(setSubjects).catch(() => {});
    getRevisions().then(setRevs).catch(() => {});
  }, []);

  const today = api.toDateStr(new Date());
  const doneOn = (s: Session) => s.completedOn ?? s.date;
  const sum = (list: Session[], f: (s: Session) => number) => list.reduce((a, s) => a + f(s), 0);

  // indicators (each one is explained on screen, no single "readiness score")
  const totalMin = sum(sessions, (s) => s.minutes);
  const doneMin = sum(sessions.filter((s) => s.status === "COMPLETED"), (s) => s.minutes);
  const coverage = totalMin ? Math.round((doneMin / totalMin) * 100) : 0;
  const overdue = sessions.filter((s) => s.status === "PLANNED" && s.date < today).length;
  const dueRevs = revs.filter((r) => r.status === "DUE" && r.dueDate <= today).length;

  const doneDays = new Set(sessions.filter((s) => s.status === "COMPLETED").map(doneOn));
  let streak = 0;
  const cursor = new Date();
  if (!doneDays.has(api.toDateStr(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (doneDays.has(api.toDateStr(cursor))) { streak++; cursor.setDate(cursor.getDate() - 1); }

  // last 7 days: planned vs actual minutes
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return api.toDateStr(d); });
  const planned = days.map((d) => sum(sessions.filter((s) => s.date === d), (s) => s.minutes));
  const actual = days.map((d) => sum(sessions.filter((s) => s.status === "COMPLETED" && doneOn(s) === d), (s) => s.actualMinutes ?? s.minutes));

  // topics finished vs pending
  const byTopic: Record<string, Session[]> = {};
  sessions.forEach((s) => { (byTopic[s.topicId] ??= []).push(s); });
  const topicLists = Object.values(byTopic);
  const topicsDone = topicLists.filter((l) => l.every((s) => s.status === "COMPLETED")).length;

  // low-confidence topics (confidence 1 or 2 on a completed session)
  const weak = Array.from(new Map(sessions.filter((s) => s.status === "COMPLETED" && (s.confidence ?? 5) <= 2).map((s) => [s.topicId, s])).values());

  const cards: [string, string | number, string][] = [
    ["Syllabus coverage", coverage + "%", "Completed study minutes divided by all planned minutes."],
    ["Current streak", streak + " days", "Days in a row with at least one completed session."],
    ["Overdue sessions", overdue, "Planned sessions whose date has passed."],
    ["Revisions due", dueRevs, "Reviews due today or earlier."],
  ];

  return (
    <main className="container-fluid p-4">
      <h1 className="h4 mb-3">Progress</h1>
      {sessions.length === 0 && <div className="note">No data yet. Generate a plan and complete a session to see your progress.</div>}

      <div className="row g-3 mb-4">
        {cards.map(([label, val, help]) => (
          <div className="col-6 col-lg-3" key={label}>
            <div className="panel p-3 h-100"><div className="text-secondary small">{label}</div><div className="fs-4 fw-semibold">{val}</div><div className="small text-secondary">{help}</div></div>
          </div>
        ))}
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="panel p-3">
            <h2 className="h6">Last 7 days: planned vs actual minutes</h2>
            <Bar
              data={{ labels: days.map((d) => d.slice(5)), datasets: [
                { label: "Planned", data: planned, backgroundColor: "#c4c4c4" },
                { label: "Actual", data: actual, backgroundColor: "#111" },
              ] }}
              options={{ responsive: true, scales: { y: { beginAtZero: true } }, plugins: { legend: { position: "bottom" } } }}
            />
          </div>
        </div>
        <div className="col-lg-4">
          <div className="panel p-3">
            <h2 className="h6">Topics finished</h2>
            <Doughnut
              data={{ labels: ["Finished", "Pending"], datasets: [{ data: [topicsDone, Math.max(topicLists.length - topicsDone, 0)], backgroundColor: ["#111", "#d9d9d9"], borderColor: "#fff" }] }}
              options={{ responsive: true, plugins: { legend: { position: "bottom" } } }}
            />
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="panel p-3">
            <h2 className="h6">Coverage by subject</h2>
            {subjects.length === 0 && <div className="small text-secondary">No subjects yet.</div>}
            {subjects.map((s) => {
              const mine = sessions.filter((x) => x.subjectId === s.id);
              const t = sum(mine, (x) => x.minutes);
              const d = sum(mine.filter((x) => x.status === "COMPLETED"), (x) => x.minutes);
              const pct = t ? Math.round((d / t) * 100) : 0;
              return (
                <div key={s.id} className="mb-2">
                  <div className="d-flex justify-content-between small"><span>{s.name}</span><span>{pct}%</span></div>
                  <div className="bar"><span style={{ width: pct + "%" }} /></div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="col-lg-6">
          <div className="panel p-3">
            <h2 className="h6">Low-confidence topics</h2>
            <div className="small text-secondary mb-2">Topics you rated 1 or 2 after studying.</div>
            {weak.length === 0 ? <div className="small text-secondary">None so far.</div> : weak.map((s) => (
              <div key={s.topicId} className="small py-1"><span className="tag me-2">{s.subjectName}</span>{s.topicTitle}</div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}