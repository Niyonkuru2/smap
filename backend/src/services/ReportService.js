import DatabaseService from '../services/DatabaseService.js';

class ReportService {
    constructor() {
        this.dbService = DatabaseService;
    }

    async generatePriceTrendReport(productId, startDate, endDate) {
        const result = await this.dbService.query(
            `SELECT 
                DATE_TRUNC('day', p.created_at) as date,
                AVG(p.price) as avg_price,
                MIN(p.price) as min_price,
                MAX(p.price) as max_price,
                COUNT(p.id) as submission_count,
                m.name as market_name
             FROM prices p
             JOIN markets m ON p.market_id = m.id
             WHERE p.product_id = $1 
               AND p.status = 'approved'
               AND p.created_at BETWEEN $2 AND $3
               AND p.price > 0
             GROUP BY DATE_TRUNC('day', p.created_at), m.name
             ORDER BY date ASC`,
            [productId, startDate, endDate]
        );
        
        return {
            product_id: productId,
            period: { startDate, endDate },
            data: result.rows,
            summary: {
                overall_avg: result.rows.reduce((sum, row) => sum + parseFloat(row.avg_price), 0) / (result.rows.length || 1),
                total_submissions: result.rows.reduce((sum, row) => sum + parseInt(row.submission_count), 0),
                markets_covered: [...new Set(result.rows.map(row => row.market_name))].length
            }
        };
    }

    async generateVendorPerformanceReport(startDate, endDate) {
        const result = await this.dbService.query(
            `SELECT 
                u.id as vendor_id,
                u.name as vendor_name,
                u.email,
                COUNT(DISTINCT p.id) as total_submissions,
                SUM(CASE WHEN p.status = 'approved' THEN 1 ELSE 0 END) as approved_count,
                SUM(CASE WHEN p.status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
                AVG(CASE WHEN pa.resolved_at IS NOT NULL 
                    THEN EXTRACT(EPOCH FROM (pa.resolved_at - pa.submitted_at))/3600 
                    ELSE NULL END) as avg_response_hours,
                COUNT(DISTINCT a.id) as total_ads,
                SUM(a.clicks_count) as total_ad_clicks,
                us.status as subscription_status,
                sp.name as subscription_plan
             FROM users u
             LEFT JOIN prices p ON u.id = p.vendor_id AND p.created_at BETWEEN $1 AND $2
             LEFT JOIN pending_approvals pa ON pa.entity_id = p.id AND pa.entity_type = 'price'
             LEFT JOIN vendor_advertisements a ON u.id = a.vendor_id
             LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
             LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
             WHERE u.role = 'vendor'
             GROUP BY u.id, u.name, u.email, us.status, sp.name
             ORDER BY total_submissions DESC`,
            [startDate, endDate]
        );
        
        return {
            period: { startDate, endDate },
            vendors: result.rows,
            summary: {
                total_vendors: result.rows.length,
                active_subscriptions: result.rows.filter(r => r.subscription_status === 'active').length,
                total_submissions: result.rows.reduce((sum, r) => sum + parseInt(r.total_submissions), 0),
                avg_approval_rate: result.rows.reduce((sum, r) => {
                    const total = parseInt(r.total_submissions);
                    if (total === 0) return sum;
                    return sum + (parseInt(r.approved_count) / total);
                }, 0) / (result.rows.length || 1) * 100
            }
        };
    }

    async generateSubscriptionRevenueReport() {
        const result = await this.dbService.query(
            `SELECT 
                DATE_TRUNC('month', created_at) as month,
                COUNT(*) as total_subscriptions,
                SUM(amount_paid) as total_revenue,
                AVG(amount_paid) as avg_revenue_per_subscription,
                sp.name as plan_name
             FROM user_subscriptions us
             JOIN subscription_plans sp ON us.plan_id = sp.id
             WHERE status = 'active' OR status = 'expired'
             GROUP BY DATE_TRUNC('month', created_at), sp.name
             ORDER BY month DESC, plan_name`
        );
        
        return {
            monthly_data: result.rows,
            yearly_total: result.rows.reduce((sum, row) => sum + parseFloat(row.total_revenue), 0),
            average_monthly: result.rows.reduce((sum, row) => sum + parseFloat(row.total_revenue), 0) / 12
        };
    }

    async generateMarketAnalysisReport(province = null, district = null) {
        let query = `
            SELECT 
                m.province,
                m.district,
                m.name as market_name,
                COUNT(DISTINCT p.product_id) as unique_products,
                AVG(p.price) as avg_price,
                MIN(p.price) as min_price,
                MAX(p.price) as max_price,
                COUNT(DISTINCT p.vendor_id) as active_vendors,
                COUNT(DISTINCT f.user_id) as consumer_interest_count
             FROM markets m
             LEFT JOIN prices p ON m.id = p.market_id AND p.status = 'approved'
             LEFT JOIN favorites f ON m.id = f.market_id
             WHERE 1=1
        `;
        
        const params = [];
        if (province) {
            query += ` AND m.province = $${params.length + 1}`;
            params.push(province);
        }
        if (district) {
            query += ` AND m.district = $${params.length + 1}`;
            params.push(district);
        }
        
        query += ` GROUP BY m.province, m.district, m.name
                   ORDER BY m.province, m.district, avg_price DESC`;
        
        const result = await this.dbService.query(query, params);
        
        return {
            filters: { province, district },
            markets: result.rows,
            summary: {
                total_markets: result.rows.length,
                avg_market_price: result.rows.reduce((sum, row) => sum + parseFloat(row.avg_price), 0) / (result.rows.length || 1),
                total_products_tracked: result.rows.reduce((sum, row) => sum + parseInt(row.unique_products), 0),
                total_vendors: result.rows.reduce((sum, row) => sum + parseInt(row.active_vendors), 0)
            }
        };
    }
}

export default new ReportService();