/**
 * EasyPhones — Seed file
 * Brands and cities are stored as constants (see src/utils/constants.ts).
 * This seed creates a demo admin user if needed.
 * Run: ts-node src/db/seed.ts
 */
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import pool, { queryOne } from '../config/db';

async function seed() {
  console.log('🌱  Seeding database...');

  // Create a demo user
  const email = 'demo@easyphones.pk';
  const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email]);

  if (!existing) {
    const hash = await bcrypt.hash('demo1234', 12);
    await pool.execute(
      `INSERT INTO users (id, name, email, phone, password_hash) VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), 'Demo User', email, '+923001234567', hash]
    );
    console.log('  ✔  Demo user created — demo@easyphones.pk / demo1234');
  } else {
    console.log('  –  Demo user already exists, skipping.');
  }

  console.log('\n✅  Seed complete.');
  await pool.end();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
