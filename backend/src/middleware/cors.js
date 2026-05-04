export const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'https://smpmps-test.onrender.com',
            'https://smpmps-frontend.onrender.com',
            'http://localhost:5173',
            'http://localhost:3000',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:3000',
        ];
        
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        
        if (origin && origin.includes('onrender.com')) {
            console.log('✅ CORS allowed onrender.com origin:', origin);
            callback(null, true);
            return;
        }
        
        console.log('CORS blocked origin:', origin);
        callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400
};