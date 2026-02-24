# ⚡ Accuracy Flux

### Modern Practice Management Platform

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-06b6d4?style=for-the-badge&logo=tailwindcss&logoColor=white)

**A full-featured accounting practice management platform. Manage clients, automate workflows, track time, handle billing, and grow your practice — all in one place.**

</div>

---

## ✨ Features

| Module | Description |
|--------|-------------|
| 📊 **Dashboard** | At-a-glance metrics, charts (Recharts), and activity feed |
| 👥 **Client Management** | Full client database with profiles, notes, and history |
| 📋 **Kanban Board** | Drag-and-drop task management with customizable columns |
| ✉️ **Email** | Integrated email client for client communication |
| ⏱️ **Time Tracking** | Track billable hours per client and project |
| 💰 **Billing** | Generate invoices and manage payment status |
| 🏢 **Client Portal** | External portal for client self-service |
| ⚙️ **Settings** | Practice configuration and preferences |
| 🔐 **Auth** | Secure login with session management |
| 🌓 **Theme Toggle** | Light / dark mode via ThemeProvider |

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| ⚛️ Framework | Next.js 16 (App Router) |
| 🟦 Language | TypeScript |
| 🎨 Styling | Tailwind CSS v4 |
| 📊 Charts | Recharts |
| 🎭 Animations | Framer Motion |
| 🔀 Drag & Drop | DnD Kit |
| 🖼️ OG Image | `next/og` ImageResponse |

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## 📂 Project Structure

```
accuracy-flux/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout + metadata
│   │   ├── opengraph-image.tsx     # Dynamic OG banner
│   │   ├── login/                  # Auth page
│   │   ├── dashboard/              # Main dashboard
│   │   ├── clients/                # Client management
│   │   ├── kanban/                 # Task board
│   │   ├── email/                  # Email client
│   │   ├── work/                   # Work tracking
│   │   ├── time-billing/           # Time & billing
│   │   ├── portal/                 # Client portal
│   │   └── settings/               # App settings
│   ├── components/                 # Shared UI components
│   └── lib/                        # Utilities, theme context
├── public/                         # Static assets
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 📄 Pages

| Route | Page |
|-------|------|
| `/login` | 🔐 Login |
| `/dashboard` | 📊 Dashboard |
| `/clients` | 👥 Client Management |
| `/kanban` | 📋 Kanban Board |
| `/email` | ✉️ Email |
| `/work` | 📝 Work Tracking |
| `/time-billing` | ⏱️ Time & Billing |
| `/portal` | 🏢 Client Portal |
| `/settings` | ⚙️ Settings |

---

<div align="center">

⚡ **Manage your practice. Grow your firm.** 📊

</div>
