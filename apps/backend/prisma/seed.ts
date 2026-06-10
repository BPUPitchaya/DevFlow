import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Hash password for demo users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create teams
  const engineeringTeam = await prisma.team.upsert({
    where: { id: 't1' },
    update: {},
    create: {
      id: 't1',
      name: 'Engineering Team',
      description: 'Core development team',
    },
  });

  const designTeam = await prisma.team.upsert({
    where: { id: 't2' },
    update: {},
    create: {
      id: 't2',
      name: 'Design Team',
      description: 'UI/UX design team',
    },
  });

  const marketingTeam = await prisma.team.upsert({
    where: { id: 't3' },
    update: {},
    create: {
      id: 't3',
      name: 'Marketing Team',
      description: 'Marketing and growth',
    },
  });

  const operationsTeam = await prisma.team.upsert({
    where: { id: 't4' },
    update: {},
    create: {
      id: 't4',
      name: 'Operations Team',
      description: 'Operations and support',
    },
  });

  console.log('Teams created');

  // Create users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'john@example.com' },
      update: {},
      create: {
        id: 'u1',
        email: 'john@example.com',
        name: 'John Doe',
        password: hashedPassword,
        role: 'ENGINEER',
        teamId: engineeringTeam.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'jane@example.com' },
      update: {},
      create: {
        id: 'u2',
        email: 'jane@example.com',
        name: 'Jane Smith',
        password: hashedPassword,
        role: 'PROJECT_MANAGER',
        teamId: engineeringTeam.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'bob@example.com' },
      update: {},
      create: {
        id: 'u3',
        email: 'bob@example.com',
        name: 'Bob Wilson',
        password: hashedPassword,
        role: 'ENGINEER',
        teamId: engineeringTeam.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'alice@example.com' },
      update: {},
      create: {
        id: 'u4',
        email: 'alice@example.com',
        name: 'Alice Johnson',
        password: hashedPassword,
        role: 'ENGINEER',
        teamId: engineeringTeam.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'grace@example.com' },
      update: {},
      create: {
        id: 'u5',
        email: 'grace@example.com',
        name: 'Grace Lee',
        password: hashedPassword,
        role: 'ENGINEER',
        teamId: designTeam.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'liam@example.com' },
      update: {},
      create: {
        id: 'u6',
        email: 'liam@example.com',
        name: 'Liam Brown',
        password: hashedPassword,
        role: 'ENGINEER',
        teamId: marketingTeam.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'paul@example.com' },
      update: {},
      create: {
        id: 'u7',
        email: 'paul@example.com',
        name: 'Paul Thompson',
        password: hashedPassword,
        role: 'ENGINEER',
        teamId: operationsTeam.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        id: 'u8',
        email: 'admin@example.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN',
        teamId: engineeringTeam.id,
      },
    }),
  ]);

  console.log('Users created');

  // Create a sprint
  const sprint = await prisma.sprint.upsert({
    where: { id: 's1' },
    update: {},
    create: {
      id: 's1',
      name: 'Sprint 1',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-14'),
      teamId: engineeringTeam.id,
      status: 'active',
    },
  });

  console.log('Sprint created');

  // Create milestones
  await prisma.milestone.upsert({
    where: { id: 'm1' },
    update: {},
    create: {
      id: 'm1',
      name: 'Complete API Integration',
      description: 'Integrate all backend APIs',
      dueDate: new Date('2024-01-07'),
      sprintId: sprint.id,
      completed: false,
    },
  });

  await prisma.milestone.upsert({
    where: { id: 'm2' },
    update: {},
    create: {
      id: 'm2',
      name: 'UI Polish',
      description: 'Polish the user interface',
      dueDate: new Date('2024-01-10'),
      sprintId: sprint.id,
      completed: false,
    },
  });

  console.log('Milestones created');

  // Create some sample standups
  await prisma.standup.upsert({
    where: { id: 'st1' },
    update: {},
    create: {
      id: 'st1',
      userId: users[0].id,
      teamId: engineeringTeam.id,
      completed: 'Fixed authentication bug, worked on dashboard',
      focus: 'Complete dashboard implementation',
      blockers: 'Waiting for API documentation',
      isBlocked: true,
      status: 'SUBMITTED',
    },
  });

  await prisma.standup.upsert({
    where: { id: 'st2' },
    update: {},
    create: {
      id: 'st2',
      userId: users[1].id,
      teamId: engineeringTeam.id,
      completed: 'Reviewed pull requests, planned sprint',
      focus: 'Sprint planning and team coordination',
      blockers: null,
      isBlocked: false,
      status: 'SUBMITTED',
    },
  });

  console.log('Standups created');

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
