// Script to generate proper bcrypt password hashes
const bcrypt = require('bcrypt');

async function generateHashes() {
  console.log('Generating bcrypt password hashes...\n');
  
  const passwords = {
    admin123: await bcrypt.hash('admin123', 10),
    emp123: await bcrypt.hash('emp123', 10),
  };
  
  console.log('Password: admin123');
  console.log('Hash:', passwords.admin123);
  console.log();
  
  console.log('Password: emp123');
  console.log('Hash:', passwords.emp123);
  console.log();
  
  console.log('SQL to update users:');
  console.log(`UPDATE users SET password = '${passwords.admin123}' WHERE email = 'admin@adenc.de';`);
  console.log(`UPDATE users SET password = '${passwords.emp123}' WHERE email = 'max.mueller@adenc.de';`);
  console.log(`UPDATE users SET password = '${passwords.emp123}' WHERE email = 'anna.schmidt@adenc.de';`);
}

generateHashes().catch(console.error);
