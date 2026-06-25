# Fable – Ebook Sharing Platform

A modern digital platform connecting ebook lovers with talented writers. Browse, discover, purchase, and read original ebooks from emerging authors worldwide.

## 🌐 Live URL

[https://fable-client-azure.vercel.app](https://fable-client-azure.vercel.app)

## 📌 Purpose

Fable democratizes access to literature by enabling writers to publish and sell original ebooks directly to readers. The platform features role-based dashboards for readers, writers, and admins — with full payment integration, bookmark system, and real-time analytics.

## ✨ Key Features

- 🔐 JWT Authentication (Email/Password + Google OAuth)
- 👤 Role-based access: Reader, Writer, Admin
- 📚 Browse, search, filter, sort & paginate ebooks
- 💳 Stripe payment integration for ebook purchases
- 🔖 Bookmark system for saving ebooks
- 📊 Admin analytics dashboard with charts
- 🖊️ Writer dashboard: add, edit, publish/unpublish ebooks
- 🖼️ imgBB API for cover image uploads
- ⚡ Framer Motion animations throughout
- 📱 Fully responsive design
- 🌀 Loading screen with counter animation
- 💀 Skeleton loaders for all data-fetching states
- 🚫 Custom 404 error page

## 🛠️ NPM Packages Used

| Package | Purpose |
|---|---|
| `next` | React framework (App Router) |
| `react` | UI library |
| `framer-motion` | Animations |
| `next-auth` | Google OAuth |
| `tailwindcss` | Utility-first CSS |
| `@tailwindcss/postcss` | Tailwind PostCSS plugin |

## 🔑 Environment Variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_IMGBB_KEY=your_imgbb_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_random_secret
NEXTAUTH_URL=http://localhost:3000
```

## 🚀 Getting Started

```bash
npm install
npm run dev
```

## 👤 Test Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@fable.com | Admin@123 |
| Writer | writer@fable.com | writer123 |
| Reader | reader@fable.com | reader123 |

## 📁 Project Structure
