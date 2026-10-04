# StudyPilot: AI Study Planner

A web application that turns a student's syllabus into a structured study roadmap, builds a timetable that shares daily study time across subjects, tracks progress, and schedules spaced revision.

The frontend currently runs on **mock data** so it can be demoed without a backend. The Spring Boot + MySQL backend is being built separately.

## Features

**Available now (frontend)**
- Register and log in
- Add multiple subjects, each with a name, exam date and syllabus text
- Syllabus parsing into Unit and Topic, with a difficulty and time estimate per topic
- Study plan generator that splits daily hours across subjects
- Overload warning when a subject cannot fit before its exam
- Today's sessions with actual minutes and a confidence rating
- Calendar view with `.ics` export
- Progress dashboard: coverage, streak, overdue sessions, planned vs actual chart, topics finished
- Spaced revision queue (1, 3, 7, 14 and 30 day intervals)

**Planned**
- Topic detail page with explanation and prerequisites
- Ranked YouTube learning resources
- Auto-reschedule after missed sessions
- PDF syllabus upload
- Settings page and email reminders

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Bootstrap 5 |
| Charts and calendar | Chart.js (react-chartjs-2), FullCalendar |
| Backend (in progress) | Java 17, Spring Boot, MySQL |

## Getting started

Requires Node.js 18.18 or newer.

```bash
git clone https://github.com/Pinku2007/APP_Project.git
cd APP_Project/frontend
npm install
npm run dev
```

Open http://localhost:3000. Create an account, add a subject (use the "Use sample" button for a quick test), set the daily hours and click **Generate study plan**.

## Project structure

```
frontend/src/
  app/
    page.tsx          Planner: add subjects, generate plan, today's sessions
    login/            Login and register
    calendar/         Calendar and .ics export
    progress/         Progress charts and indicators
    revisions/        Spaced revision queue
  components/Nav.tsx  Top navigation and login guard
  lib/
    api.ts            All backend calls, plus the mock implementation
    revision.ts       Revision calls and spaced repetition logic
```

## How the planner works

1. Each day, 85% of the daily study time is used. The other 15% stays free as a buffer for missed sessions.
2. That time is shared between subjects by required daily pace: the minutes still left in a subject divided by the days left until its exam. A subject with a near exam or a large syllabus gets more time automatically.
3. Topics are scheduled in order. If minutes do not fit before an exam, an overload warning is shown instead of hiding the problem.

## Spaced revision

A topic enters the revision queue after all of its sessions are completed. Each review result moves it along the intervals 1, 3, 7, 14 and 30 days:

| Result | Next review |
|---|---|
| Forgot | Tomorrow, restart from the first interval |
| Partial | In 2 days, same interval |
| Good | Next interval |
| Strong | Skip one interval |

## Connecting the backend

All network calls are in `frontend/src/lib/api.ts` and `frontend/src/lib/revision.ts`. Set `USE_MOCK = false` in `api.ts` to call the real endpoints. Set `NEXT_PUBLIC_API_URL` if the backend runs on a different host or port.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Log in |
| POST | `/api/syllabi/text` | Add a subject from pasted syllabus text (`name`, `examDate`, `text`) |
| GET | `/api/syllabi` | List subjects |
| DELETE | `/api/syllabi/{id}` | Remove a subject |
| POST | `/api/plans/generate` | Generate the plan (`syllabusIds`, `dailyMinutes`) |
| GET | `/api/calendar/events` | Study sessions |
| POST | `/api/sessions/{id}/complete` | Complete a session (`actualMinutes`, `confidence`) |
| GET | `/api/revisions` | Revision queue |
| POST | `/api/revisions/{id}/review` | Record a review (`result`: FORGOT, PARTIAL, GOOD or STRONG) |

The exact JSON shapes are the TypeScript types at the top of `api.ts` and `revision.ts`. The mock planner in `generatePlan` is the reference for the planning algorithm.

## Notes

- With mock mode on, each user's data lives in their own browser (localStorage), so it is not shared between machines.
- AI features (topic explanations, syllabus parsing with an LLM) are meant to assist, not replace, the deterministic planner.