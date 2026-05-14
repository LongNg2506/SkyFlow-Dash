# SkyFlow-Dash — Tài liệu dự án

> **Ngày tạo:** 2026-05-09
> **Người clone mới:** LongNg

---

## Mục lục

1. [Tổng quan Tech Stack](#1-tổng-quan-tech-stack)
2. [Cấu trúc thư mục](#2-cấu-trúc-thư-mục)
3. [Danh sách tất cả routes](#3-danh-sách-tất-cả-routes)
4. [Chi tiết từng trang](#4-chi-tiết-từng-trang)
5. [Kiến trúc dữ liệu](#5-kiến-trúc-dữ-liệu)
6. [Firebase Integration](#6-firebase-integration)
7. [Theme System](#7-theme-system)
8. [Sidebar & Navigation](#8-sidebar--navigation)
9. [Các module chưa hoàn chỉnh](#9-các-module-chưa-hoàn-chỉnh)
10. [Kế hoạch phát triển](#10-kế-hoạch-phát-triển)

---

## 1. Tổng quan Tech Stack

| Category | Library/Version |
|----------|----------------|
| Framework | Next.js 16.1.1 (App Router) |
| Language | TypeScript 5.9.3 |
| Styling | Tailwind CSS v4 + CSS variables |
| UI Library | shadcn/ui (style: `new-york`) — 40+ components |
| Icons | lucide-react |
| Tables | @tanstack/react-table 8.21.3 |
| Forms | react-hook-form + @hookform/resolvers + zod 4.3.2 |
| State | Zustand 5.0.9 (chat module) |
| Auth | Firebase Auth (client) + Firebase Admin (server) |
| Database | Firestore |
| Storage | Firebase Storage |
| Charts | Recharts 3.6.0 |
| Theme | next-themes + custom ThemeProvider + SidebarConfigProvider |
| Toast | sonner 2.0.7 |
| Date | date-fns 4.1.0 + react-day-picker 9.13.0 |

---

## 2. Cấu trúc thư mục

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route group: không sidebar
│   │   ├── sign-in/
│   │   ├── sign-up/
│   │   ├── forgot-password/
│   │   └── errors/               # 401/403/404/500/503
│   ├── (dashboard)/              # Route group: có sidebar
│   │   ├── dashboard/            # Main dashboard
│   │   ├── dashboard-2/          # Business dashboard
│   │   ├── dashboard-3/          # Marketing dashboard
│   │   ├── tasks/                # Task management
│   │   ├── users/                # User management
│   │   ├── chat/                 # Chat/messaging
│   │   ├── mail/                 # Email client
│   │   ├── calendar/            # Calendar
│   │   ├── faqs/                 # FAQs page
│   │   ├── pricing/              # Pricing page
│   │   └── settings/             # 6 settings pages
│   ├── landing/                  # Marketing landing page (13 sections)
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Redirect → /dashboard
├── components/
│   ├── ui/                       # 40 shadcn/ui components
│   ├── app-sidebar.tsx           # Dashboard sidebar
│   ├── site-header.tsx          # Header với search, links, theme toggle
│   ├── site-footer.tsx          # Footer
│   ├── theme-provider.tsx       # Theme provider
│   ├── mode-toggle.tsx          # Dark/light toggle
│   └── theme-customizer/         # Panel tùy chỉnh theme/layout
├── modules/                      # Feature modules
│   ├── dashboard/
│   ├── dashboard-2/
│   ├── dashboard-3/
│   ├── tasks/
│   ├── users/
│   ├── chat/
│   ├── mail/
│   ├── calendar/
│   ├── faqs/
│   ├── pricing/
│   └── settings/
├── lib/
│   ├── firebase/
│   │   ├── client.ts            # Firebase client init
│   │   ├── admin.ts             # Firebase Admin (server-only)
│   │   ├── auth.ts              # Auth helpers
│   │   ├── firestore-query.ts   # Firestore query với mock fallback
│   │   └── mock-data-seeder.ts   # Server-side seeder (chưa có UI)
│   └── utils.ts                # cn() helper
├── contexts/
│   ├── theme-context.ts        # ThemeProviderContext
│   └── sidebar-context.tsx     # SidebarConfigProvider
├── hooks/
│   ├── use-theme.ts
│   ├── use-theme-manager.ts    # Quản lý theme, brand colors, import CSS
│   ├── use-sidebar-config.ts
│   ├── use-circular-transition.ts  # View Transitions API animation
│   ├── use-fullscreen.ts
│   └── use-mobile.ts
└── config/
    ├── theme-customizer-constants.ts
    └── theme-data.ts
```

---

## 3. Danh sách tất cả routes

### 3.1 Dashboard Group — `/dashboard/*`

| Route | File | Type | Description |
|-------|------|------|-------------|
| `/dashboard` | `dashboard/page.tsx` | Server | Main dashboard — stats, area chart, 4-section data table |
| `/dashboard-2` | `dashboard-2/page.tsx` | Server | Business KPIs, sales/revenue charts |
| `/dashboard-3` | `dashboard-3/page.tsx` | Client | Marketing analytics, social metrics |

### 3.2 Apps Group — `/tasks`, `/users`, `/chat`, `/mail`, `/calendar`

| Route | File | Type | Description |
|-------|------|------|-------------|
| `/tasks` | `tasks/page.tsx` | Client | Task management với TanStack Table + Firebase CRUD |
| `/users` | `users/page.tsx` | Client | User management table với CRUD |
| `/chat` | `chat/page.tsx` | Client | Chat/messaging UI với Zustand store |
| `/mail` | `mail/page.tsx` | Server | Email client 3-panel |
| `/calendar` | `calendar/page.tsx` | Server | Event calendar với multi-calendar |

### 3.3 Pages Group — `/pricing`, `/faqs`

| Route | File | Type | Description |
|-------|------|------|-------------|
| `/pricing` | `pricing/page.tsx` | Server | 3-tier pricing ($19/$79/$199), features, FAQ |
| `/faqs` | `faqs/page.tsx` | Server | 46 FAQs 7 categories + features grid |

### 3.4 Settings Group — `/settings/*`

| Route | File | Type | Description |
|-------|------|------|-------------|
| `/settings/user` | `settings/user/page.tsx` | Client | Profile form với avatar upload |
| `/settings/account` | `settings/account/page.tsx` | Client | Personal info + password + danger zone |
| `/settings/billing` | `settings/billing/page.tsx` | Server | Current plan + billing history |
| `/settings/appearance` | `settings/appearance/page.tsx` | Client | Theme/font/layout settings (form) |
| `/settings/notifications` | `settings/notifications/page.tsx` | Client | Email/push/SMS preferences |
| `/settings/connections` | `settings/connections/page.tsx` | Client | 3rd-party integrations + API keys |

### 3.5 Auth Group — `/sign-in`, `/sign-up`, `/forgot-password`

| Route | File | Type | Description |
|-------|------|------|-------------|
| `/sign-in` | `sign-in/page.tsx` | Server+Client | Email/password + Google OAuth |
| `/sign-up` | `sign-up/page.tsx` | Server+Client | Registration + Google OAuth |
| `/forgot-password` | `forgot-password/page.tsx` | Server+Client | Password reset email form (placeholder) |

### 3.6 Error Pages — `/errors/*`

| Route | File | HTTP Code | Description |
|-------|------|-----------|-------------|
| `/errors/not-found` | `errors/not-found/page.tsx` | 404 | Page not found |
| `/errors/forbidden` | `errors/forbidden/page.tsx` | 403 | Access forbidden |
| `/errors/unauthorized` | `errors/unauthorized/page.tsx` | 401 | Unauthorized |
| `/errors/internal-server-error` | `errors/internal-server-error/page.tsx` | 500 | Server error |
| `/errors/under-maintenance` | `errors/under-maintenance/page.tsx` | 503 | Under maintenance |

### 3.7 Other Routes

| Route | File | Type | Description |
|-------|------|------|-------------|
| `/` | `app/page.tsx` | Client | Redirect → `/dashboard` |
| `/landing` | `landing/page.tsx` | Server+Client | Marketing landing page (13 sections) |

---

## 4. Chi tiết từng trang

### 4.1 `/dashboard` — Main Dashboard

**Type:** Server Component (`async function Page()`)

**Data Sources (4 JSON files):**
- `data/data.json` — 68 Focus Documents (header, type, status, target, limit, reviewer)
- `data/past-performance-data.json` — 5 government contracts
- `data/key-personnel-data.json` — 5 personnel records
- `data/focus-documents-data.json` — 5 focus document records

**Components:**
- `SectionCards` — Summary stat cards
- `ChartAreaInteractive` — Recharts AreaChart
- `DataTable` — TanStack Table với 4 data sources

**Service:** `getDashboardData()` — fetches từ Firestore, falls back to mock

---

### 4.2 `/dashboard-2` — Business Dashboard

**Type:** Server Component

**Data Source:** `dashboard-data.json`
- Revenue: $54K total
- Orders: 1,247
- Conversion rate: 3.24%
- Monthly sales/target arrays
- Revenue breakdown (subscriptions, one-time, services, partnerships)
- Customer growth data

**Components:** MetricsOverview, SalesChart, RevenueBreakdown, RecentTransactions, TopProducts, CustomerInsights, QuickActions

---

### 4.3 `/dashboard-3` — Marketing Dashboard

**Type:** Client Component (`"use client"`)

**Data Source:** Inline TypeScript mock data (không có JSON file)
- 4 KPIs: Total Reach (8.7M), Engagement Rate (6.82%), New Followers (124.8K), Cost Per Lead ($18.42)
- Audience growth (8 weekly records)
- Channel performance (5 channels)
- Social mix (4 segments)
- 4 campaigns + content pipeline + activity feed

**Components:** MarketingDashboard với AudienceGrowthChart, SocialMixCard, ChannelPerformanceChart, CampaignTable, SocialActivityFeed

---

### 4.4 `/tasks` — Task Management

**Type:** Client Component

**Data:** 50 tasks (TASK-1001 → TASK-1050)
- Status: pending, todo, in progress, completed
- Category: bug, feature, documentation, improvement, refactor
- Priority: minor, normal, important, critical

**Service:** Full CRUD với Firestore
- `getTasks()` — đọc collection "tasks"
- `seedTasksWithClient()` — batch-write 50 tasks
- `createTask()`, `updateTask()`, `deleteTask()`
- `getTaskStats()` — đếm total/completed/in-progress/pending

**UI:** Stat cards + TanStack Table với:
- Toolbar: search, filter by status/category/priority, Add Task, **Seed Data button**
- Column visibility toggle
- Row actions: edit/delete/duplicate
- Pagination

**Note:** Module duy nhất có seed button và full Firestore CRUD

---

### 4.5 `/users` — User Management

**Type:** Client Component

**Data:** 15 users từ `data/users.json`
- Fields: id, name, email, role, plan, billing, status, joinedDate, lastLogin
- Roles: Admin, Editor, Author, Maintainer, Subscriber
- Plans: Basic, Professional, Enterprise
- Status: Active, Pending, Inactive, Error

**UI:** Stat cards + DataTable + UserFormDialog (add/edit)

---

### 4.6 `/chat` — Chat/Messaging

**Type:** Client Component

**Data:**
- 5 users (Sarah Mitchell, Alex Thompson, Emily Rodriguez, David Kim, Lisa Chen)
- 6 conversations (conv-1 → conv-6)
- Messages per conversation

**State Management:** Zustand store (`useChat`)
- State: conversations, messages, users, selectedConversation, searchQuery, isTyping, onlineUsers
- Actions: setConversations, setMessages, addMessage, markAsRead, togglePin, toggleMute, etc.

**UI:** 3-panel layout
- ConversationList — sidebar
- ChatHeader + MessageList — main panel
- MessageInput

---

### 4.7 `/mail` — Email Client

**Type:** Server Component

**Data:** 17 emails, 3 accounts (Alicia Koch: Gmail/Vercel/iCloud), 20 contacts
- Labels: meeting, work, important, personal, budget, conference, travel
- Fields: id, name, email, subject, text, date, read, labels

**UI:** 3-panel resizable layout
- Nav (labels) + AccountSwitcher
- MailList
- MailDisplay

---

### 4.8 `/calendar` — Calendar

**Type:** Server Component

**Data:**
- 5 events (Team Standup, Design Review, Product Launch, Client Presentation, Birthday)
- 5 calendars (Personal, Work, Team Calendar, Meetings, Events)
- 7 event date entries

**Components:** Calendar, CalendarSidebar, DatePicker, EventForm, QuickActions

---

### 4.9 `/pricing` — Pricing Page

**Type:** Server Component

**Data:** Shares `features.json` và `faqs.json` với FAQs module

**UI:**
- 3 pricing tiers: Basic ($19), Professional ($79), Enterprise ($199)
- Features comparison grid
- FAQ accordion

---

### 4.10 `/faqs` — FAQs Page

**Type:** Server Component

**Data:** 46 FAQs across 7 categories
- Categories: General, Account, Billing, Technical, Privacy, Security, Support
- 6 feature items

**UI:** FAQ accordion với category filter tabs + Features grid

---

### 4.11 `/settings/user` — User Profile

**Type:** Client Component + react-hook-form + zod

**Fields:** First name, last name, email, phone, website, location, company, language, role, timezone, bio

**Features:**
- Avatar upload với FileReader preview
- 2-column form grid
- Full-width bio textarea
- Language options: English, Spanish, French, German, Italian, Portuguese
- Timezone options: PST, EST, CST, MST, UTC, CET, JST, AEST

---

### 4.12 `/settings/account` — Account Settings

**Type:** Client Component + react-hook-form + zod

**Sections:**
1. Personal Information: first name, last name, email, username
2. Change Password: current, new, confirm password
3. Danger Zone: Delete Account button

---

### 4.13 `/settings/billing` — Plans & Billing

**Type:** Server Component

**Data:** Current plan (Professional, $79/month) + billing history (3 months)

**UI:** CurrentPlanCard + BillingHistoryCard + PricingPlans (upgrade/downgrade)

---

### 4.14 `/settings/appearance` — Appearance Settings

**Type:** Client Component + react-hook-form

**Form Fields:**
- Theme: light/dark (radio với visual preview)
- Font Family: Inter, Roboto, System Default
- Font Size: Small, Medium, Large
- Sidebar Width: Compact, Comfortable, Spacious
- Content Width: Fixed, Fluid, Container

**Note:** Form tồn tại nhưng chưa wire đến live CSS. Live theme switching thực tế do `ThemeCustomizer` panel xử lý.

---

### 4.15 `/settings/notifications` — Notification Settings

**Type:** Client Component + react-hook-form

**Sections:**
- Email Notifications (security/product/marketing toggles)
- Push Notifications (messages/mentions/tasks)
- Notification Frequency (instant, hourly/daily/weekly digest, never)
- Quiet Hours (10pm-8am)
- Notification Preferences Table (12 checkboxes: 4 types × 3 channels)
- Notification Channels (Email/Push/SMS toggles)

---

### 4.16 `/settings/connections` — Connections

**Type:** Client Component

**Sections:**
- Connected Accounts: Apple, Google, GitHub, Slack (toggle switches)
- Social Accounts: Facebook, Twitter, Instagram, Dribbble (connect/disconnect)
- API Integrations: Zapier, Webhooks, Database Sync (toggle switches)
- API Keys: Production + Development keys (masked, regenerate/copy)

---

### 4.17 `/sign-in` — Sign In

**Type:** Server Component (page) + Client (form component)

**Auth Methods:**
- Email/password (default: `admin@claudecode.ai` / `123456789`)
- Google OAuth popup

**Service:** `signInWithEmailPassword()`, `signInWithGoogle()` từ `auth.ts`

**On success:** Redirect → `/dashboard`

**Error handling:** `getFirebaseAuthErrorMessage()` trả message tiếng Việt

---

### 4.18 `/sign-up` — Sign Up

**Type:** Server Component (page) + Client (form component)

**Fields:** First name, last name, email, password, confirm password, terms checkbox

**Validation:** Zod (password match, terms required)

**Auth:** `signUpWithEmailPassword()` + Google OAuth

**On success:** Redirect → `/dashboard`

---

### 4.19 `/landing` — Marketing Landing Page

**Type:** Server Component (metadata) + Client (LandingPageContent)

**13 Sections:**
1. LandingNavbar
2. HeroSection (CTA)
3. LogoCarousel (partners)
4. StatsSection
5. AboutSection
6. FeaturesSection
7. TeamSection
8. PricingSection
9. TestimonialsSection
10. BlogSection
11. FaqSection
12. CTASection
13. ContactSection
14. LandingFooter

**Special:** Floating theme customizer trigger button + LandingThemeCustomizer panel

---

## 5. Kiến trúc dữ liệu

### Pattern A: Server Component + JSON (đa số modules)

```
JSON file (modules/X/services/data/*.json)
    ↓ static import
X-mock-data.ts (static export)
    ↓ imported by
X-services.ts (getFirestoreCollection với fallback)
    ↓ called by
app/(dashboard)/X/page.tsx (async Server Component)
    ↓ passes as props
X/components/*.tsx
```

**Áp dụng:** dashboard, dashboard-2, users, mail, calendar, faqs, pricing, settings (billing)

### Pattern B: Client Component + Firestore CRUD

```
task-mock-data.ts (50 tasks, zod schema)
    ↓
task-services.ts (Firestore SDK: getDocs, setDoc, updateDoc, deleteDoc, writeBatch)
    ↓
tasks/page.tsx ("use client", useState + useEffect)
    ↓
DataTable + AddTaskModal
```

**Áp dụng:** tasks, users (partial CRUD)

### Pattern C: Zustand Store

```
messages.json → chat-services.ts (export useChat Zustand store)
    ↓
chat/page.tsx → useChat() store
    ↓
Chat components (ChatHeader, MessageList, MessageInput)
```

**Áp dụng:** chat

### Pattern D: Inline TypeScript Mock (không có JSON)

```
dashboard-3-services.ts (hardcoded TS arrays/objects)
    ↓
dashboard-3/page.tsx (Server Component)
    ↓
MarketingDashboard component
```

**Áp dụng:** dashboard-3

---

## 6. Firebase Integration

### 6.1 Firebase Client (`src/lib/firebase/client.ts`)

```typescript
// Init với env vars
// validateFirebaseEnv() check required fields
// Lazy init — không throw khi thiếu config
export const app = _app;
export const auth = _auth;
export const db = _db;
export const storage = _storage;

// Helper functions — throw rõ ràng khi null
export function getDb(): Firestore { ... }
export function getAuthHelper(): Auth { ... }
```

**Required env vars (`.env.local`):**
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
```

### 6.2 Auth Helpers (`src/lib/firebase/auth.ts`)

```typescript
signInWithEmailPassword(email, password)
signInWithGoogle()              // Google OAuth popup
signUpWithEmailPassword(email, password, displayName)
signOutUser()
getFirebaseAuthErrorMessage(error, mode)  // 16 Firebase error codes → tiếng Việt
```

### 6.3 Firestore Query (`src/lib/firebase/firestore-query.ts`)

```typescript
// Try Firestore → catch → return fallback mock data
getFirestoreCollection<T>(collectionName, fallbackData): Promise<T[]>
getFirestoreDocumentCollection<T>(collectionName, fallbackData): Promise<T[]>
```

**Rule:** KHÔNG dùng `onSnapshot` (no real-time). KHÔNG viết direct CRUD ở service. Dùng callback pattern.

### 6.4 Firebase Admin (`src/lib/firebase/admin.ts`)

Server-only. Dùng cho seeder batch writes.

---

## 7. Theme System

### 7.1 Architecture (5 layers)

```
1. Base       → ThemeProvider context (dark/light/system)
2. Preset     → colorThemes + tweakcnThemes (40+ presets)
3. Apply      → useThemeManager manipulates document.documentElement.style
4. Transition → useCircularTransition (View Transitions API, circular clip-path)
5. Custom     → Brand colors (8 CSS vars) + Import CSS modal
```

### 7.2 Theme Customizer Panel (`src/components/theme-customizer/`)

**Theme Tab:**
- Shadcn UI themes (dropdown với color swatches)
- Tweakcn themes
- Radius: 5 options (0 → 1.0 rem)
- Mode: Light/Dark toggle
- Brand Colors: 8 color pickers
- Import CSS: Parse `:root {}` và `.dark {}` sections

**Layout Tab:**
- Sidebar Variant: Default / Floating / Inset
- Sidebar Collapsible: Off Canvas / Icon / None
- Sidebar Position: Left / Right

### 7.3 Key Hooks

| Hook | File | Responsibility |
|------|------|----------------|
| `useTheme` | `hooks/use-theme.ts` | Thin wrapper around ThemeProviderContext |
| `useThemeManager` | `hooks/use-theme-manager.ts` | Apply themes, brand colors, radius, reset |
| `useCircularTransition` | `hooks/use-circular-transition.ts` | View Transitions API circular reveal |
| `useSidebarConfig` | `hooks/use-sidebar-config.ts` | Sidebar variant/collapsible/side state |

### 7.4 Available Themes

- **Shadcn presets:** 40+ color themes (zinc, slate, stone, neutral, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose)
- **Tweakcn themes:** additional curated themes
- **Custom:** 8 brand color pickers + full CSS import

---

## 8. Sidebar & Navigation

### 8.1 Sidebar Structure (`src/components/app-sidebar.tsx`)

**3 nav groups, hardcoded items:**

**Dashboards:**
- Dashboard 1 → `/dashboard` (LayoutDashboard)
- Dashboard 2 → `/dashboard-2` (LayoutPanelLeft)
- Dashboard 3 → `/dashboard-3` (Megaphone)

**Apps:**
- Mail → `/mail`
- Tasks → `/tasks`
- Chat → `/chat`
- Calendar → `/calendar`
- Users → `/users`

**Pages:**
- Landing → `/landing` (new tab)
- Auth Pages → # (Sign In, Sign Up, Forgot Password)
- Errors → # (5 error pages)
- Settings → # (6 settings sub-pages)
- FAQs → `/faqs`
- Pricing → `/pricing`

### 8.2 Header (`src/components/site-header.tsx`)

- SidebarTrigger (hamburger collapse)
- SearchTrigger (Command palette, Ctrl/Cmd+K)
- External links: Blocks, Landing Page, GitHub
- ThemeCustomizerTrigger
- ModeToggle

### 8.3 NavUser (`src/components/nav-user.tsx`)

Dropdown footer:
- Account → `/settings/account`
- Billing → `/settings/billing`
- Notifications → `/settings/notifications`
- Log out → `signOutUser()` → redirect `/sign-in`

---

## 9. Các module chưa hoàn chỉnh

| # | Module | Vấn đề | Impact |
|---|--------|--------|--------|
| 1 | **Firebase config** | Không có `.env.local` → 100% mock data | Tất cả pages dùng mock, không có real data |
| 2 | **Seeder UI** | Không có `/mock-data` page global như CLAUDE.md mô tả | Không thể seed data từ giao diện |
| 3 | **Auth Guard** | Không có middleware bảo vệ `/dashboard` | Ai cũng truy cập dashboard không cần login |
| 4 | **Appearance settings** | Font family/size form chưa apply CSS thực tế | Chỉ là UI, không thay đổi gì |
| 5 | **Notifications/Connections** | Form chưa save (chỉ UI) | Preferences không được lưu |
| 6 | **Forgot Password** | Email form placeholder, chưa implement logic | Không gửi được email reset |

---

## 10. Kế hoạch phát triển

### Phase 1: Firebase Foundation

1. **Tạo `.env.local`** — Copy từ `.env.example`, điền Firebase config
2. **Tạo Firestore Database** — Trong Firebase Console, tạo database
3. **Tạo `/mock-data` seeder page** — Trang UI cho phép seed từng module lên Firestore
4. **Thêm Auth Middleware** — Bảo vệ `/dashboard/*`, `/tasks`, `/users`, `/chat`, `/mail`, `/calendar`, `/settings/*` yêu cầu login
5. **Test auth flow** — sign-in/sign-up/sign-out hoạt động đúng

### Phase 2: Data Wiring

1. Kết nối từng module đến Firestore (dashboard, dashboard-2, dashboard-3, mail, calendar, faqs, pricing, settings)
2. Verify seed button trong Tasks hoạt động
3. CRUD cho Users module (hiện chỉ đọc từ mock)

### Phase 3: Settings Completion

1. Wire appearance form → `useThemeManager`
2. Wire notifications → localStorage hoặc Firestore user profile
3. Wire connections → toggle state management
4. Implement forgot-password (Firebase password reset email)

### Phase 4: Polish

1. Verify tất cả error pages
2. Landing page polish
3. Performance review
4. Mobile responsiveness check

---

## Phụ lục: Module Pattern Reference

Mỗi feature module tuân theo pattern chuẩn (tham khảo `tasks` — canonical reference):

```
src/modules/<feature>/
├── services/
│   ├── types/<feature>-types.ts    # zod schema + TypeScript interfaces
│   ├── <feature>-mock-data.ts      # Static mock data
│   ├── <feature>-services.ts       # Firestore query helpers
│   └── data/<feature>.json         # JSON data file(s)
└── components/
    ├── data-table.tsx               # TanStack Table wrapper
    ├── columns.tsx                  # Column definitions
    ├── data-table-toolbar.tsx       # Search, filters, add button
    ├── data-table-pagination.tsx    # Pagination
    ├── data-table-row-actions.tsx   # Dropdown actions
    └── add-<feature>-modal.tsx      # Create dialog
```

---

## Phụ lục: Environment Variables

### Client Firebase (`NEXT_PUBLIC_*`)
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
```

### Server Firebase Admin (không có `NEXT_PUBLIC_`)
```
FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY
```
