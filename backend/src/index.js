import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================
// ENV LOADING
// ============================================

const shouldLoadEnv =
    !process.env.PORT || process.env.NODE_ENV !== 'production';

if (shouldLoadEnv) {
    dotenv.config({ path: join(__dirname, '..', '.env') });
}

console.log('Environment: NODE_ENV =', process.env.NODE_ENV);
console.log('Database URL set:', !!process.env.DATABASE_URL);

// ============================================
// IMPORT MIDDLEWARE
// ============================================

import { corsOptions } from './middleware/cors.js';
import { securityMiddleware, rateLimitMiddleware } from './middleware/security.js';
import { auditMiddleware } from './middleware/audit.js';
import { paginationMiddleware } from './middleware/pagination.js';
import { performanceMiddleware } from './middleware/performance.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { validateRequest } from './middleware/validation.js';

// ============================================
// SERVICES
// ============================================

import DatabaseService from './services/DatabaseService.js';
import EmailService from './services/EmailService.js';
import { initializeWebSocket } from './websocket/index.js';
import { monitorConnectionPool } from './services/PerformanceService.js';

// ============================================
// ROUTES + DB
// ============================================

import router from './routes/index.js';
import pool, { getPool } from './config/database.js';

// ============================================
// APP INIT
// ============================================

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// GLOBAL FIXES (IMPORTANT)
// ============================================

// 1. Handle favicon silently (prevents fake 404 errors)
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

// ============================================
// MIDDLEWARE SETUP (ORDER MATTERS)
// ============================================

// 1. CORS
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// 2. Performance tracking
app.use(performanceMiddleware);

// 3. Security
app.use(securityMiddleware);
app.use(rateLimitMiddleware);

// 4. Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// 5. Audit logs
app.use(auditMiddleware({ logAllRequests: false }));

// 6. Pagination
app.use(paginationMiddleware(20, 100));

// ============================================
// HEALTH & DIAGNOSTIC
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
// ============================================
// ERROR HANDLING (MUST BE LAST)
// ============================================

app.use(notFoundHandler);
app.use(errorHandler);

// ============================================
// SERVER STARTUP
// ============================================

async function startServer() {
    try {
        // DB connection test
        const connected = await DatabaseService.testConnection();

        if (!connected) {
            console.error('Cannot start server without database connection');
            process.exit(1);
        }

        // Init DB
        await DatabaseService.initializeDatabase();

        // Start HTTP server
        const server = app.listen(PORT, () => {
            console.log('========================================');
            console.log(`Backend running on port ${PORT}`);
            console.log(`Email: ${EmailService.isConfigured() ? 'Configured' : 'Not configured'}`);
            console.log(`Database: PostgreSQL`);
            console.log(`All systems ready`);
            console.log('========================================');
        });

        // WebSocket
        initializeWebSocket(server);

        // Pool monitoring
        monitorConnectionPool(pool, 30000);

        // ============================================
        // GRACEFUL SHUTDOWN
        // ============================================

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

        // ============================================
        // EMAIL SAFETY (ADDED FIX)
        // prevents Gmail crash from stopping server
        // ============================================

        try {
            if (EmailService?.testConnection) {
                await EmailService.testConnection();
            }
        } catch (err) {
            console.error('Email service warning (non-fatal):', err.message);
        }

    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
}

startServer();

// ============================================
// EXPORTS
// ============================================

export default app;
export { pool, getPool };