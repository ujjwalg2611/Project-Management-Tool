# ProjectFlow — Collaborative Project Management App

A Trello/Asana/Linear-style project management tool: Kanban boards, list view,
task detail drawer, comments with @mentions, real-time sync via Socket.io,
workspace/RBAC, and email invites.

## Stack
- **Backend**: Node.js, Express, MongoDB + Mongoose, JWT auth, Socket.io, Nodemailer
- **Frontend**: React 18 + Vite, React Router, @hello-pangea/dnd (drag-and-drop), Axios, Socket.io-client

## Prerequisites
- Node.js 18+
- A MongoDB instance — either:
  - Local: `mongod` running on `localhost:27017`, or
  - Free hosted: [MongoDB Atlas](https://www.mongodb.com/atlas) connection string

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set MONGO_URI, JWT_SECRET, and (optionally) SMTP_* for real invite emails
npm run seed     # creates a demo user + workspace + project so you have data to look at
npm run dev      # starts on http://localhost:5000
```

Demo login after seeding: **demo@example.com / password123**

If you don't configure SMTP, invite emails will fail silently (logged as a
warning) but the invite link/token is still created and usable — you can grab
the token straight from the database or the API response during development.

## 2. Frontend setup

In a second terminal:

```bash
cd frontend
npm install
npm run dev      # starts on http://localhost:5173, proxies /api to :5000
```

Open http://localhost:5173.

## What's fully implemented
- Landing page, register/login, invite-based registration
- Workspaces with roles (admin/member/viewer) enforced server-side
- Projects: create (with templates), star, archive, delete, tags, custom columns with WIP limits
- **Kanban board** with drag-and-drop (within and across columns), inline "+ Add task"
- **List view** with sorting-ready table and per-row detail
- Task detail modal: title/description editing, priority, due date, multi-assignee, tags,
  subtasks with progress, comments, activity log, watch/unwatch, duplicate, delete
- **Real-time sync** over Socket.io: task moves, updates, creates, deletes, new comments,
  and a live notification badge in the sidebar — open the app in two browser windows
  (or two users) to see it live
- My Tasks (grouped by due date), Team/Members management with invites (admin-only),
  Inbox/notifications
- Dark mode toggle, responsive card/board layout

## What's scaffolded but not built out (by design, to keep this shippable)
These are straightforward to add on top of the existing models/routes:
- **Timeline/Gantt view** — the `Task` model already has `startDate`, `dueDate`, and
  `dependencies`; you'd add a `TimelineView.jsx` that renders bars from this data.
- **Rich text editor** (Tiptap/Quill) for descriptions/comments — currently plain
  textareas; the `Task.description` field is typed as mixed JSON specifically so you
  can drop in Tiptap's JSON output without a schema change.
- **File attachment uploads** — the `Attachment` sub-schema and `task.attachments` array
  exist; wire up `multer` (already a backend dependency) + an `/api/tasks/:id/attachments`
  route and an `<input type="file">` in the modal.
- **Google OAuth** — `User.googleId` field exists; add `passport-google-oauth20` to the
  backend and a button on the login page.
- **Command palette (⌘K), keyboard shortcuts** — pure frontend; a good next addition.
- **Time tracking, recurring tasks, task templates, CSV/PDF export, Zapier-style
  automations** — these are genuinely separate subsystems; happy to build any of them
  next if you tell me which matters most.

## Project structure
```
pm-app/
  backend/
    config/db.js           MongoDB connection
    middleware/             JWT auth + RBAC
    models/                 User, Workspace, Project, Task, Comment, Notification, Invite
    routes/                 auth, workspaces, projects, tasks, comments, notifications, users
    socket/index.js          Socket.io event handlers (presence, typing, live board sync)
    utils/email.js           Nodemailer invite/notification emails
    utils/seed.js            Demo data seeder
    server.js               Express + Socket.io entrypoint
  frontend/
    src/api/client.js       Axios instance with JWT interceptor
    src/context/            Auth + Socket React contexts
    src/components/         AppShell, BoardColumn, TaskCard, TaskModal, CreateProjectModal, Avatar
    src/pages/              Landing, Login, Register, Dashboard, ProjectsList, ProjectBoard, MyTasks, Team, Inbox
```

## Notes on running this in production
- Set a strong, random `JWT_SECRET`.
- Put the backend behind HTTPS and set proper CORS origins.
- Consider moving file/avatar uploads to S3 or similar rather than local disk.
- Add rate limiting (e.g. `express-rate-limit`) on `/api/auth/*`.
