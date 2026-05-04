import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function runMigrations() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Testing database connection...');
        await client.query('SELECT 1');
        console.log('✅ Database connected successfully!\n');
        
        // Try multiple possible paths for the schema file
        const possiblePaths = [
            join(__dirname, '..', 'schema.sql'),
            join(__dirname, '..', 'database_schema.sql'),
            join(__dirname, '..', 'migrations', 'schema.sql'),
            join(process.cwd(), 'schema.sql'),
        ];
        
        let schemaPath = null;
        for (const path of possiblePaths) {
            if (existsSync(path)) {
                schemaPath = path;
                break;
            }
        }
        
        if (!schemaPath) {
            console.error('❌ Schema file not found. Tried paths:');
            possiblePaths.forEach(p => console.error(`   - ${p}`));
            process.exit(1);
        }
        
        console.log(`📖 Reading migration file from: ${schemaPath}`);
        const schema = readFileSync(schemaPath, 'utf8');
        
        console.log('🚀 Running migrations...\n');
        
        // Begin transaction
        await client.query('BEGIN');
        
        try {
            // Execute the entire schema as one command
            // This preserves the order and handles dependencies correctly
            await client.query(schema);
            console.log('✓ All statements executed successfully');
            
            // Commit transaction
            await client.query('COMMIT');
            console.log('\n✅ Migration completed successfully!');
            
        } catch (err) {
            // Rollback on error
            await client.query('ROLLBACK');
            console.error('\n❌ Migration failed:', err.message);
            console.error('   Please check your schema.sql file for errors.');
            process.exit(1);
        }
        
        // Verify tables were created
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        console.log(`\n📊 Tables in database (${tables.rows.length} total):`);
        tables.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });
        
        // Verify data was seeded
        const productCount = await client.query('SELECT COUNT(*) FROM products');
        const marketCount = await client.query('SELECT COUNT(*) FROM markets');
        const planCount = await client.query('SELECT COUNT(*) FROM subscription_plans');
        
        console.log(`\n📈 Data counts:`);
        console.log(`   - Products: ${productCount.rows[0].count}`);
        console.log(`   - Markets: ${marketCount.rows[0].count}`);
        console.log(`   - Subscription Plans: ${planCount.rows[0].count}`);
        
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigrations();