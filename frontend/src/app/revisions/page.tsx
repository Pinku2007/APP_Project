"use client";
import { useEffect, useState } from "react";
import * as api from "@/lib/api";
import { getRevisions, reviewRevision, INTERVALS } from "@/lib/revision";
import type { Revision, Result } from "@/lib/revision";

const BUTTONS: [Result, string][] = [["FORGOT", "Forgot"], ["PARTIAL", "Partial"], ["GOOD", "Good"], ["STRONG", "Strong"]];

export default function RevisionsPage() {
  const [revs, setRevs] = useState<Revision[]>([]);
  const [error, setError] = useState("");
  const today = api.toDateStr(new Date());

  useEffect(() => { getRevisions().then(setRevs).catch((e) => setError(String(e.message ?? e))); }, []);

  async function review(id: string, result: Result) {
    setError("");
    try { setRevs(await reviewRevision(id, result)); }
    catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); }
  }

  const open = revs.filter((r) => r.status === "DUE");
  const groups: [string, Revision[], boolean][] = [
    ["Overdue", open.filter((r) => r.dueDate < today), true],
    ["Due today", open.filter((r) => r.dueDate === today), true],
    ["Upcoming", open.filter((r) => r.dueDate > today).sort((a, b) => a.dueDate.localeCompare(b.dueDate)), false],
  ];
  const mastered = revs.filter((r) => r.status === "DONE");

  return (
    <main className="container p-4" style={{ maxWidth: 860 }}>
      <h1 className="h4">Revisions</h1>
      <p className="small text-secondary">
        A topic enters this queue after you complete all its sessions. Reviews repeat after {INTERVALS.join(", ")} days.
        Forgot = repeat tomorrow, Partial = try again in 2 days, Good = next interval, Strong = skip one interval.
      </p>
      {error && <div className="note">{error}</div>}

      {open.length === 0 && <div className="panel empty">No revisions yet. Complete all sessions of a topic on the Planner page and it will appear here.</div>}

      {groups.map(([title, list, actionable]) => list.length > 0 && (
        <div key={title} className="panel p-3 mb-3">
          <h2 className="h6">{title} ({list.length})</h2>
          {list.map((r) => (
            <div key={r.id} className="row-line d-flex align-items-center gap-2 py-2 flex-wrap">
              <span className="flex-grow-1"><span className="tag me-2">{r.subjectName}</span>{r.topicTitle}
                <span className="text-secondary small"> · due {r.dueDate} · review {r.step + 1} of {INTERVALS.length}</span></span>
              {actionable && BUTTONS.map(([res, label]) => (
                <button key={res} className="btn btn-sm btn-outline-dark" onClick={() => review(r.id, res)}>{label}</button>
              ))}
            </div>
          ))}
        </div>
      ))}

      {mastered.length > 0 && (
        <div className="panel p-3">
          <h2 className="h6">Finished all reviews ({mastered.length})</h2>
          {mastered.map((r) => <div key={r.id} className="small py-1"><span className="tag tag-soft me-2">{r.subjectName}</span>{r.topicTitle}</div>)}
        </div>
      )}
    </main>
  );
}