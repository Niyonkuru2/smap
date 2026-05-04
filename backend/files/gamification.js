/**
 * Gamification System Module - Backend
 * Points, badges, leaderboards, and rewards
 */

import { db } from './database.js';

// Initialize gamification tables
export async function initializeGamificationTables() {
    await db.query(`
        -- User points and levels
        CREATE TABLE IF NOT EXISTS user_points (
            id SERIAL PRIMARY KEY,
            user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            total_points INTEGER DEFAULT 0,
            current_level INTEGER DEFAULT 1,
            streak_days INTEGER DEFAULT 0,
            last_activity_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Point transactions log
        CREATE TABLE IF NOT EXISTS point_transactions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            points INTEGER NOT NULL,
            action_type VARCHAR(100) NOT NULL,
            description TEXT,
            reference_id INTEGER,
            reference_type VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Badge definitions
        CREATE TABLE IF NOT EXISTS badge_definitions (
            id SERIAL PRIMARY KEY,
            code VARCHAR(100) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            icon VARCHAR(100),
            category VARCHAR(50), -- 'contribution', 'engagement', 'achievement', 'special'
            points_reward INTEGER DEFAULT 0,
            condition_type VARCHAR(100),
            condition_value INTEGER,
            rarity VARCHAR(20) DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- User badges (earned)
        CREATE TABLE IF NOT EXISTS user_badges (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            badge_id INTEGER REFERENCES badge_definitions(id) ON DELETE CASCADE,
            earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, badge_id)
        );

        -- Leaderboard cache
        CREATE TABLE IF NOT EXISTS leaderboard_cache (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            period VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'alltime'
            category VARCHAR(50), -- 'points', 'submissions', 'verifications'
            rank INTEGER,
            score INTEGER,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, period, category)
        );

        -- Challenges/Quests
        CREATE TABLE IF NOT EXISTS challenges (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            challenge_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'special'
            action_required VARCHAR(100) NOT NULL,
            target_count INTEGER DEFAULT 1,
            points_reward INTEGER NOT NULL,
            badge_reward_id INTEGER REFERENCES badge_definitions(id),
            start_date TIMESTAMP,
            end_date TIMESTAMP,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(title, challenge_type)
        );

        -- User challenge progress
        CREATE TABLE IF NOT EXISTS user_challenges (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE,
            current_progress INTEGER DEFAULT 0,
            is_completed BOOLEAN DEFAULT FALSE,
            completed_at TIMESTAMP,
            claimed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, challenge_id)
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_point_transactions_user ON point_transactions(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
        CREATE INDEX IF NOT EXISTS idx_leaderboard_period ON leaderboard_cache(period, category);

        -- Vendor compatibility tables (trust score + vendor hooks)
        CREATE TABLE IF NOT EXISTS vendor_points (
            id SERIAL PRIMARY KEY,
            vendor_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            total_points INTEGER DEFAULT 0,
            lifetime_points INTEGER DEFAULT 0,
            current_streak INTEGER DEFAULT 0,
            longest_streak INTEGER DEFAULT 0,
            last_submission_date DATE,
            total_submissions INTEGER DEFAULT 0,
            approved_submissions INTEGER DEFAULT 0,
            flagged_submissions INTEGER DEFAULT 0,
            verifications_received INTEGER DEFAULT 0,
            trust_score DECIMAL(5,2) DEFAULT 50.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS vendor_badges (
            id SERIAL PRIMARY KEY,
            vendor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            badge_id VARCHAR(50) NOT NULL,
            earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(vendor_id, badge_id)
        );

        CREATE TABLE IF NOT EXISTS vendor_points_log (
            id SERIAL PRIMARY KEY,
            vendor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            points INTEGER NOT NULL,
            reason VARCHAR(100) NOT NULL,
            reference_id INTEGER,
            reference_type VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_vendor_points_vendor_id ON vendor_points(vendor_id);
        CREATE INDEX IF NOT EXISTS idx_vendor_points_log_vendor_id ON vendor_points_log(vendor_id);
        CREATE INDEX IF NOT EXISTS idx_vendor_badges_vendor_id ON vendor_badges(vendor_id);
    `);

    // Seed default badges if not exists
    await seedDefaultBadges();
    await seedDefaultChallenges();
}

// Seed default badges
async function seedDefaultBadges() {
    const badges = [
        // Contribution badges
        { code: 'first_price', name: 'Price Pioneer', description: 'Submit your first price', icon: 'price_tag', category: 'contribution', points_reward: 50, condition_type: 'price_submissions', condition_value: 1, rarity: 'common' },
        { code: 'price_collector_10', name: 'Price Collector', description: 'Submit 10 prices', icon: 'collection', category: 'contribution', points_reward: 100, condition_type: 'price_submissions', condition_value: 10, rarity: 'common' },
        { code: 'price_master_50', name: 'Price Master', description: 'Submit 50 prices', icon: 'master', category: 'contribution', points_reward: 250, condition_type: 'price_submissions', condition_value: 50, rarity: 'rare' },
        { code: 'price_legend_100', name: 'Price Legend', description: 'Submit 100 prices', icon: 'legend', category: 'contribution', points_reward: 500, condition_type: 'price_submissions', condition_value: 100, rarity: 'epic' },
        
        // Verification badges
        { code: 'verifier', name: 'Price Verifier', description: 'Verify 5 prices', icon: 'check', category: 'contribution', points_reward: 75, condition_type: 'verifications', condition_value: 5, rarity: 'common' },
        { code: 'trusted_verifier', name: 'Trusted Verifier', description: 'Verify 25 prices', icon: 'shield_check', category: 'contribution', points_reward: 200, condition_type: 'verifications', condition_value: 25, rarity: 'rare' },
        
        // Accuracy badges
        { code: 'accurate_reporter', name: 'Accurate Reporter', description: '90% of your prices were approved', icon: 'target', category: 'achievement', points_reward: 150, condition_type: 'accuracy_rate', condition_value: 90, rarity: 'rare' },
        
        // Engagement badges
        { code: 'daily_visitor', name: 'Daily Visitor', description: 'Log in 7 days in a row', icon: 'calendar', category: 'engagement', points_reward: 100, condition_type: 'login_streak', condition_value: 7, rarity: 'common' },
        { code: 'dedicated_user', name: 'Dedicated User', description: 'Log in 30 days in a row', icon: 'fire', category: 'engagement', points_reward: 300, condition_type: 'login_streak', condition_value: 30, rarity: 'rare' },
        { code: 'market_explorer', name: 'Market Explorer', description: 'Submit prices from 5 different markets', icon: 'map', category: 'engagement', points_reward: 150, condition_type: 'unique_markets', condition_value: 5, rarity: 'rare' },
        
        // Special badges
        { code: 'early_bird', name: 'Early Bird', description: 'Submit a price before 7 AM', icon: 'sunrise', category: 'special', points_reward: 50, condition_type: 'early_submission', condition_value: 7, rarity: 'common' },
        { code: 'night_owl', name: 'Night Owl', description: 'Submit a price after 10 PM', icon: 'moon', category: 'special', points_reward: 50, condition_type: 'late_submission', condition_value: 22, rarity: 'common' },
        { code: 'founding_member', name: 'Founding Member', description: 'One of the first 100 users', icon: 'star', category: 'special', points_reward: 500, condition_type: 'user_number', condition_value: 100, rarity: 'legendary' },
    ];

    for (const badge of badges) {
        await db.query(`
            INSERT INTO badge_definitions (code, name, description, icon, category, points_reward, condition_type, condition_value, rarity)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (code) DO NOTHING
        `, [badge.code, badge.name, badge.description, badge.icon, badge.category, badge.points_reward, badge.condition_type, badge.condition_value, badge.rarity]);
    }
}

// Seed default challenges
async function seedDefaultChallenges() {
    // The unique constraint is already defined in the CREATE TABLE statement
    // No need to add it again via ALTER TABLE
    const challenges = [
        { title: 'Daily Price Reporter', description: 'Submit 3 prices today', challenge_type: 'daily', action_required: 'price_submission', target_count: 3, points_reward: 30 },
        { title: 'Verification Helper', description: 'Verify 2 prices today', challenge_type: 'daily', action_required: 'verification', target_count: 2, points_reward: 20 },
        { title: 'Weekly Explorer', description: 'Submit prices from 3 different markets this week', challenge_type: 'weekly', action_required: 'unique_market_submission', target_count: 3, points_reward: 100 },
        { title: 'Category Champion', description: 'Submit prices for 5 different product categories this week', challenge_type: 'weekly', action_required: 'unique_category_submission', target_count: 5, points_reward: 150 },
    ];

    for (const challenge of challenges) {
        await db.query(`
            INSERT INTO challenges (title, description, challenge_type, action_required, target_count, points_reward)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (title, challenge_type) DO NOTHING
        `, [challenge.title, challenge.description, challenge.challenge_type, challenge.action_required, challenge.target_count, challenge.points_reward]);
    }
}

// ============ Points System ============

// Point values for different actions
const POINT_VALUES = {
    price_submission: 10,
    price_approved: 15,
    price_verification: 5,
    daily_login: 5,
    streak_bonus: 2, // per day of streak
    badge_earned: 0, // varies by badge
    challenge_completed: 0, // varies by challenge
    referral: 50,
};

// Vendor-focused compatibility constants
export const VENDOR_POINT_VALUES = {
    PRICE_SUBMITTED: 5,
    PRICE_APPROVED: 10,
    PRICE_COMMUNITY_VERIFIED: 3,
    PRICE_FLAGGED_INACCURATE: -5,
    STREAK_7_DAYS: 25,
    STREAK_30_DAYS: 100,
    FIRST_SUBMISSION: 20,
    PROFILE_COMPLETE: 10,
};

export const VENDOR_BADGES = {
    NEW_VENDOR: {
        id: 'new_vendor',
        name: 'New Vendor',
        description: 'Made your first approved submission',
        requirement: { min_points: 0, min_submissions: 1, min_accuracy: 0 },
        perk: 'Profile highlight',
    },
    TRUSTED_VENDOR: {
        id: 'trusted_vendor',
        name: 'Trusted Vendor',
        description: '50+ points with 90%+ accuracy',
        requirement: { min_points: 50, min_submissions: 5, min_accuracy: 90 },
        perk: 'Green checkmark on submissions',
    },
    MARKET_EXPERT: {
        id: 'market_expert',
        name: 'Market Expert',
        description: '200+ points with 30+ submissions',
        requirement: { min_points: 200, min_submissions: 30, min_accuracy: 85 },
        perk: 'Featured on market page',
    },
    PRICE_CHAMPION: {
        id: 'price_champion',
        name: 'Price Champion',
        description: '500+ points with 95%+ accuracy',
        requirement: { min_points: 500, min_submissions: 75, min_accuracy: 95 },
        perk: 'Auto-approval of submissions',
    },
    STREAK_MASTER: {
        id: 'streak_master',
        name: 'Streak Master',
        description: '7-day submission streak',
        requirement: { min_streak: 7 },
        perk: 'Bonus point multiplier',
    },
    COMMUNITY_HERO: {
        id: 'community_hero',
        name: 'Community Hero',
        description: 'Received 50+ community verifications',
        requirement: { min_verifications_received: 50 },
        perk: 'Trusted badge on profile',
    },
};

export const TRUST_SCORE_THRESHOLDS = {
    AUTO_APPROVE: 95,
    FAST_REVIEW: 75,
    STANDARD: 50,
    FLAGGED: 30,
};

export async function awardPoints(userId, actionType, description = '', referenceId = null, referenceType = null) {
    const points = POINT_VALUES[actionType] || 0;
    if (points === 0) return null;

    // Record transaction
    await db.query(
        `INSERT INTO point_transactions (user_id, points, action_type, description, reference_id, reference_type)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, points, actionType, description, referenceId, referenceType]
    );

    // Update user points
    const result = await db.query(`
        INSERT INTO user_points (user_id, total_points, last_activity_date)
        VALUES ($1, $2, CURRENT_DATE)
        ON CONFLICT (user_id) DO UPDATE SET
            total_points = user_points.total_points + $2,
            current_level = GREATEST(user_points.current_level, FLOOR((user_points.total_points + $2) / 500) + 1),
            last_activity_date = CURRENT_DATE,
            updated_at = CURRENT_TIMESTAMP
        RETURNING *
    `, [userId, points]);

    // Check for badge eligibility
    await checkAndAwardBadges(userId, actionType);
    
    // Update challenge progress
    await updateChallengeProgress(userId, actionType);

    return {
        pointsAwarded: points,
        totalPoints: result.rows[0].total_points,
        currentLevel: result.rows[0].current_level
    };
}

export async function getUserPoints(userId) {
    let result = await db.query(
        'SELECT * FROM user_points WHERE user_id = $1',
        [userId]
    );

    if (!result.rows[0]) {
        result = await db.query(
            `INSERT INTO user_points (user_id) VALUES ($1) RETURNING *`,
            [userId]
        );
    }

    return result.rows[0];
}

// ============ Badges ============

export async function checkAndAwardBadges(userId, actionType) {
    // Get user stats
    const stats = await getUserStats(userId);
    
    // Get all badges not yet earned by user
    const unearnedBadges = await db.query(`
        SELECT bd.* FROM badge_definitions bd
        WHERE bd.id NOT IN (
            SELECT badge_id FROM user_badges WHERE user_id = $1
        )
    `, [userId]);

    const newBadges = [];

    for (const badge of unearnedBadges.rows) {
        let earned = false;

        switch (badge.condition_type) {
            case 'price_submissions':
                earned = stats.totalSubmissions >= badge.condition_value;
                break;
            case 'verifications':
                earned = stats.totalVerifications >= badge.condition_value;
                break;
            case 'login_streak':
                earned = stats.currentStreak >= badge.condition_value;
                break;
            case 'unique_markets':
                earned = stats.uniqueMarkets >= badge.condition_value;
                break;
            case 'accuracy_rate':
                earned = stats.accuracyRate >= badge.condition_value;
                break;
            case 'early_submission':
                // Check if last submission was before 7 AM
                earned = stats.hasEarlySubmission;
                break;
            case 'late_submission':
                // Check if last submission was after 10 PM
                earned = stats.hasLateSubmission;
                break;
        }

        if (earned) {
            await awardBadge(userId, badge.id);
            newBadges.push(badge);
            
            // Award bonus points for badge
            if (badge.points_reward > 0) {
                await db.query(
                    `INSERT INTO point_transactions (user_id, points, action_type, description)
                     VALUES ($1, $2, 'badge_earned', $3)`,
                    [userId, badge.points_reward, `Earned badge: ${badge.name}`]
                );
                await db.query(
                    `UPDATE user_points SET total_points = total_points + $2 WHERE user_id = $1`,
                    [userId, badge.points_reward]
                );
            }
        }
    }

    return newBadges;
}

export async function awardBadge(userId, badgeId) {
    try {
        await db.query(
            `INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [userId, badgeId]
        );
        return true;
    } catch (error) {
        return false;
    }
}

export async function getUserBadges(userId) {
    const result = await db.query(`
        SELECT bd.*, ub.earned_at
        FROM user_badges ub
        JOIN badge_definitions bd ON ub.badge_id = bd.id
        WHERE ub.user_id = $1
        ORDER BY ub.earned_at DESC
    `, [userId]);
    return result.rows;
}

export async function getAllBadges() {
    const result = await db.query(
        'SELECT * FROM badge_definitions ORDER BY category, rarity, name'
    );
    return result.rows;
}

// ============ Leaderboards ============

export async function getLeaderboard(period = 'weekly', category = 'points', limit = 10) {
    let dateFilter = '';
    switch (period) {
        case 'daily':
            dateFilter = "AND pt.created_at >= CURRENT_DATE";
            break;
        case 'weekly':
            dateFilter = "AND pt.created_at >= CURRENT_DATE - INTERVAL '7 days'";
            break;
        case 'monthly':
            dateFilter = "AND pt.created_at >= CURRENT_DATE - INTERVAL '30 days'";
            break;
        default:
            dateFilter = '';
    }

    const result = await db.query(`
        SELECT u.id, u.name, u.role,
               SUM(pt.points) as score,
               COUNT(DISTINCT CASE WHEN pt.action_type = 'price_submission' THEN pt.id END) as submissions,
               RANK() OVER (ORDER BY SUM(pt.points) DESC) as rank
        FROM users u
        LEFT JOIN point_transactions pt ON u.id = pt.user_id ${dateFilter}
        GROUP BY u.id, u.name, u.role
        HAVING SUM(pt.points) > 0
        ORDER BY score DESC
        LIMIT $1
    `, [limit]);

    return {
        period,
        category,
        leaders: result.rows.map(row => ({
            rank: parseInt(row.rank),
            userId: row.id,
            name: row.name,
            role: row.role,
            score: parseInt(row.score || 0),
            submissions: parseInt(row.submissions || 0)
        }))
    };
}

export async function getUserRank(userId, period = 'weekly') {
    let dateFilter = '';
    switch (period) {
        case 'daily':
            dateFilter = "AND pt.created_at >= CURRENT_DATE";
            break;
        case 'weekly':
            dateFilter = "AND pt.created_at >= CURRENT_DATE - INTERVAL '7 days'";
            break;
        case 'monthly':
            dateFilter = "AND pt.created_at >= CURRENT_DATE - INTERVAL '30 days'";
            break;
    }

    const result = await db.query(`
        WITH rankings AS (
            SELECT u.id, SUM(pt.points) as score,
                   RANK() OVER (ORDER BY SUM(pt.points) DESC) as rank
            FROM users u
            LEFT JOIN point_transactions pt ON u.id = pt.user_id ${dateFilter}
            GROUP BY u.id
            HAVING SUM(pt.points) > 0
        )
        SELECT * FROM rankings WHERE id = $1
    `, [userId]);

    return result.rows[0] || { rank: null, score: 0 };
}

// ============ Challenges ============

export async function getActiveChallenges(userId) {
    const result = await db.query(`
        SELECT c.*, 
               COALESCE(uc.current_progress, 0) as progress,
               COALESCE(uc.is_completed, FALSE) as is_completed,
               uc.claimed_at
        FROM challenges c
        LEFT JOIN user_challenges uc ON c.id = uc.challenge_id AND uc.user_id = $1
        WHERE c.is_active = TRUE
          AND (c.end_date IS NULL OR c.end_date > NOW())
        ORDER BY c.challenge_type, c.points_reward DESC
    `, [userId]);
    return result.rows;
}

export async function updateChallengeProgress(userId, actionType) {
    // Find matching challenges
    const challenges = await db.query(`
        SELECT c.* FROM challenges c
        WHERE c.is_active = TRUE
          AND c.action_required = $1
          AND (c.end_date IS NULL OR c.end_date > NOW())
    `, [actionType]);

    for (const challenge of challenges.rows) {
        await db.query(`
            INSERT INTO user_challenges (user_id, challenge_id, current_progress)
            VALUES ($1, $2, 1)
            ON CONFLICT (user_id, challenge_id) DO UPDATE SET
                current_progress = user_challenges.current_progress + 1,
                is_completed = (user_challenges.current_progress + 1) >= $3,
                completed_at = CASE 
                    WHEN (user_challenges.current_progress + 1) >= $3 AND user_challenges.completed_at IS NULL 
                    THEN CURRENT_TIMESTAMP 
                    ELSE user_challenges.completed_at 
                END
        `, [userId, challenge.id, challenge.target_count]);
    }
}

export async function claimChallengeReward(userId, challengeId) {
    const result = await db.query(`
        UPDATE user_challenges 
        SET claimed_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND challenge_id = $2 AND is_completed = TRUE AND claimed_at IS NULL
        RETURNING *
    `, [userId, challengeId]);

    if (!result.rows[0]) {
        return { success: false, error: 'Challenge not completed or already claimed' };
    }

    // Get challenge details and award points
    const challenge = await db.query('SELECT * FROM challenges WHERE id = $1', [challengeId]);
    if (challenge.rows[0]) {
        await db.query(
            `INSERT INTO point_transactions (user_id, points, action_type, description)
             VALUES ($1, $2, 'challenge_completed', $3)`,
            [userId, challenge.rows[0].points_reward, `Completed: ${challenge.rows[0].title}`]
        );
        await db.query(
            `UPDATE user_points SET total_points = total_points + $2 WHERE user_id = $1`,
            [userId, challenge.rows[0].points_reward]
        );

        // Award badge if applicable
        if (challenge.rows[0].badge_reward_id) {
            await awardBadge(userId, challenge.rows[0].badge_reward_id);
        }
    }

    return { success: true, pointsAwarded: challenge.rows[0]?.points_reward || 0 };
}

// ============ User Stats ============

export async function getUserStats(userId) {
    const stats = await db.query(`
        SELECT 
            (SELECT COUNT(*) FROM prices WHERE vendor_id = $1) as total_submissions,
            (SELECT COUNT(*) FROM prices WHERE vendor_id = $1 AND status = 'approved') as approved_submissions,
            (SELECT COUNT(DISTINCT market_id) FROM prices WHERE vendor_id = $1) as unique_markets,
            (SELECT COUNT(DISTINCT category) FROM prices p JOIN products pr ON p.product_id = pr.id WHERE p.vendor_id = $1) as unique_categories,
            (SELECT streak_days FROM user_points WHERE user_id = $1) as current_streak,
            (SELECT COUNT(*) FROM user_badges WHERE user_id = $1) as badges_earned
    `, [userId]);

    const s = stats.rows[0] || {};
    
    return {
        totalSubmissions: parseInt(s.total_submissions || 0),
        approvedSubmissions: parseInt(s.approved_submissions || 0),
        uniqueMarkets: parseInt(s.unique_markets || 0),
        uniqueCategories: parseInt(s.unique_categories || 0),
        currentStreak: parseInt(s.current_streak || 0),
        badgesEarned: parseInt(s.badges_earned || 0),
        accuracyRate: s.total_submissions > 0 
            ? Math.round((s.approved_submissions / s.total_submissions) * 100) 
            : 0,
        totalVerifications: 0, // Add if you have verification tracking
        hasEarlySubmission: false,
        hasLateSubmission: false
    };
}

// ============ Vendor Compatibility Layer ============

async function ensureVendorPointsRow(vendorId) {
    await db.query(
        `INSERT INTO vendor_points (vendor_id) VALUES ($1) ON CONFLICT (vendor_id) DO NOTHING`,
        [vendorId]
    );
}

export async function awardVendorPoints(vendorId, points, reason, referenceId = null, referenceType = null) {
    await ensureVendorPointsRow(vendorId);

    await db.query(
        `INSERT INTO vendor_points_log (vendor_id, points, reason, reference_id, reference_type)
         VALUES ($1, $2, $3, $4, $5)`,
        [vendorId, points, reason, referenceId, referenceType]
    );

    await db.query(
        `UPDATE vendor_points
         SET total_points = GREATEST(0, total_points + $2),
             lifetime_points = lifetime_points + GREATEST(0, $2),
             updated_at = CURRENT_TIMESTAMP
         WHERE vendor_id = $1`,
        [vendorId, points]
    );

    await recalculateVendorTrustScore(vendorId);
    const newBadges = await checkAndAwardVendorBadges(vendorId);

    return { points, newBadges };
}

export async function updateVendorStreak(vendorId) {
    await ensureVendorPointsRow(vendorId);

    const { rows } = await db.query(
        `SELECT current_streak, longest_streak, last_submission_date
         FROM vendor_points
         WHERE vendor_id = $1`,
        [vendorId]
    );

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let currentStreak = 1;
    let longestStreak = 1;
    let bonusAwarded = false;

    if (rows.length > 0) {
        const row = rows[0];
        const lastDate = row.last_submission_date
            ? new Date(row.last_submission_date).toISOString().split('T')[0]
            : null;

        if (lastDate === today) {
            return { currentStreak: row.current_streak || 1, longestStreak: row.longest_streak || 1, bonusAwarded: false };
        }

        if (lastDate === yesterday) {
            currentStreak = (row.current_streak || 0) + 1;
        }

        longestStreak = Math.max(currentStreak, row.longest_streak || 0);
    }

    await db.query(
        `UPDATE vendor_points
         SET current_streak = $1,
             longest_streak = $2,
             last_submission_date = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE vendor_id = $4`,
        [currentStreak, longestStreak, today, vendorId]
    );

    if (currentStreak === 7) {
        await awardVendorPoints(vendorId, VENDOR_POINT_VALUES.STREAK_7_DAYS, 'streak_7_days_bonus', null, 'streak');
        bonusAwarded = true;
    } else if (currentStreak === 30) {
        await awardVendorPoints(vendorId, VENDOR_POINT_VALUES.STREAK_30_DAYS, 'streak_30_days_bonus', null, 'streak');
        bonusAwarded = true;
    }

    return { currentStreak, longestStreak, bonusAwarded };
}

export async function onPriceSubmitted(vendorId, priceId) {
    await ensureVendorPointsRow(vendorId);
    const before = await getVendorStats(vendorId);

    const result = await awardVendorPoints(
        vendorId,
        VENDOR_POINT_VALUES.PRICE_SUBMITTED,
        'price_submitted',
        priceId,
        'price'
    );

    if ((before.total_submissions || 0) === 0) {
        await awardVendorPoints(
            vendorId,
            VENDOR_POINT_VALUES.FIRST_SUBMISSION,
            'first_submission_bonus',
            priceId,
            'price'
        );
    }

    await updateVendorStreak(vendorId);

    await db.query(
        `UPDATE vendor_points
         SET total_submissions = total_submissions + 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE vendor_id = $1`,
        [vendorId]
    );

    return result;
}

export async function onPriceApproved(vendorId, priceId) {
    await ensureVendorPointsRow(vendorId);
    const result = await awardVendorPoints(
        vendorId,
        VENDOR_POINT_VALUES.PRICE_APPROVED,
        'price_approved',
        priceId,
        'price'
    );

    await db.query(
        `UPDATE vendor_points
         SET approved_submissions = approved_submissions + 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE vendor_id = $1`,
        [vendorId]
    );

    await recalculateVendorTrustScore(vendorId);
    return result;
}

export async function onPriceFlagged(vendorId, priceId) {
    await ensureVendorPointsRow(vendorId);
    const result = await awardVendorPoints(
        vendorId,
        VENDOR_POINT_VALUES.PRICE_FLAGGED_INACCURATE,
        'price_flagged_inaccurate',
        priceId,
        'price'
    );

    await db.query(
        `UPDATE vendor_points
         SET flagged_submissions = flagged_submissions + 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE vendor_id = $1`,
        [vendorId]
    );

    await recalculateVendorTrustScore(vendorId);
    return result;
}

export async function onCommunityVerification(vendorId, priceId) {
    await ensureVendorPointsRow(vendorId);
    const result = await awardVendorPoints(
        vendorId,
        VENDOR_POINT_VALUES.PRICE_COMMUNITY_VERIFIED,
        'community_verification_received',
        priceId,
        'verification'
    );

    await db.query(
        `UPDATE vendor_points
         SET verifications_received = verifications_received + 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE vendor_id = $1`,
        [vendorId]
    );

    return result;
}

export async function recalculateVendorTrustScore(vendorId) {
    await ensureVendorPointsRow(vendorId);
    const { rows } = await db.query(
        `SELECT total_points, total_submissions, approved_submissions, flagged_submissions
         FROM vendor_points
         WHERE vendor_id = $1`,
        [vendorId]
    );

    if (!rows.length) return 50;

    const row = rows[0];
    const totalSubmissions = Number(row.total_submissions || 0);
    const approvedSubmissions = Number(row.approved_submissions || 0);
    const flaggedSubmissions = Number(row.flagged_submissions || 0);
    const totalPoints = Number(row.total_points || 0);

    const accuracyScore = totalSubmissions > 0
        ? Math.max(0, ((approvedSubmissions - flaggedSubmissions) / totalSubmissions) * 100)
        : 50;

    const pointsScore = totalPoints > 0
        ? Math.min(100, (Math.log10(totalPoints + 1) / Math.log10(1001)) * 100)
        : 0;

    const activityScore = Math.min(100, totalSubmissions);

    const trustScore = (accuracyScore * 0.5) + (pointsScore * 0.3) + (activityScore * 0.2);
    const rounded = Math.round(trustScore * 100) / 100;

    await db.query(
        `UPDATE vendor_points SET trust_score = $1, updated_at = CURRENT_TIMESTAMP WHERE vendor_id = $2`,
        [rounded, vendorId]
    );

    return rounded;
}

export async function getVendorReviewTier(vendorId) {
    await ensureVendorPointsRow(vendorId);
    const { rows } = await db.query(
        `SELECT trust_score FROM vendor_points WHERE vendor_id = $1`,
        [vendorId]
    );

    const score = rows.length ? parseFloat(rows[0].trust_score) : 50;

    if (score >= TRUST_SCORE_THRESHOLDS.AUTO_APPROVE) return 'auto_approve';
    if (score >= TRUST_SCORE_THRESHOLDS.FAST_REVIEW) return 'fast_review';
    if (score >= TRUST_SCORE_THRESHOLDS.STANDARD) return 'standard';
    return 'flagged';
}

export async function getVendorStats(vendorId) {
    await ensureVendorPointsRow(vendorId);
    const { rows } = await db.query(
        `SELECT
            vp.*,
            CASE WHEN vp.total_submissions > 0
                THEN ROUND((vp.approved_submissions::DECIMAL / vp.total_submissions) * 100, 1)
                ELSE 0
            END AS accuracy_pct,
            u.name AS vendor_name,
            u.market_id
         FROM vendor_points vp
         JOIN users u ON u.id = vp.vendor_id
         WHERE vp.vendor_id = $1`,
        [vendorId]
    );

    return rows[0] || {
        total_points: 0,
        lifetime_points: 0,
        current_streak: 0,
        longest_streak: 0,
        total_submissions: 0,
        approved_submissions: 0,
        flagged_submissions: 0,
        verifications_received: 0,
        trust_score: 50,
        accuracy_pct: 0,
    };
}

export async function getVendorBadges(vendorId) {
    const { rows } = await db.query(
        `SELECT badge_id, earned_at
         FROM vendor_badges
         WHERE vendor_id = $1
         ORDER BY earned_at ASC`,
        [vendorId]
    );

    const badgeById = Object.values(VENDOR_BADGES).reduce((acc, badge) => {
        acc[badge.id] = badge;
        return acc;
    }, {});

    return rows
        .map((row) => ({
            ...(badgeById[row.badge_id] || {}),
            earned_at: row.earned_at,
        }))
        .filter((badge) => Boolean(badge.id));
}

export async function checkAndAwardVendorBadges(vendorId) {
    const stats = await getVendorStats(vendorId);
    const { rows: existingRows } = await db.query(
        `SELECT badge_id FROM vendor_badges WHERE vendor_id = $1`,
        [vendorId]
    );

    const existing = new Set(existingRows.map((row) => row.badge_id));
    const newBadges = [];

    for (const badge of Object.values(VENDOR_BADGES)) {
        if (existing.has(badge.id)) continue;

        const req = badge.requirement || {};
        let earned = true;

        if (req.min_points !== undefined && Number(stats.total_points || 0) < req.min_points) earned = false;
        if (req.min_submissions !== undefined && Number(stats.total_submissions || 0) < req.min_submissions) earned = false;
        if (req.min_accuracy !== undefined && Number(stats.accuracy_pct || 0) < req.min_accuracy) earned = false;
        if (req.min_streak !== undefined && Number(stats.longest_streak || 0) < req.min_streak) earned = false;
        if (req.min_verifications_received !== undefined && Number(stats.verifications_received || 0) < req.min_verifications_received) earned = false;

        if (earned) {
            await db.query(
                `INSERT INTO vendor_badges (vendor_id, badge_id)
                 VALUES ($1, $2)
                 ON CONFLICT (vendor_id, badge_id) DO NOTHING`,
                [vendorId, badge.id]
            );
            newBadges.push(badge);
        }
    }

    return newBadges;
}

export async function getVendorPointsHistory(vendorId, limit = 20) {
    const { rows } = await db.query(
        `SELECT points, reason, reference_id, reference_type, created_at
         FROM vendor_points_log
         WHERE vendor_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [vendorId, limit]
    );
    return rows;
}

export async function getVendorLeaderboard(limit = 10, marketId = null) {
    const params = [limit];
    let marketClause = '';

    if (marketId) {
        params.push(marketId);
        marketClause = `AND u.market_id = $2`;
    }

    const { rows } = await db.query(
        `SELECT
            u.id AS vendor_id,
            u.name AS vendor_name,
            u.market_id,
            vp.total_points,
            vp.trust_score,
            vp.total_submissions,
            vp.current_streak,
            CASE WHEN vp.total_submissions > 0
                THEN ROUND((vp.approved_submissions::DECIMAL / vp.total_submissions) * 100, 1)
                ELSE 0
            END AS accuracy_pct,
            RANK() OVER (ORDER BY vp.total_points DESC) AS rank
         FROM vendor_points vp
         JOIN users u ON u.id = vp.vendor_id
         WHERE u.role = 'vendor'
         ${marketClause}
         ORDER BY vp.total_points DESC
         LIMIT $1`,
        params
    );

    const results = await Promise.all(
        rows.map(async (row) => ({
            ...row,
            badges: await getVendorBadges(row.vendor_id),
        }))
    );

    return results;
}

export function getBadgeProgress(stats, badge) {
    const req = badge.requirement || {};
    const checks = [];

    if (req.min_points !== undefined) checks.push({ label: 'Points', current: Number(stats.total_points || 0), target: req.min_points });
    if (req.min_submissions !== undefined) checks.push({ label: 'Submissions', current: Number(stats.total_submissions || 0), target: req.min_submissions });
    if (req.min_accuracy !== undefined) checks.push({ label: 'Accuracy %', current: Number(stats.accuracy_pct || 0), target: req.min_accuracy });
    if (req.min_streak !== undefined) checks.push({ label: 'Streak days', current: Number(stats.longest_streak || 0), target: req.min_streak });
    if (req.min_verifications_received !== undefined) checks.push({ label: 'Verifications', current: Number(stats.verifications_received || 0), target: req.min_verifications_received });

    const overallPct = checks.length
        ? Math.round(
            checks.reduce((acc, c) => acc + Math.min(100, (c.current / c.target) * 100), 0) /
                checks.length
        )
        : 0;

    return { checks, overallPct };
}

export async function getVendorGamificationProfile(vendorId) {
    const [stats, badges, history, reviewTier] = await Promise.all([
        getVendorStats(vendorId),
        getVendorBadges(vendorId),
        getVendorPointsHistory(vendorId, 10),
        getVendorReviewTier(vendorId),
    ]);

    const earnedIds = new Set(badges.map((badge) => badge.id));
    const nextBadge = Object.values(VENDOR_BADGES).find((badge) => !earnedIds.has(badge.id)) || null;

    return {
        stats,
        badges,
        recentActivity: history,
        reviewTier,
        nextBadge,
        badgeProgress: nextBadge ? getBadgeProgress(stats, nextBadge) : null,
    };
}

// ============ API Routes ============

export function setupGamificationRoutes(app, authMiddleware) {
    // Get user gamification profile
    app.get('/api/gamification/profile', authMiddleware, async (req, res) => {
        try {
            const [points, badges, stats, rank] = await Promise.all([
                getUserPoints(req.user.id),
                getUserBadges(req.user.id),
                getUserStats(req.user.id),
                getUserRank(req.user.id)
            ]);

            res.json({
                success: true,
                points,
                badges,
                stats,
                rank: {
                    weekly: rank
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get leaderboard
    app.get('/api/gamification/leaderboard', async (req, res) => {
        try {
            const { period = 'weekly', category = 'points', limit = 10 } = req.query;
            const leaderboard = await getLeaderboard(period, category, parseInt(limit));
            res.json({ success: true, ...leaderboard });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get all badges
    app.get('/api/gamification/badges', async (req, res) => {
        try {
            const badges = await getAllBadges();
            res.json({ success: true, badges });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get user badges
    app.get('/api/gamification/badges/mine', authMiddleware, async (req, res) => {
        try {
            const badges = await getUserBadges(req.user.id);
            res.json({ success: true, badges });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get challenges
    app.get('/api/gamification/challenges', authMiddleware, async (req, res) => {
        try {
            const challenges = await getActiveChallenges(req.user.id);
            res.json({ success: true, challenges });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Claim challenge reward
    app.post('/api/gamification/challenges/:id/claim', authMiddleware, async (req, res) => {
        try {
            const result = await claimChallengeReward(req.user.id, req.params.id);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Point history
    app.get('/api/gamification/points/history', authMiddleware, async (req, res) => {
        try {
            const { limit = 20, offset = 0 } = req.query;
            const result = await db.query(
                `SELECT * FROM point_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
                [req.user.id, parseInt(limit), parseInt(offset)]
            );
            res.json({ success: true, transactions: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
}

export default {
    initializeGamificationTables,
    awardPoints,
    awardVendorPoints,
    getUserPoints,
    checkAndAwardBadges,
    checkAndAwardVendorBadges,
    awardBadge,
    getUserBadges,
    getVendorBadges,
    getAllBadges,
    getLeaderboard,
    getVendorLeaderboard,
    getUserRank,
    getActiveChallenges,
    updateChallengeProgress,
    claimChallengeReward,
    getUserStats,
    getVendorStats,
    getVendorPointsHistory,
    getVendorGamificationProfile,
    recalculateVendorTrustScore,
    getVendorReviewTier,
    updateVendorStreak,
    onPriceSubmitted,
    onPriceApproved,
    onPriceFlagged,
    onCommunityVerification,
    setupGamificationRoutes,
    POINT_VALUES,
    VENDOR_POINT_VALUES,
    VENDOR_BADGES,
    TRUST_SCORE_THRESHOLDS
};
