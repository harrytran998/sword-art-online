/**
 * Sword Art Online — Development Seed Script
 *
 * Usage: bun run scripts/seed.ts
 *
 * Seeds the database with test data for local development.
 */

import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/sao",
});

async function seed() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Create test accounts
    const accounts = [
      {
        email: "kirito@sao.online",
        username: "Kirito",
        password_hash: "$2b$10$placeholder_hash_kirito",
      },
      {
        email: "asuna@sao.online",
        username: "Asuna",
        password_hash: "$2b$10$placeholder_hash_asuna",
      },
      {
        email: "klein@sao.online",
        username: "Klein",
        password_hash: "$2b$10$placeholder_hash_klein",
      },
    ];

    const accountIds: string[] = [];

    for (const account of accounts) {
      const result = await client.query(
        `INSERT INTO sao.accounts (email, username, password_hash)
         VALUES ($1, $2, $3)
         ON CONFLICT (email) DO UPDATE SET username = EXCLUDED.username
         RETURNING id`,
        [account.email, account.username, account.password_hash],
      );
      accountIds.push(result.rows[0].id);
    }

    // Create characters for each account
    const characters = [
      {
        accountIdx: 0,
        name: "Kirito",
        level: 78,
        experience: 2450000,
        max_hp: 14500,
        current_hp: 14500,
        col: 89500,
        current_floor: 74,
      },
      {
        accountIdx: 1,
        name: "Asuna",
        level: 75,
        experience: 2280000,
        max_hp: 12800,
        current_hp: 12800,
        col: 125000,
        current_floor: 74,
      },
      {
        accountIdx: 2,
        name: "Klein",
        level: 62,
        experience: 1560000,
        max_hp: 10200,
        current_hp: 10200,
        col: 45300,
        current_floor: 55,
      },
    ];

    const charIds: string[] = [];

    for (const char of characters) {
      const result = await client.query(
        `INSERT INTO sao.characters
         (account_id, name, level, experience, max_hp, current_hp, col, current_floor)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (name) DO UPDATE SET level = EXCLUDED.level
         RETURNING id`,
        [
          accountIds[char.accountIdx],
          char.name,
          char.level,
          char.experience,
          char.max_hp,
          char.current_hp,
          char.col,
          char.current_floor,
        ],
      );
      charIds.push(result.rows[0].id);
    }

    // Create stats for each character
    const stats = [
      {
        charIdx: 0,
        str: 85,
        agi: 92,
        vit: 70,
        dex: 78,
        int: 45,
        lck: 60,
      },
      {
        charIdx: 1,
        str: 65,
        agi: 95,
        vit: 60,
        dex: 88,
        int: 55,
        lck: 50,
      },
      {
        charIdx: 2,
        str: 78,
        agi: 55,
        vit: 82,
        dex: 50,
        int: 35,
        lck: 40,
      },
    ];

    for (const stat of stats) {
      await client.query(
        `INSERT INTO sao.character_stats
         (character_id, str, agi, vit, dex, int, lck)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (character_id) DO UPDATE SET
           str = EXCLUDED.str, agi = EXCLUDED.agi, vit = EXCLUDED.vit,
           dex = EXCLUDED.dex, int = EXCLUDED.int, lck = EXCLUDED.lck`,
        [
          charIds[stat.charIdx],
          stat.str,
          stat.agi,
          stat.vit,
          stat.dex,
          stat.int,
          stat.lck,
        ],
      );
    }

    await client.query("COMMIT");
    console.log("Seed complete: 3 accounts, 3 characters, 3 stat blocks");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
