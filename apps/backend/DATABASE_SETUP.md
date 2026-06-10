# Database Setup Guide

This guide explains how to set up PostgreSQL and run migrations for the DevFlow backend.

## Prerequisites

- PostgreSQL installed and running locally
- Node.js and npm installed

## Setup Steps

### 1. Install PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start
```

**Windows:**
Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE devflow;

# Create user (optional, if you want a dedicated user)
CREATE USER devflow_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE devflow TO devflow_user;

# Exit
\q
```

### 3. Configure Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Update the `DATABASE_URL` in `.env`:
```
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/devflow?schema=public"
```

Or if you created a dedicated user:
```
DATABASE_URL="postgresql://devflow_user:your_password@localhost:5432/devflow?schema=public"
```

### 4. Install Dependencies

```bash
cd apps/backend
npm install
```

### 5. Run Migrations

```bash
npm run prisma:migrate
```

This will create all the tables in your database based on the Prisma schema.

### 6. Seed the Database (Optional)

To populate the database with sample data for testing:

```bash
npm run prisma:seed
```

This will create:
- 4 teams (Engineering, Design, Marketing, Operations)
- 8 users with hashed passwords (password: `password123`)
- 1 sprint with 2 milestones
- 2 sample standups

### 7. Generate Prisma Client

```bash
npm run prisma:generate
```

### 8. Verify Setup

You can use Prisma Studio to view and edit your data:

```bash
npm run prisma:studio
```

This will open a web interface at `http://localhost:5555`

## Database Schema

The database includes the following models:
- **User**: User accounts with authentication
- **Team**: Teams/organizations
- **Sprint**: Development sprints
- **Milestone**: Sprint milestones
- **Standup**: Daily standup submissions
- **Comment**: Comments on standups
- **Reaction**: Reactions to standups
- **Notification**: User notifications
- **Bottleneck**: Tracked bottlenecks
- **Connection**: User connections
- **Conversation**: Chat conversations
- **Message**: Chat messages
- **Channel**: Team channels
- And more...

## Troubleshooting

### Connection Issues

If you get connection errors:
1. Verify PostgreSQL is running: `brew services list` (macOS) or `sudo service postgresql status` (Linux)
2. Check your DATABASE_URL in `.env`
3. Ensure the database exists: `psql -U postgres -l`

### Migration Errors

If migrations fail:
1. Drop and recreate the database:
   ```bash
   psql -U postgres -c "DROP DATABASE devflow;"
   psql -U postgres -c "CREATE DATABASE devflow;"
   ```
2. Run migrations again: `npm run prisma:migrate`

### Seed Errors

If seeding fails:
1. Ensure migrations have been run first
2. Check that the database is empty or handle conflicts in the seed script
3. Verify all dependencies are installed

## Production Deployment

For production:
1. Use a managed PostgreSQL service (Supabase, Neon, AWS RDS, etc.)
2. Set strong passwords in environment variables
3. Enable SSL for database connections
4. Use environment-specific configuration
5. Run migrations as part of your deployment pipeline
