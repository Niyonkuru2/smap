import { catchAsync } from '../middleware/errorHandler.js';
import pool from '../config/database.js';

// Get all anomalies with filters
export const getAnomalies = catchAsync(async (req, res) => {
    const { 
        severity, 
        status, 
        anomalyType, 
        vendorId,
        productId,
        marketId,
        limit = 50,
        offset = 0 
    } = req.query;
    
    let query = `
        SELECT 
            pa.*,
            p.name as product_name,
            m.name as market_name,
            u.name as vendor_name,
            rp.price as reference_price_value,
            json_build_object(
                'id', u.id,
                'name', u.name,
                'email', u.email
            ) as vendor_info,
            json_build_object(
                'id', p.id,
                'name', p.name,
                'unit', p.unit
            ) as product_info,
            json_build_object(
                'id', m.id,
                'name', m.name,
                'province', m.province,
                'district', m.district
            ) as market_info
        FROM price_anomalies pa
        LEFT JOIN products p ON pa.product_id = p.id
        LEFT JOIN markets m ON pa.market_id = m.id
        LEFT JOIN users u ON pa.vendor_id = u.id
        LEFT JOIN reference_prices rp ON pa.reference_price_id = rp.id
        WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (severity && severity !== 'all') {
        query += ` AND pa.severity = $${paramIndex}`;
        params.push(severity);
        paramIndex++;
    }
    
    if (status && status !== 'all') {
        query += ` AND pa.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
    }
    
    if (anomalyType && anomalyType !== 'all') {
        query += ` AND pa.anomaly_type = $${paramIndex}`;
        params.push(anomalyType);
        paramIndex++;
    }
    
    if (vendorId) {
        query += ` AND pa.vendor_id = $${paramIndex}`;
        params.push(parseInt(vendorId));
        paramIndex++;
    }
    
    if (productId) {
        query += ` AND pa.product_id = $${paramIndex}`;
        params.push(parseInt(productId));
        paramIndex++;
    }
    
    if (marketId) {
        query += ` AND pa.market_id = $${paramIndex}`;
        params.push(marketId);
        paramIndex++;
    }
    
    query += ` ORDER BY pa.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = `SELECT COUNT(*) FROM price_anomalies WHERE 1=1`;
    const countParams = [];
    let countIndex = 1;
    
    if (severity && severity !== 'all') {
        countQuery += ` AND severity = $${countIndex}`;
        countParams.push(severity);
        countIndex++;
    }
    
    if (status && status !== 'all') {
        countQuery += ` AND status = $${countIndex}`;
        countParams.push(status);
        countIndex++;
    }
    
    const countResult = await pool.query(countQuery, countParams);
    
    res.json({
        success: true,
        anomalies: result.rows,
        pagination: {
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        }
    });
});

// Get single anomaly details
export const getAnomalyById = catchAsync(async (req, res) => {
    const { id } = req.params;
    
    const query = `
        SELECT 
            pa.*,
            p.name as product_name,
            m.name as market_name,
            u.name as vendor_name,
            u.email as vendor_email,
            u.phone as vendor_phone,
            rp.price as reference_price_value,
            rp.effective_date as reference_effective_date,
            assigned_user.name as assigned_to_name,
            resolved_user.name as resolved_by_name
        FROM price_anomalies pa
        LEFT JOIN products p ON pa.product_id = p.id
        LEFT JOIN markets m ON pa.market_id = m.id
        LEFT JOIN users u ON pa.vendor_id = u.id
        LEFT JOIN reference_prices rp ON pa.reference_price_id = rp.id
        LEFT JOIN users assigned_user ON pa.assigned_to = assigned_user.id
        LEFT JOIN users resolved_user ON pa.resolved_by = resolved_user.id
        WHERE pa.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Anomaly not found' });
    }
    
    // Get resolution history
    const historyQuery = `
        SELECT 
            arh.*,
            u.name as performed_by_name
        FROM anomaly_resolution_history arh
        LEFT JOIN users u ON arh.performed_by = u.id
        WHERE arh.anomaly_id = $1
        ORDER BY arh.created_at DESC
    `;
    
    const historyResult = await pool.query(historyQuery, [id]);
    
    res.json({
        success: true,
        anomaly: result.rows[0],
        history: historyResult.rows
    });
});

// Update anomaly status - FIXED VERSION
export const updateAnomalyStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;
    
    // Validate status
    const validStatuses = ['new', 'investigating', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
            success: false, 
            message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        });
    }
    
    // Start transaction
    await pool.query('BEGIN');
    
    try {
        // Get current anomaly
        const currentQuery = await pool.query(
            'SELECT status, vendor_id, severity, price_id FROM price_anomalies WHERE id = $1',
            [id]
        );
        
        if (currentQuery.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Anomaly not found' });
        }
        
        const current = currentQuery.rows[0];
        
        // Prepare notes - ensure consistent type (NULL or string)
        const notesValue = (resolutionNotes && typeof resolutionNotes === 'string' && resolutionNotes.trim() !== '') 
            ? resolutionNotes.trim() 
            : null;
        
        let updateResult;
        
        // Handle different status updates separately to avoid type inconsistency
        if (status === 'resolved') {
            const updateQuery = `
                UPDATE price_anomalies 
                SET 
                    status = $1,
                    resolved_by = $2,
                    resolved_at = NOW(),
                    resolution_notes = $3,
                    updated_at = NOW()
                WHERE id = $4
                RETURNING *
            `;
            const result = await pool.query(updateQuery, [status, req.user.id, notesValue, id]);
            updateResult = result;
        } 
        else if (status === 'dismissed') {
            const updateQuery = `
                UPDATE price_anomalies 
                SET 
                    status = $1,
                    resolved_by = $2,
                    resolved_at = NOW(),
                    resolution_notes = $3,
                    updated_at = NOW()
                WHERE id = $4
                RETURNING *
            `;
            const result = await pool.query(updateQuery, [status, req.user.id, notesValue, id]);
            updateResult = result;
        }
        else if (status === 'investigating') {
            const updateQuery = `
                UPDATE price_anomalies 
                SET 
                    status = $1,
                    assigned_at = COALESCE(assigned_at, NOW()),
                    updated_at = NOW()
                WHERE id = $2
                RETURNING *
            `;
            const result = await pool.query(updateQuery, [status, id]);
            updateResult = result;
        }
        else {
            // 'new' status or any other
            const updateQuery = `
                UPDATE price_anomalies 
                SET 
                    status = $1,
                    updated_at = NOW()
                WHERE id = $2
                RETURNING *
            `;
            const result = await pool.query(updateQuery, [status, id]);
            updateResult = result;
        }
        
        if (updateResult.rows.length === 0) {
            throw new Error('Failed to update anomaly');
        }
        
        // Record in history
        const historyQuery = `
            INSERT INTO anomaly_resolution_history (
                anomaly_id, action, notes, performed_by, 
                previous_status, new_status
            ) VALUES ($1, $2, $3, $4, $5, $6)
        `;
        
        let action = status;
        if (status === 'resolved') action = 'resolved';
        else if (status === 'dismissed') action = 'dismissed';
        else if (status === 'investigating') action = 'assigned';
        
        await pool.query(historyQuery, [
            parseInt(id),
            action,
            notesValue,
            req.user.id,
            current.status,
            status
        ]);
        
        // Update price record if resolving/dismissing
        if (status === 'resolved' && current.price_id) {
            await pool.query(`
                UPDATE prices 
                SET status = 'approved', 
                    flagged = false,
                    approved_by = $1,
                    approved_at = NOW()
                WHERE id = $2
            `, [req.user.id, current.price_id]);
        } 
        else if (status === 'dismissed' && current.price_id) {
            await pool.query(`
                UPDATE prices 
                SET status = 'rejected', 
                    rejected_by = $1,
                    rejected_at = NOW(),
                    rejection_reason = $2
                WHERE id = $3
            `, [req.user.id, notesValue || 'Price anomaly confirmed', current.price_id]);
        }
        
        await pool.query('COMMIT');
        
        res.json({
            success: true,
            anomaly: updateResult.rows[0],
            message: `Anomaly ${status} successfully`
        });
        
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error updating anomaly status:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to update anomaly status' 
        });
    }
});

// Assign anomaly to admin
export const assignAnomaly = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { assignedTo } = req.body;
    
    const query = `
        UPDATE price_anomalies 
        SET 
            assigned_to = $1,
            assigned_at = NOW(),
            status = 'investigating',
            updated_at = NOW()
        WHERE id = $2
        RETURNING *
    `;
    
    const result = await pool.query(query, [assignedTo, id]);
    
    if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Anomaly not found' });
    }
    
    // Record in history
    await pool.query(`
        INSERT INTO anomaly_resolution_history (
            anomaly_id, action, notes, performed_by, 
            previous_status, new_status
        ) VALUES ($1, 'assigned', $2, $3, $4, 'investigating')
    `, [id, `Assigned to user ${assignedTo}`, req.user.id, result.rows[0].status]);
    
    res.json({
        success: true,
        anomaly: result.rows[0],
        message: 'Anomaly assigned successfully'
    });
});

// Get anomaly statistics
export const getAnomalyStats = catchAsync(async (req, res) => {
    const result = await pool.query(`
        SELECT 
            COALESCE(SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END), 0) as critical_count,
            COALESCE(SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END), 0) as high_count,
            COALESCE(SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END), 0) as medium_count,
            COALESCE(SUM(CASE WHEN severity = 'low' THEN 1 ELSE 0 END), 0) as low_count,
            COALESCE(SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END), 0) as new_count,
            COALESCE(SUM(CASE WHEN status = 'investigating' THEN 1 ELSE 0 END), 0) as investigating_count,
            COALESCE(SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END), 0) as resolved_count,
            COALESCE(SUM(CASE WHEN status = 'dismissed' THEN 1 ELSE 0 END), 0) as dismissed_count,
            COUNT(*) as total_anomalies
        FROM price_anomalies
    `);
    
    // Get additional breakdowns
    const breakdown = await pool.query(`
        SELECT 
            severity,
            status,
            anomaly_type,
            COUNT(*) as count
        FROM price_anomalies
        GROUP BY severity, status, anomaly_type
        ORDER BY severity DESC, status
    `);
    
    // Get top vendors with anomalies
    const topVendors = await pool.query(`
        SELECT 
            u.name,
            COALESCE(vas.total_anomalies, 0) as total_anomalies,
            COALESCE(vas.trust_score, 100) as trust_score,
            COALESCE(vas.critical_anomalies, 0) as critical_anomalies,
            COALESCE(vas.high_anomalies, 0) as high_anomalies
        FROM users u
        LEFT JOIN vendor_anomaly_scores vas ON vas.vendor_id = u.id
        WHERE u.role = 'vendor'
        ORDER BY COALESCE(vas.total_anomalies, 0) DESC
        LIMIT 10
    `);
    
    const stats = result.rows[0];
    
    res.json({
        success: true,
        stats: {
            total_anomalies: parseInt(stats.total_anomalies) || 0,
            critical_count: parseInt(stats.critical_count) || 0,
            high_count: parseInt(stats.high_count) || 0,
            medium_count: parseInt(stats.medium_count) || 0,
            low_count: parseInt(stats.low_count) || 0,
            resolved_count: parseInt(stats.resolved_count) || 0,
            investigating_count: parseInt(stats.investigating_count) || 0,
            new_count: parseInt(stats.new_count) || 0,
            dismissed_count: parseInt(stats.dismissed_count) || 0,
            avg_resolution_time_hours: 0
        },
        breakdown: breakdown.rows,
        topVendors: topVendors.rows
    });
});

// Get vendor anomaly summary
export const getVendorAnomalySummary = catchAsync(async (req, res) => {
    const { vendorId } = req.params;
    
    // Get vendor info
    const vendorQuery = await pool.query(
        'SELECT name FROM users WHERE id = $1 AND role = $2',
        [parseInt(vendorId), 'vendor']
    );
    
    if (vendorQuery.rows.length === 0) {
        return res.json({
            success: true,
            data: {
                vendor_name: null,
                total_anomalies: 0,
                trust_score: 100,
                recent_anomalies: []
            }
        });
    }
    
    // Get anomaly stats
    const statsQuery = await pool.query(`
        SELECT 
            COUNT(*) as total_anomalies,
            COALESCE(AVG(deviation_percentage), 0) as avg_deviation
        FROM price_anomalies
        WHERE vendor_id = $1
    `, [parseInt(vendorId)]);
    
    // Get trust score
    const trustQuery = await pool.query(`
        SELECT trust_score 
        FROM vendor_anomaly_scores 
        WHERE vendor_id = $1
    `, [parseInt(vendorId)]);
    
    // Get recent anomalies
    const recentQuery = await pool.query(`
        SELECT 
            pa.id,
            pa.severity,
            pa.deviation_percentage,
            pa.status,
            pa.created_at,
            p.name as product_name
        FROM price_anomalies pa
        JOIN products p ON pa.product_id = p.id
        WHERE pa.vendor_id = $1
        ORDER BY pa.created_at DESC
        LIMIT 10
    `, [parseInt(vendorId)]);
    
    res.json({
        success: true,
        data: {
            vendor_name: vendorQuery.rows[0].name,
            total_anomalies: parseInt(statsQuery.rows[0].total_anomalies) || 0,
            trust_score: trustQuery.rows[0]?.trust_score || 100,
            recent_anomalies: recentQuery.rows
        }
    });
});