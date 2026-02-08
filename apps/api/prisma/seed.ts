import { PrismaClient, Role, Level, BookingStatus } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function main() {
  // 1. Clean up existing data (order matters due to FK constraints)
  console.log("Cleaning database...");
  await prisma.booking.deleteMany();
  await prisma.session.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();
  console.log("Database cleaned.");

  // 2. Create users
  console.log("Creating users...");

  const admin = await prisma.user.create({
    data: {
      email: "admin@qualitycat.dev",
      passwordHash: await bcrypt.hash("Admin123!", SALT_ROUNDS),
      name: "Admin",
      role: Role.ADMIN,
    },
  });
  console.log(`  Created ADMIN: ${admin.email}`);

  const mentor = await prisma.user.create({
    data: {
      email: "mentor@qualitycat.dev",
      passwordHash: await bcrypt.hash("Mentor123!", SALT_ROUNDS),
      name: "Mentor",
      role: Role.MENTOR,
    },
  });
  console.log(`  Created MENTOR: ${mentor.email}`);

  const student = await prisma.user.create({
    data: {
      email: "student@qualitycat.dev",
      passwordHash: await bcrypt.hash("Student123!", SALT_ROUNDS),
      name: "Student",
      role: Role.STUDENT,
    },
  });
  console.log(`  Created STUDENT: ${student.email}`);

  const trainer = await prisma.user.create({
    data: {
      email: "trainer@qualitycat.dev",
      passwordHash: await bcrypt.hash("Trainer123!", SALT_ROUNDS),
      name: "Trainer",
      role: Role.TRAINER,
    },
  });
  console.log(`  Created TRAINER: ${trainer.email}`);

  // 3. Create courses (author: mentor)
  console.log("Creating courses...");

  const courses = await Promise.all([
    prisma.course.create({
      data: {
        title: "Podstawy testowania",
        description:
          "Kurs wprowadzający do testowania oprogramowania. Poznasz podstawowe techniki, typy testów i dobre praktyki.",
        level: Level.BEGINNER,
        createdBy: mentor.id,
      },
    }),
    prisma.course.create({
      data: {
        title: "Testowanie API",
        description:
          "Naucz się testować REST API i GraphQL. Poznasz narzędzia takie jak Postman, REST Assured i supertest.",
        level: Level.INTERMEDIATE,
        createdBy: mentor.id,
      },
    }),
    prisma.course.create({
      data: {
        title: "Automatyzacja testów E2E",
        description:
          "Zaawansowany kurs automatyzacji testów end-to-end z użyciem Playwright i Cypress.",
        level: Level.ADVANCED,
        createdBy: mentor.id,
      },
    }),
    prisma.course.create({
      data: {
        title: "Security testing",
        description:
          "Wprowadzenie do testów bezpieczeństwa aplikacji webowych. OWASP Top 10, penetration testing, narzędzia.",
        level: Level.INTERMEDIATE,
        createdBy: mentor.id,
      },
    }),
  ]);

  for (const course of courses) {
    console.log(`  Created course: "${course.title}" (${course.level})`);
  }

  // 4. Create 3 sessions per course (future dates, varied hours & capacity)
  console.log("Creating sessions...");

  const now = new Date();
  const sessionConfigs = [
    { dayOffset: 7, hour: 9, durationH: 3, capacity: 20 },
    { dayOffset: 14, hour: 14, durationH: 2, capacity: 15 },
    { dayOffset: 21, hour: 17, durationH: 4, capacity: 25 },
  ];

  const allSessions: Awaited<ReturnType<typeof prisma.session.create>>[] = [];

  for (const course of courses) {
    for (const cfg of sessionConfigs) {
      const startsAt = new Date(now);
      startsAt.setDate(startsAt.getDate() + cfg.dayOffset);
      startsAt.setHours(cfg.hour, 0, 0, 0);

      const endsAt = new Date(startsAt);
      endsAt.setHours(startsAt.getHours() + cfg.durationH);

      const session = await prisma.session.create({
        data: {
          courseId: course.id,
          startsAt,
          endsAt,
          capacity: cfg.capacity,
        },
      });
      allSessions.push(session);
      console.log(
        `  Session for "${course.title}": ${startsAt.toISOString()} (capacity: ${cfg.capacity})`,
      );
    }
  }

  // 5. Create bookings for the student on various sessions
  console.log("Creating bookings...");

  const sessionsToBook = [
    allSessions[0], // Podstawy testowania – session 1
    allSessions[1], // Podstawy testowania – session 2
    allSessions[3], // Testowanie API – session 1
    allSessions[6], // Automatyzacja testów E2E – session 1
    allSessions[10], // Security testing – session 2
  ];

  for (const session of sessionsToBook) {
    const booking = await prisma.booking.create({
      data: {
        sessionId: session.id,
        userId: student.id,
        status: BookingStatus.CONFIRMED,
      },
    });
    console.log(`  Booking ${booking.id} for session ${session.id}`);
  }

  console.log("\nSeed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
