# DevFlow

Enterprise-grade asynchronous daily standup and team velocity platform.

## Architecture

- **Mobile App**: React Native (Expo) - Developer interface for standup submissions
- **Web Dashboard**: Next.js - Management command center with analytics
- **Backend**: PostgreSQL + Prisma - Centralized data layer
- **Real-time**: WebSockets/SSE - Cross-platform communication

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- PostgreSQL
- Expo CLI (for mobile development)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations
cd apps/backend
npx prisma migrate dev

# Start development servers
npm run dev
```

## Project Structure

```
devflow/
├── apps/
│   ├── backend/      # Next.js API + Prisma
│   ├── web/          # Next.js web dashboard
│   └── mobile/       # React Native/Expo app
├── packages/
│   ├── ui/           # Shared UI components
│   └── config/       # Shared configurations
└── turbo.json        # Turborepo configuration
```

## Features

- 60-second standup submissions
- Real-time blocker notifications
- Team activity stream
- Sprint velocity analytics
- Bottleneck detection
- Role-based access control
- Offline mobile support
