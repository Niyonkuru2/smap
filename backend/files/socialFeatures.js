/**
 * Social Features Module - Backend
 * Comments, Social Sharing, Community Forums
 */

import { db } from './database.js';

// Initialize social tables
export async function initializeSocialTables() {
    await db.query(`
        -- Comments table
        CREATE TABLE IF NOT EXISTS comments (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            target_type VARCHAR(50) NOT NULL, -- 'product', 'market', 'price', 'forum'
            target_id INTEGER NOT NULL,
            parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            likes_count INTEGER DEFAULT 0,
            is_edited BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Comment likes
        CREATE TABLE IF NOT EXISTS comment_likes (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, comment_id)
        );

        -- Forum topics
        CREATE TABLE IF NOT EXISTS forum_topics (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            category VARCHAR(100) NOT NULL,
            market_id VARCHAR(100) REFERENCES markets(id),
            views_count INTEGER DEFAULT 0,
            replies_count INTEGER DEFAULT 0,
            is_pinned BOOLEAN DEFAULT FALSE,
            is_locked BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Shared price links
        CREATE TABLE IF NOT EXISTS shared_links (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            share_type VARCHAR(50) NOT NULL, -- 'price', 'product', 'market', 'comparison'
            share_data JSONB NOT NULL,
            short_code VARCHAR(20) UNIQUE NOT NULL,
            views_count INTEGER DEFAULT 0,
            expires_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- User follows
        CREATE TABLE IF NOT EXISTS user_follows (
            id SERIAL PRIMARY KEY,
            follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(follower_id, following_id)
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_type, target_id);
        CREATE INDEX IF NOT EXISTS idx_forum_topics_category ON forum_topics(category);
        CREATE INDEX IF NOT EXISTS idx_shared_links_code ON shared_links(short_code);
    `);
}

// ============ Comments ============

export async function addComment(userId, targetType, targetId, content, parentId = null) {
    const result = await db.query(
        `INSERT INTO comments (user_id, target_type, target_id, content, parent_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, targetType, targetId, content, parentId]
    );
    return result.rows[0];
}

export async function getComments(targetType, targetId, options = {}) {
    const { page = 1, limit = 20, sortBy = 'newest' } = options;
    const offset = (page - 1) * limit;
    
    let orderBy = 'c.created_at DESC';
    if (sortBy === 'oldest') orderBy = 'c.created_at ASC';
    if (sortBy === 'popular') orderBy = 'c.likes_count DESC, c.created_at DESC';
    
    const result = await db.query(
        `SELECT c.*, u.name as user_name, u.role as user_role,
                (SELECT COUNT(*) FROM comments WHERE parent_id = c.id) as reply_count
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.target_type = $1 AND c.target_id = $2 AND c.parent_id IS NULL
         ORDER BY ${orderBy}
         LIMIT $3 OFFSET $4`,
        [targetType, targetId, limit, offset]
    );
    
    // Get total count
    const countResult = await db.query(
        `SELECT COUNT(*) FROM comments WHERE target_type = $1 AND target_id = $2 AND parent_id IS NULL`,
        [targetType, targetId]
    );
    
    return {
        comments: result.rows,
        total: parseInt(countResult.rows[0].count),
        page,
        totalPages: Math.ceil(countResult.rows[0].count / limit)
    };
}

export async function getReplies(commentId) {
    const result = await db.query(
        `SELECT c.*, u.name as user_name, u.role as user_role
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.parent_id = $1
         ORDER BY c.created_at ASC`,
        [commentId]
    );
    return result.rows;
}

export async function likeComment(userId, commentId) {
    try {
        await db.query(
            `INSERT INTO comment_likes (user_id, comment_id) VALUES ($1, $2)`,
            [userId, commentId]
        );
        await db.query(
            `UPDATE comments SET likes_count = likes_count + 1 WHERE id = $1`,
            [commentId]
        );
        return { success: true, action: 'liked' };
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            // Unlike
            await db.query(
                `DELETE FROM comment_likes WHERE user_id = $1 AND comment_id = $2`,
                [userId, commentId]
            );
            await db.query(
                `UPDATE comments SET likes_count = likes_count - 1 WHERE id = $1`,
                [commentId]
            );
            return { success: true, action: 'unliked' };
        }
        throw error;
    }
}

export async function deleteComment(userId, commentId) {
    const result = await db.query(
        `DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING *`,
        [commentId, userId]
    );
    return result.rows[0] ? { success: true } : { success: false, error: 'Comment not found or unauthorized' };
}

// ============ Forum ============

export async function createForumTopic(userId, title, content, category, marketId = null) {
    const result = await db.query(
        `INSERT INTO forum_topics (user_id, title, content, category, market_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, title, content, category, marketId]
    );
    return result.rows[0];
}

export async function getForumTopics(options = {}) {
    const { category, marketId, page = 1, limit = 20, sortBy = 'newest' } = options;
    const offset = (page - 1) * limit;
    
    let where = [];
    let params = [];
    let paramCount = 0;
    
    if (category) {
        params.push(category);
        paramCount++;
        where.push(`ft.category = $${paramCount}`);
    }
    
    if (marketId) {
        params.push(marketId);
        paramCount++;
        where.push(`ft.market_id = $${paramCount}`);
    }
    
    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    
    let orderBy = 'ft.is_pinned DESC, ft.created_at DESC';
    if (sortBy === 'popular') orderBy = 'ft.is_pinned DESC, ft.views_count DESC';
    if (sortBy === 'active') orderBy = 'ft.is_pinned DESC, ft.updated_at DESC';
    
    params.push(limit, offset);
    
    const result = await db.query(
        `SELECT ft.*, u.name as author_name, u.role as author_role,
                m.name as market_name
         FROM forum_topics ft
         JOIN users u ON ft.user_id = u.id
         LEFT JOIN markets m ON ft.market_id = m.id
         ${whereClause}
         ORDER BY ${orderBy}
         LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
        params
    );
    
    return {
        topics: result.rows,
        page,
        limit
    };
}

export async function getForumTopic(topicId) {
    // Increment views
    await db.query(
        `UPDATE forum_topics SET views_count = views_count + 1 WHERE id = $1`,
        [topicId]
    );
    
    const result = await db.query(
        `SELECT ft.*, u.name as author_name, u.role as author_role,
                m.name as market_name
         FROM forum_topics ft
         JOIN users u ON ft.user_id = u.id
         LEFT JOIN markets m ON ft.market_id = m.id
         WHERE ft.id = $1`,
        [topicId]
    );
    
    return result.rows[0];
}

export async function replyToTopic(userId, topicId, content) {
    const comment = await addComment(userId, 'forum', topicId, content);
    
    // Update replies count
    await db.query(
        `UPDATE forum_topics SET replies_count = replies_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [topicId]
    );
    
    return comment;
}

// ============ Social Sharing ============

function generateShortCode() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export async function createShareLink(userId, shareType, shareData, expiresInDays = 30) {
    const shortCode = generateShortCode();
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
    
    const result = await db.query(
        `INSERT INTO shared_links (user_id, share_type, share_data, short_code, expires_at)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, shareType, JSON.stringify(shareData), shortCode, expiresAt]
    );
    
    return {
        ...result.rows[0],
        shareUrl: `/share/${shortCode}`
    };
}

export async function getSharedLink(shortCode) {
    const result = await db.query(
        `SELECT * FROM shared_links 
         WHERE short_code = $1 AND (expires_at IS NULL OR expires_at > NOW())`,
        [shortCode]
    );
    
    if (result.rows[0]) {
        // Increment views
        await db.query(
            `UPDATE shared_links SET views_count = views_count + 1 WHERE id = $1`,
            [result.rows[0].id]
        );
    }
    
    return result.rows[0];
}

// ============ Social Share Generation ============

export function generateWhatsAppShareText(priceData) {
    const { productName, marketName, price, unit, date } = priceData;
    return encodeURIComponent(
        `🛒 Market Price Update!\n\n` +
        `📦 ${productName}\n` +
        `📍 ${marketName}\n` +
        `💰 ${price} RWF/${unit}\n` +
        `📅 ${date}\n\n` +
        `Check more prices at SMPMPS!`
    );
}

export function generateTwitterShareText(priceData) {
    const { productName, marketName, price, unit } = priceData;
    return encodeURIComponent(
        `${productName} at ${marketName}: ${price} RWF/${unit} 🛒\n\n#RwandaMarket #PriceCheck`
    );
}

export function generateFacebookShareUrl(shareUrl) {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
}

// ============ User Follows ============

export async function followUser(followerId, followingId) {
    if (followerId === followingId) {
        return { success: false, error: 'Cannot follow yourself' };
    }
    
    try {
        await db.query(
            `INSERT INTO user_follows (follower_id, following_id) VALUES ($1, $2)`,
            [followerId, followingId]
        );
        return { success: true, action: 'followed' };
    } catch (error) {
        if (error.code === '23505') {
            await db.query(
                `DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2`,
                [followerId, followingId]
            );
            return { success: true, action: 'unfollowed' };
        }
        throw error;
    }
}

export async function getFollowers(userId) {
    const result = await db.query(
        `SELECT u.id, u.name, u.role, uf.created_at as followed_at
         FROM user_follows uf
         JOIN users u ON uf.follower_id = u.id
         WHERE uf.following_id = $1
         ORDER BY uf.created_at DESC`,
        [userId]
    );
    return result.rows;
}

export async function getFollowing(userId) {
    const result = await db.query(
        `SELECT u.id, u.name, u.role, uf.created_at as followed_at
         FROM user_follows uf
         JOIN users u ON uf.following_id = u.id
         WHERE uf.follower_id = $1
         ORDER BY uf.created_at DESC`,
        [userId]
    );
    return result.rows;
}

export default {
    initializeSocialTables,
    addComment,
    getComments,
    getReplies,
    likeComment,
    deleteComment,
    createForumTopic,
    getForumTopics,
    getForumTopic,
    replyToTopic,
    createShareLink,
    getSharedLink,
    generateWhatsAppShareText,
    generateTwitterShareText,
    generateFacebookShareUrl,
    followUser,
    getFollowers,
    getFollowing
};
