import { Pool } from "pg";
import bcrypt from "bcryptjs";
import * as readline from "readline";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function changeAdminPassword() {
  const pool = new Pool({ connectionString });

  try {
    rl.question("Enter the admin username to update (e.g., admin): ", async (username) => {
      rl.question("Enter the NEW password: ", async (newPassword) => {
        
        console.log("Updating password...");
        const passwordHash = bcrypt.hashSync(newPassword, 12);
        
        const res = await pool.query(
          "UPDATE admin SET password_hash = $1 WHERE username = $2",
          [passwordHash, username]
        );

        if (res.rowCount === 0) {
          console.log(`Error: Admin user '${username}' not found in the database.`);
        } else {
          console.log(`Success! Password for '${username}' has been updated.`);
          console.log("You can now log in with the new password.");
        }

        await pool.end();
        rl.close();
      });
    });
  } catch (err) {
    console.error("Error updating password:", err);
    await pool.end();
    rl.close();
  }
}

changeAdminPassword();
