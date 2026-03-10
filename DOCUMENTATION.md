# Advanced Todo App — Documentation

## Tech Stack

- **Next.js 16** (App Router) — Full-stack framework
- **TypeScript** — Type safety across the entire project
- **Tailwind CSS** + **shadcn/ui** — Styling & UI components
- **Neon PostgreSQL** + **Prisma** — Database & ORM (cloud-hosted)
- **NextAuth.js v5** — Authentication (credentials-based)
- **Cloudinary** — File storage (images, PDFs, documents)
- **bcryptjs** — Password hashing
- **Zod** — Request validation
- **Ollama Cloud API** — AI features (cloud-based, API key required)
- **@dnd-kit/core + @dnd-kit/sortable** — Drag & drop
- **Sonner** — Toast notifications
- **next-themes** — Dark / Light mode
- **Lucide React** — Icons
- **Docker** — Containerization

---

## Features

### Auth
- Register / Login / Logout
- Credentials-based authentication (email + password)
- Protected routes — must be logged in to access todos
- Each user sees only their own todos
- Passwords hashed with bcrypt

### Core
- Create, Edit, Delete todos (with title, description, category, priority, due date)
- Status tracking — Pending / In Progress / Completed
- Categories — Work, Personal, Health, Shopping, Education, Finance, Travel, Other
- Priority levels — High (red), Medium (yellow), Low (green)
- Sub-tasks inside each todo
- Search by title/description + Filter by category, priority, status
- Drag & drop reordering
- Dark / Light mode toggle
- Progress bar showing completion percentage

### AI-Powered (Ollama Cloud)
- **Auto Description** — Type a title → click "Generate" → AI writes the description
- **Auto Category** — AI detects and assigns the best category
- **Auto Priority** — AI analyzes urgency and sets High/Medium/Low
- **Smart Suggestions** — AI suggests sub-tasks based on the title

### File Upload (Cloudinary)
- Attach files (PNG, JPG, PDF, DOC, TXT) to any task — max 5MB per file
- Files stored on **Cloudinary** (cloud storage, not local filesystem)
- Image thumbnail preview (always visible on card), file icons for documents
- Upload multiple files per task, delete individually
- PDF/document downloads via secure proxy route (`/api/download`) using Cloudinary `private_download_url`
- Instant UI updates — files show immediately after upload (no refresh needed)
- Secure file type + file size validation on both client and server

### Extra Features
- **Toast Notifications** — Success/error messages using Sonner
- **Keyboard Shortcuts** — `N` to create new task, `Ctrl+K` for search
- **Undo Delete** — 5 second "Undo" toast before permanent deletion
- **Export Data** — Export all todos as CSV or JSON
- **Responsive Design** — Works on desktop, tablet, and mobile
- **Loading States** — Skeleton/spinner shown during AI calls and data fetching
- **Centralized Error Handling** — Consistent error responses, no stack traces leaked in production

---

## Architecture

```
Browser (Next.js Frontend + Tailwind + shadcn/ui)
    ↓
Middleware (Auth check)
    ↓
Next.js API Routes (Zod validation + Centralized error handling)
    ↓
┌────────────────┬──────────────┬─────────────┐
│ Prisma         │ Ollama Cloud │ Cloudinary  │
│ (Neon Postgres)│ (AI API)     │ (Files)     │
└────────────────┴──────────────┴─────────────┘
```

**Flow:** User action → Middleware (auth) → API Route (validate + error handling) → Database/AI/Cloudinary → Response → UI update

### File Upload/Download Flow

```
Upload:  Client → FormData → /api/upload → Cloudinary (resource_type: "auto") → Prisma record → Client
Download: Client → /api/download?url=&name= → private_download_url() → Fetch from Cloudinary → Proxy to Client
```

### File State Management

```
useTodos (single source of truth)
  ├── updateTodoFiles(todoId, files)  → instant local state update
  └── silentRefetch()                 → background server sync (no spinner)

TodoList → SortableTodoItem → TodoItem → FileUpload/FilePreview
  onFilesChange → updateTodoFiles (optimistic)
  onFilesUploaded → silentRefetch (server sync)
```

---

## Database Schema (Prisma + Neon PostgreSQL)

- **User** — id, name, email, password, createdAt, updatedAt
- **Todo** — id, title, description, category, priority, status, dueDate, order, userId (linked to User), createdAt, updatedAt
- **SubTask** — id, title, completed, todoId (linked to Todo)
- **File** — id, fileName, filePath, fileType, fileSize, publicId (Cloudinary), todoId (linked to Todo)
- Relationships: User → many Todos → many SubTasks + Files
- Cascade delete: deleting a todo removes its sub-tasks and files automatically

---

## API Routes

### Auth
- `POST /api/auth/register` — Register new user `{ name, email, password }`
- `POST /api/auth/[...nextauth]` — Login, logout, session (handled by NextAuth)

### Todos
- `GET /api/todos` — Fetch all (supports ?search, ?category, ?priority, ?status)
- `POST /api/todos` — Create new todo `{ title, description, category, priority, dueDate }`
- `PUT /api/todos/[id]` — Update a todo
- `DELETE /api/todos/[id]` — Delete a todo
- `PATCH /api/todos/[id]` — Update order or status

### Sub-tasks
- `GET /api/todos/[id]/subtasks` — Get sub-tasks of a todo
- `POST /api/todos/[id]/subtasks` — Add sub-task `{ title }`
- `PUT /api/subtasks/[id]` — Update sub-task `{ title, completed }`
- `DELETE /api/subtasks/[id]` — Delete sub-task

### AI
- `POST /api/ai/generate` — Generate description `{ title }` → `{ description }`
- `POST /api/ai/categorize` — Auto categorize `{ title }` → `{ category }`
- `POST /api/ai/prioritize` — Auto priority `{ title }` → `{ priority }`
- `POST /api/ai/suggest` — Suggest sub-tasks `{ title }` → `{ suggestions[] }`

### Files
- `POST /api/upload` — Upload file to Cloudinary (FormData: file + todoId)
- `GET /api/download?url=&name=` — Proxy download (generates Cloudinary private URL, fetches & streams to client)
- `DELETE /api/files/[id]` — Delete file from Cloudinary + database

### Export
- `GET /api/export?format=csv` — Export todos as CSV
- `GET /api/export?format=json` — Export todos as JSON

---

## Ollama Cloud API

- **Base URL:** `https://api.ollama.com/v1/chat/completions`
- **Auth:** `Authorization: Bearer <API_KEY>` header in every request
- **Model:** llama3 (configurable via env variable)
- Prompts are sent from Next.js API routes (server-side) to avoid CORS issues
- If AI is unavailable → graceful fallback, user fills fields manually

---

## Keyboard Shortcuts

- `N` — Open "Add New Task" dialog
- `Ctrl + K` — Focus search bar
- `Escape` — Close any open dialog

---

## Environment Variables (`.env.local`)

```env
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
NEXTAUTH_SECRET="your-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"
OLLAMA_API_KEY="your-api-key-here"
OLLAMA_API_URL="https://api.ollama.com/v1"
OLLAMA_MODEL="llama3"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

---

## Setup

### Local Development

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir
npm install prisma @prisma/client lucide-react @dnd-kit/core @dnd-kit/sortable sonner next-themes
npm install next-auth@beta bcryptjs zod cloudinary
npm install -D @types/bcryptjs
npx prisma init --datasource-provider postgresql
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input textarea dialog select badge calendar dropdown-menu card label
# Create .env.local with your variables
npx prisma migrate dev --name init
npm run dev
```

App runs at `http://localhost:3000`

### Docker

```bash
docker-compose up --build
```

App runs at `http://localhost:3000`

---

## Folder Structure

```
├── prisma/
│   └── schema.prisma
│
├── public/
│
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   │
│   │   ├── (auth)/                      # Auth pages (no layout nesting)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (dashboard)/                 # Protected pages
│   │   │   ├── layout.tsx               # Dashboard layout with Header
│   │   │   └── page.tsx                 # Todo list (main page)
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── register/route.ts
│   │       │   └── [...nextauth]/route.ts
│   │       ├── todos/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       └── subtasks/
│   │       │           └── route.ts
│   │       ├── subtasks/
│   │       │   └── [id]/
│   │       │       └── route.ts
│   │       ├── ai/
│   │       │   ├── generate/route.ts
│   │       │   ├── categorize/route.ts
│   │       │   ├── prioritize/route.ts
│   │       │   └── suggest/route.ts
│   │       ├── upload/
│   │       │   └── route.ts              # Cloudinary upload
│   │       ├── download/
│   │       │   └── route.ts              # Cloudinary proxy download
│   │       ├── files/
│   │       │   └── [id]/
│   │       │       └── route.ts
│   │       └── export/
│   │           └── route.ts
│   │
│   ├── components/
│   │   ├── ui/                          # shadcn/ui primitives
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── select.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── card.tsx
│   │   │   ├── label.tsx
│   │   │   └── dropdown-menu.tsx
│   │   │
│   │   ├── layout/                      # App shell & layout
│   │   │   ├── Header.tsx
│   │   │   ├── ThemeToggle.tsx
│   │   │   └── KeyboardShortcuts.tsx
│   │   │
│   │   ├── auth/                        # Auth components
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   │
│   │   ├── todos/                       # Todo feature
│   │   │   ├── TodoList.tsx
│   │   │   ├── TodoItem.tsx
│   │   │   ├── TodoForm.tsx
│   │   │   ├── SubTaskList.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── FilterBar.tsx
│   │   │   └── ProgressBar.tsx
│   │   │
│   │   ├── ai/                          # AI-related components
│   │   │   └── GenerateButton.tsx
│   │   │
│   │   ├── files/                       # File upload components
│   │   │   ├── FileUpload.tsx
│   │   │   └── FilePreview.tsx
│   │   │
│   │   └── shared/                      # Reusable across features
│   │       ├── ExportButton.tsx
│   │       └── ConfirmDialog.tsx
│   │
│   ├── hooks/                           # Custom React hooks
│   │   ├── useTodos.ts
│   │   ├── useKeyboardShortcuts.ts
│   │   └── useDebounce.ts
│   │
│   ├── services/                        # API call functions (frontend → backend)
│   │   ├── authService.ts
│   │   ├── todoService.ts
│   │   ├── aiService.ts
│   │   ├── fileService.ts
│   │   └── exportService.ts
│   │
│   ├── lib/                             # Core utilities (server-side)
│   │   ├── prisma.ts
│   │   ├── auth.ts                      # NextAuth config
│   │   ├── api-handler.ts              # Wrapper for API routes (auth + validation + error handling)
│   │   ├── ollama.ts
│   │   └── utils.ts
│   │
│   ├── validators/                      # Zod schemas for request validation
│   │   ├── auth.ts
│   │   ├── todo.ts
│   │   └── file.ts
│   │
│   ├── errors/                          # Centralized error handling
│   │   └── index.ts                     # AppError class + global handler
│   │
│   ├── config/                          # Centralized app config
│   │   └── index.ts                     # All env vars read from one place
│   │
│   ├── providers/                       # React context providers
│   │   └── index.tsx                    # ThemeProvider + SessionProvider + Toaster
│   │
│   ├── middleware.ts                    # NextAuth middleware (route protection)
│   │
│   ├── types/                           # TypeScript types
│   │   └── index.ts
│   │
│   └── constants/                       # App-wide constants
│       └── index.ts
│
├── Dockerfile                           # Multi-stage build
├── docker-compose.yml                   # App container
├── .dockerignore
├── .env.local
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```
