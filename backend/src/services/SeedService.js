import DatabaseService from './DatabaseService.js';

class SeedService {
    constructor() {
        this.dbService = DatabaseService;
    }

    async seedTestUsers() {
        try {
            const bcrypt = await import('bcryptjs');
            
            // Check if users already exist
            const result = await this.dbService.query('SELECT COUNT(*) as count FROM users');
            if (result.rows[0].count > 0) {
                console.log('Database already has users, skipping seed');
                return;
            }

            console.log('🌱 Seeding test users...');
            
            const testUsers = [
                { email: 'admin@example.com', password: 'Pass@1234', name: 'Admin User', role: 'admin' },
                { email: 'vendor@example.com', password: 'Pass@1234', name: 'Vendor User', role: 'vendor' },
                { email: 'consumer@example.com', password: 'Pass@1234', name: 'Consumer User', role: 'consumer' },
                { email: 'business@example.com', password: 'Pass@1234', name: 'Business User', role: 'business' }
            ];

            for (const user of testUsers) {
                const hashedPassword = await bcrypt.default.hash(user.password, 10);
                await this.dbService.query(
                    'INSERT INTO users (email, password_hash, name, role, verified) VALUES ($1, $2, $3, $4, $5)',
                    [user.email, hashedPassword, user.name, user.role, true]
                );
                console.log(`Created: ${user.name} (${user.role})`);
            }
            
            console.log('Test users seeded successfully');
        } catch (error) {
            console.error('Failed to seed test users:', error.message);
            // Don't throw - this is optional
        }
    }
}

export default new SeedService();