import bcrypt from 'bcryptjs';
import { query, getDb } from '../db';

async function main() {
  const newPassword = process.argv[2];
  if (!newPassword || newPassword.length < 6) {
    console.error('❌ Error: Please provide a valid password of at least 6 characters.');
    console.log('Usage: npm run change-password <new_password>');
    process.exit(1);
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(newPassword, salt);

  const res = await query(
    'UPDATE admin_users SET password_hash = $1 WHERE username = $2 RETURNING username',
    [hash, 'admin']
  );

  if (res.rowCount === 0) {
    // If admin record doesn't exist yet, insert it
    await query(
      'INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)',
      ['admin', hash]
    );
    console.log('✅ Admin user created with the new password!');
  } else {
    console.log('✅ Admin password updated successfully for user "admin"!');
  }

  await getDb().close();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Failed to update password:', err);
  process.exit(1);
});
