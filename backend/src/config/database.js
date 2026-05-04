import pg from 'pg';
import dotenv from 'dotenv';

// Only load .env in development
const shouldLoadEnv = !process.env.PORT || process.env.NODE_ENV !== 'production';
if (shouldLoadEnv) {
    dotenv.config();
}

console.log('DATABASE CONFIG:');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('  DB_HOST:', process.env.DB_HOST);

const { Pool } = pg;

const isProduction = process.env.NODE_ENV === 'production';

// Initialize PostgreSQL connection pool
const poolConfig = {
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER || 'smpmps_db_user'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'smpmps_db'}`,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, 
    ssl: isProduction ? { rejectUnauthorized: false } : false
};

const pool = new Pool(poolConfig);
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

// Create db wrapper object for backward compatibility
const db = {
    query: async (text, params) => {
        try {
            return await pool.query(text, params);
        } catch (error) {
            console.error('Database query error:', error.message, 'SQL:', text);
            throw error;
        }
    },
    pool: pool
};

export const getPool = () => pool;
export { db };
export default pool;