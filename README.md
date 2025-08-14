# Orderly - B2B Ordering Platform

## Project Overview

Orderly is a comprehensive B2B ordering platform that connects shopkeepers and wholesalers, streamlining the ordering process with modern web technologies.

## Features

- **Shopkeeper Dashboard**: Quick ordering and order history
- **Wholesaler Portal**: Inventory management and order fulfillment
- **Admin Panel**: System oversight and user management
- **Real-time Updates**: Live order tracking and notifications
- **Mobile-First Design**: Responsive interface for all devices

## Development Setup

**Local Development**

Clone this repository and set up your local development environment:

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd orderly

# Step 3: Install dependencies
npm install

# Step 4: Start the development server
npm run dev
```

## Tech Stack

This project is built with modern web technologies:

- **Vite** - Fast build tool and dev server
- **TypeScript** - Type-safe JavaScript
- **React** - UI library with hooks
- **shadcn/ui** - Modern component library
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Lucide React** - Beautiful icons

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   └── layout/         # Layout components
├── pages/              # Page components
│   ├── shop/           # Shopkeeper pages
│   ├── wholesale/      # Wholesaler pages
│   └── admin/          # Admin pages
└── hooks/              # Custom React hooks
```

## Deployment

Build the project for production:

```sh
npm run build
```

The built files will be in the `dist/` directory, ready for deployment to any static hosting service.

## Available Scripts

Run these from the project root:

- `npm run dev` — Start Vite dev server (hot reload) on port 8080
- `npm run build` — Production build
- `npm run build:dev` — Development-mode build
- `npm run preview` — Preview the production build locally
- `npm run lint` — Lint the codebase

## Environment Variables

Create a `.env` file in the project root if you need runtime configuration. Common examples:

```
VITE_API_BASE=https://orderly-backend-three.vercel.app/
VITE_ENABLE_MOCKS=false
```

The app reads the API base URL from `import.meta.env.VITE_API_BASE`. Access envs in code via `import.meta.env.VITE_*`.

## Route Map

- `/register` — Registration
- `/login` — Login
- `/shop/dashboard` — Shopkeeper dashboard (quick order)
- `/shop/orders` — Shopkeeper order history
- `/shop/profile` — Shopkeeper profile
- `/wholesale/orders` — Wholesaler orders management
- `/wholesale/dashboard` — Distributor dashboard
- `/wholesale/inventory` — Inventory management
- `/admin/overview` — Admin overview

## Design System

Tailwind uses CSS variables defined in `src/index.css` and mapped in `tailwind.config.ts`.

Primary palette (HSL and hex):

- Primary: `hsl(152 41% 30%)` — #2D6A4F
- Secondary: `hsl(153 38% 41%)` — #40916C
- Accent (CTA): `hsl(43 100% 70%)` — #FFD166
- Destructive: `hsl(355 78% 56%)` — #E63946
- Info: `hsl(200 100% 36%)` — #0077B6
- Background: `hsl(210 17% 98%)` — #F8F9FA
- Foreground: `hsl(222 25% 12%)`
- Border/Input: `hsl(214 32% 91%)`

See variables in `src/index.css` for sidebar and other tokens.

## Troubleshooting

- __Port already in use (8080)__: Stop the other process or change `server.port` in `vite.config.ts`.
- __Cannot find module 'papaparse'__: Install it with `npm i papaparse` (and optionally `npm i -D @types/papaparse`).
- __Alias '@' not working__: Ensure `vite.config.ts` has `alias: { '@': path.resolve(__dirname, './src') }` and restart dev server.
- __Styling not applied__: Confirm Tailwind content globs in `tailwind.config.ts` include `./src/**/*.{ts,tsx}` and that `src/index.css` is imported in `src/main.tsx`.
- __TypeScript errors after dependency changes__: Try deleting `node_modules` and `package-lock.json`, then `npm install`.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit changes: `git commit -m "feat: add your feature"`
4. Push the branch and open a PR

## License

Copyright (c) 2025 Orderly. All rights reserved.
