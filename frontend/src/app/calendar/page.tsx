"use client";
import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import type { EventInput, EventClickArg } from "@fullcalendar/core";
import * as api from "@/lib/api";
import { getRevisions, addDays } from "@/lib/revision";

type Info = { title: string; date: string; kind: string };

// download all events as an .ics file (opens in Google Calendar, Outlook, etc.)
function exportIcs(events: EventInput[]) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//StudyPilot//EN"];
  events.forEach((e, i) => {
    const start = String(e.start);
    lines.push("BEGIN:VEVENT", "UID:studypilot-" + i + "@local", "DTSTAMP:20260101T000000Z",
      "DTSTART;VALUE=DATE:" + start.replace(/-/g, ""), "DTEND;VALUE=DATE:" + addDays(start, 1).replace(/-/g, ""),
      "SUMMARY:" + String(e.title).replace(/[,;]/g, " "), "END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url; a.download = "studypilot.ics"; a.click();
  URL.revokeObjectURL(url);
}

export default function CalendarPage() {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [info, setInfo] = useState<Info | null>(null);

  useEffect(() => {
    (async () => {
      const sessions = await api.getSessions().catch(() => []);
      const revs = await getRevisions().catch(() => []);
      const ev: EventInput[] = [
        // study sessions: black = planned, grey = completed
        ...sessions.map((s) => ({
          id: s.id, start: s.date, allDay: true,
          title: s.subjectName + ": " + s.topicTitle + " (" + s.minutes + "m)",
          backgroundColor: s.status === "COMPLETED" ? "#9a9a9a" : "#111",
          borderColor: s.status === "COMPLETED" ? "#9a9a9a" : "#111",
          extendedProps: { kind: s.status === "COMPLETED" ? "Study session (done)" : "Study session" },
        })),
        // revisions: white with black border
        ...revs.filter((r) => r.status === "DUE").map((r) => ({
          id: r.id, start: r.dueDate, allDay: true, title: "Revise: " + r.topicTitle,
          backgroundColor: "#fff", borderColor: "#111", textColor: "#111",
          extendedProps: { kind: "Revision" },
        })),
      ];
      setEvents(ev);
    })();
  }, []);

  function onClick(arg: EventClickArg) {
    setInfo({ title: arg.event.title, date: arg.event.startStr, kind: String(arg.event.extendedProps.kind) });
  }

  return (
    <main className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h4 mb-0">Calendar</h1>
          <div className="small text-secondary">Black = planned session, grey = done, outlined = revision</div>
        </div>
        <button className="btn btn-dark" disabled={events.length === 0} onClick={() => exportIcs(events)}>Export .ics</button>
      </div>
      {info && <div className="note"><strong>{info.kind}</strong> on {info.date}<br />{info.title}</div>}
      <div className="panel p-3">
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,dayGridWeek" }}
          events={events}
          eventClick={onClick}
          height="auto"
        />
      </div>
    </main>
  );
}