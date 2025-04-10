import { initializeDatabase } from '../utils/db';

async function runInitDb() {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    console.log('Database initialized successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

runInitDb(); 