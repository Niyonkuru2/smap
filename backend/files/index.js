import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const shouldLoadEnv = !process.env.PORT || process.env.NODE_ENV !== 'production';
if (shouldLoadEnv) {
    dotenv.config({ path: join(__dirname, '..', '.env') });
}

console.log('Environment: NODE_ENV =', process.env.NODE_ENV);
console.log('Database URL set:', !!process.env.DATABASE_URL);

// Import middleware
import { corsOptions } from './middleware/cors.js';
import { securityMiddleware, rateLimitMiddleware } from './middleware/security.js';
import { auditMiddleware } from './middleware/audit.js';
import { paginationMiddleware } from './middleware/pagination.js';
import { performanceMiddleware } from './middleware/performance.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { validateRequest } from './middleware/validation.js';

// Import services
import DatabaseService from './services/DatabaseService.js';
import EmailService from './services/EmailService.js';
import { initializeWebSocket } from './websocket/index.js';
import { monitorConnectionPool } from './services/PerformanceService.js';

// Import routes
import router from './routes/index.js';

// Import DB for backward compatibility
import pool, { getPool } from './config/database.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARE SETUP (Order matters!)
// ============================================

// 1. CORS
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// 2. Performance tracking
app.use(performanceMiddleware);

// 3. Security headers & rate limiting
app.use(securityMiddleware);
app.use(rateLimitMiddleware);

// 4. Body parsing
app.use(express.json({ limit: '10kb' }));

// 5. Audit logging
app.use(auditMiddleware({ logAllRequests: false }));

// 6. Pagination
app.use(paginationMiddleware(20, 100));

// ============================================
// HEALTH & DIAGNOSTIC ENDPOINTS (Public)
// ============================================

app.get('/', (req, res) => {
    res.json({ 
        message: 'SMPMPS API',
        status: 'running', 
        database: 'PostgreSQL',
        version: '2.0.0',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        database: 'PostgreSQL', 
        email: EmailService.isConfigured() ? 'configured' : 'not configured',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.get('/health/email', (req, res) => {
    res.json(EmailService.getHealthStatus());
});

app.get('/diagnostic', (req, res) => {
    res.json({
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        port: PORT,
        database: 'PostgreSQL configured',
        cors: 'enabled',
        origin: req.get('origin'),
        method: req.method
    });
});

// ============================================
// API ROUTES
// ============================================

app.use('/api', router);

// Also support root-level routes for backward compatibility
app.use('/auth', router);
app.use('/prices', router);
app.use('/markets', router);
app.use('/products', router);
app.use('/favorites', router);
app.use('/alerts', router);
app.use('/notifications', router);
app.use('/admin', router);
app.use('/search', router);
app.use('/export', router);
app.use('/import', router);
app.use('/verify', router);
app.use('/community', router);
app.use('/ratings', router);
app.use('/history', router);
app.use('/trends', router);
app.use('/forecast', router);
app.use('/predict', router);
app.use('/sms', router);
app.use('/ussd', router);
app.use('/seasonal', router);
app.use('/compare', router);
app.use('/searches', router);
app.use('/profile', router);

// ============================================
// ERROR HANDLING (Must be last)
// ============================================

app.use(notFoundHandler);
app.use(errorHandler);

// ============================================
// SERVER STARTUP
// ============================================

async function startServer() {
    try {
        // Test database connection
        const connected = await DatabaseService.testConnection();
        if (!connected) {
            console.error('Cannot start server without database connection');
            process.exit(1);
        }

        // Initialize database tables (runs migrations)
        await DatabaseService.initializeDatabase();
        
        // Start server
        const server = app.listen(PORT, () => {
            console.log('========================================');
            console.log(`Backend running on port ${PORT}`);
            console.log(`Email: ${EmailService.isConfigured() ? 'Configured' : 'Not configured'}`);
            console.log(`Database: PostgreSQL`);
            console.log(`All systems ready`);
            console.log('========================================');
        });
        
        // Initialize WebSocket for real-time events
        initializeWebSocket(server);
        
        // Start connection pool monitoring
        monitorConnectionPool(pool, 30000);
        
        // Graceful shutdown
        const gracefulShutdown = (signal) => {
            console.log(`\n${signal} received. Shutting down gracefully...`);
            server.close(() => {
                console.log('HTTP server closed');
                process.exit(0);
            });
            setTimeout(() => {
                console.error('Forced shutdown');
                process.exit(1);
            }, 10000);
        };
        
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
}

startServer();

export default app;
export { pool, getPool };