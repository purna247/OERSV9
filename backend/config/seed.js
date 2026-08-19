// Run with: node config/seed.js
const bcrypt = require('bcrypt');
require('dotenv').config();

const db = require('./db');

async function seed() {
  // Step 1 — Seed default programs so FK constraints don't fail on first upload
  const programs = [
    ['BTECH_CSE', 'B.Tech', 'Computer Science & Engineering'],
    ['BTECH_ECE', 'B.Tech', 'Electronics & Communication Engineering'],
    ['BTECH_MECH', 'B.Tech', 'Mechanical Engineering'],
    ['BTECH_CIVIL', 'B.Tech', 'Civil Engineering'],
    ['BTECH_EE', 'B.Tech', 'Electrical Engineering'],
    ['BTECH_IT', 'B.Tech', 'Information Technology'],
    ['BTECH_CSAIML', 'B.Tech', 'Computer Science (AI & ML)'],
    ['BTECH_RAI', 'B.Tech', 'Robotics & Artificial Intelligence'],
    ['BTECH_BT', 'B.Tech', 'Biotechnology'],
    ['BTECH_EIE', 'B.Tech', 'Electronics & Instrumentation Engineering'],
    ['BTECH_TE', 'B.Tech', 'Textile Engineering'],
    ['BARCH', 'B.Arch', 'Architecture'],
    ['BPLAN', 'B.Plan', 'Planning'],
    ['IMSC_PHY', 'Int. M.Sc', 'Physics'],
    ['IMSC_CHEM', 'Int. M.Sc', 'Chemistry'],
    ['IMSC_MATH', 'Int. M.Sc', 'Mathematics & Computing'],
  ];

  for (const [code, degree, branch] of programs) {
    await db.query(
      `
      INSERT INTO programs (program_code, degree_type, branch_name)
      VALUES ($1, $2, $3)
      ON CONFLICT (program_code) DO NOTHING
    `,
      [code, degree, branch],
    );
  }

  // Step 2 — Seed Super Admin (credentials from .env)
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || 'Super Admin';

  if (!adminEmail || !adminPassword) {
    // eslint-disable-next-line no-console
    console.error('❌  ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env before seeding.');
    process.exit(1);
  }

  const rounds = Number.parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
  const hash = await bcrypt.hash(adminPassword, rounds);
  await db.query(
    `
    INSERT INTO users (name, email, password_hash, role)
    VALUES ($1, $2, $3, 'admin')
    ON CONFLICT (email) DO NOTHING
  `,
    [adminName, adminEmail, hash],
  );

  // eslint-disable-next-line no-console
  console.log(`✅  Seed complete. Login with ${adminEmail} / ${adminPassword}`);
  process.exit(0);
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed:', err);
  process.exit(1);
});

