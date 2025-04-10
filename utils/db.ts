import { Pool } from 'pg';
import { Message } from '../types/chat';

// Create a database connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'earthai_db',
  user: process.env.DB_USER || 'earthai_user',
  password: process.env.DB_PASSWORD || 'dev_password_123',
});

// Initialize the database (create tables if they don't exist)
export async function initializeDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    // Create chat_sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id SERIAL PRIMARY KEY,
        session_id UUID NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        message_id UUID NOT NULL UNIQUE,
        session_id UUID NOT NULL,
        role VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id) ON DELETE CASCADE
      )
    `);

    // Create user_preferences table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL UNIQUE,
        default_location JSONB,
        default_zoom INTEGER,
        theme VARCHAR(20) DEFAULT 'light',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Save a message to the database
export async function saveMessage(
  sessionId: string,
  messageId: string,
  role: string,
  content: string
): Promise<void> {
  try {
    // Check if session exists, if not create it
    const sessionResult = await pool.query(
      'SELECT session_id FROM chat_sessions WHERE session_id = $1',
      [sessionId]
    );

    if (sessionResult.rowCount === 0) {
      await pool.query(
        'INSERT INTO chat_sessions (session_id) VALUES ($1)',
        [sessionId]
      );
    }

    // Insert the message
    await pool.query(
      'INSERT INTO messages (message_id, session_id, role, content) VALUES ($1, $2, $3, $4)',
      [messageId, sessionId, role, content]
    );
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
}

// Get messages for a specific session
export async function getMessages(sessionId: string): Promise<Message[]> {
  try {
    const result = await pool.query(
      'SELECT message_id as id, role, content, timestamp FROM messages WHERE session_id = $1 ORDER BY timestamp ASC',
      [sessionId]
    );

    return result.rows.map(row => ({
      id: row.id,
      role: row.role as 'user' | 'assistant',
      content: row.content,
      timestamp: row.timestamp
    }));
  } catch (error) {
    console.error('Error retrieving messages:', error);
    throw error;
  }
} 