# ==============================================================================
# OURMAM - ARCHITECTURE & SYSTEM DESIGN SPECIFICATION
# ==============================================================================

## 1. Overview & Architectural Principles

OurMam is engineered with a **Decoupled Client-Server Architecture** adhering to clean code standards used by high-velocity engineering organizations:

- **Separation of Concerns (SoC):** Frontend UI, Business Services, Utilities, and Backend Storage operate under distinct boundaries.
- **Service-Oriented Client Layer (Adapter Pattern):** All network calls pass through an abstract API service layer (`src/services/api.js`). The UI never directly couples to database queries, enabling 100% testability with Mock Data or seamless transition to custom REST/GraphQL/Supabase backends.
- **Client-Side Heavy Processing:** Media resizing, WebP/JPEG conversion, audio synthesis, and offline state caching occur on the client, minimizing backend CPU overhead and bandwidth consumption.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   PRESENTATION LAYER                                   │
│  [ Header & Profiles ]    [ Locket Live Feed ]    [ Camera Snapper ]   [ Calendar & Chat ]
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
┌───────────────────────────────────────────▼────────────────────────────────────────────┐
│                                     SERVICE LAYER                                      │
│      [ MealService ]            [ ProfileService ]              [ ChatService ]        │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
┌───────────────────────────────────────────▼────────────────────────────────────────────┐
│                                INFRASTRUCTURE / ADAPTER                                │
│                         [ Abstract API Client (api.js) ]                               │
│                         ├── Supabase Realtime Provider                                 │
│                         └── LocalStorage & Mock Fallback Provider                      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Taxonomy

```
OurMam/
├── .env.example                     # Environment variables schema template
├── .gitignore                      # Git ignore rules for clean repository
├── ARCHITECTURE.md                 # System architecture and design documentation
├── API_CONTRACT.md                 # Data schemas and contract between FE and BE
├── README.md                       # Developer onboarding & deployment runbook
├── index.html                      # PWA Entry HTML with semantic viewport hierarchy
├── manifest.json                   # Web App Manifest for native-feel iOS home screen
├── sw.js                           # Progressive Web App (PWA) Service Worker
│
├── src/                            # Frontend Core Source Code
│   ├── config/                     # Configuration management & environment loading
│   │   └── env.js
│   ├── constants/                  # Design tokens, theme colors & fallback mock data
│   │   ├── theme.js
│   │   └── mockData.js
│   ├── services/                   # Business domain services (API Adapters)
│   │   ├── api.js                  # Central API Gateway
│   │   ├── mealService.js          # Meal creation, feed querying, reactions
│   │   ├── profileService.js       # Multi-user profiles, roles, streak logic
│   │   └── chatService.js          # Meal messages & couple domestic reminders
│   ├── utils/                      # Pure helper utilities
│   │   ├── imageCompressor.js      # Client-side Canvas image optimizer (<150KB)
│   │   ├── cameraHelper.js         # WebRTC camera controller, focus & flash
│   │   ├── soundHelper.js          # Web Audio & sound effects synthesis
│   │   └── dateHelper.js           # Date-time formatters, streaks & calendar math
│   ├── components/                 # Isolated UI components & view controllers
│   │   ├── header.js               # Top App Bar & Profile identity controller
│   │   ├── locketFeed.js           # Partner's latest meal widget & quick reactions
│   │   ├── cameraView.js           # Live viewfinder, category pills, shutter button
│   │   ├── calendarView.js         # Month photo grid & memories timeline
│   │   ├── chatView.js             # Dialogue stream & photo polaroid bubbles
│   │   ├── navigation.js           # Bottom tab bar controller
│   │   └── modals.js               # Profile switcher modal & Photo detail modal
│   ├── styles/                     # Modular CSS design system
│   │   ├── main.css                # Base variables, typography & resets
│   │   ├── animations.css          # Ambient glow, flash effect, spring physics
│   │   └── components.css          # Pillowed cards, squircle frames & polaroids
│   └── main.js                     # Root Application Orchestrator
│
├── widgets/                        # Mobile Native Extensions
│   └── ios/
│       └── scriptable_widget.js    # iOS Home Screen Widget via Scriptable (0đ)
│
└── backend/                        # Backend Domain & Database Migrations (User Scope)
    ├── schema.sql                  # PostgreSQL / Supabase table definitions & RLS
    └── cleanup_cron.sql            # Automatic 180-day storage data retention trigger
```

---

## 3. Data Flow Lifecycle (Meal Capture to Partner Widget)

1. **Capture:** User taps shutter in `cameraView.js` -> WebRTC frame captured to HTML5 Canvas.
2. **Compress:** `imageCompressor.js` resizes to max 900px, converts to WebP/JPEG (`quality: 0.82`), reducing 5MB photo to ~120KB.
3. **Optimistic UI:** `mealService.js` prepends meal locally; UI updates instantly with sound & flash animation.
4. **Cloud Persistence:** `api.js` uploads compressed payload to Supabase Storage & inserts database record.
5. **Realtime Broadcast:** Supabase Postgres Changes channel notifies partner client -> Partner's Locket Widget & Timeline update dynamically.
