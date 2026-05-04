/**
 * Reports & PDF Export Module - Backend
 * Generate price reports, analytics, and PDF exports
 */

import PDFDocument from 'pdfkit';
import { db } from './database.js';

// Generate weekly price report
export async function generateWeeklyReport(marketId = null, category = null) {
    const whereConditions = ["p.status = 'approved'", "p.created_at >= NOW() - INTERVAL '7 days'"];
    const params = [];
    let paramCount = 0;

    if (marketId) {
        paramCount++;
        whereConditions.push(`p.market_id = $${paramCount}`);
        params.push(marketId);
    }

    if (category) {
        paramCount++;
        whereConditions.push(`pr.category = $${paramCount}`);
        params.push(category);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get price data
    const priceData = await db.query(`
        SELECT 
            pr.name as product_name,
            pr.category,
            m.name as market_name,
            AVG(p.price) as avg_price,
            MIN(p.price) as min_price,
            MAX(p.price) as max_price,
            COUNT(*) as data_points
        FROM prices p
        JOIN products pr ON p.product_id = pr.id
        JOIN markets m ON p.market_id = m.id
        WHERE ${whereClause}
        GROUP BY pr.id, pr.name, pr.category, m.id, m.name
        ORDER BY pr.category, pr.name, m.name
    `, params);

    // Get price trends
    const trends = await db.query(`
        SELECT 
            pr.name as product_name,
            DATE(p.created_at) as date,
            AVG(p.price) as avg_price
        FROM prices p
        JOIN products pr ON p.product_id = pr.id
        WHERE p.status = 'approved' AND p.created_at >= NOW() - INTERVAL '7 days'
        GROUP BY pr.id, pr.name, DATE(p.created_at)
        ORDER BY pr.name, date
    `);

    // Calculate summary statistics
    const summary = {
        totalProducts: new Set(priceData.rows.map(r => r.product_name)).size,
        totalMarkets: new Set(priceData.rows.map(r => r.market_name)).size,
        totalDataPoints: priceData.rows.reduce((sum, r) => sum + parseInt(r.data_points), 0),
        periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        periodEnd: new Date().toISOString().split('T')[0]
    };

    // Group by category
    const byCategory = {};
    for (const row of priceData.rows) {
        if (!byCategory[row.category]) {
            byCategory[row.category] = [];
        }
        byCategory[row.category].push({
            product: row.product_name,
            market: row.market_name,
            avgPrice: Math.round(parseFloat(row.avg_price)),
            minPrice: Math.round(parseFloat(row.min_price)),
            maxPrice: Math.round(parseFloat(row.max_price)),
            dataPoints: parseInt(row.data_points)
        });
    }

    return {
        success: true,
        report: {
            title: 'Weekly Price Report',
            generatedAt: new Date().toISOString(),
            summary,
            byCategory,
            trends: trends.rows
        }
    };
}

// Generate market comparison report
export async function generateMarketComparisonReport(productIds = [], marketIds = []) {
    let query = `
        SELECT 
            pr.id as product_id,
            pr.name as product_name,
            m.id as market_id,
            m.name as market_name,
            m.province,
            m.district,
            AVG(p.price) as avg_price,
            MIN(p.price) as min_price,
            MAX(p.price) as max_price,
            COUNT(*) as data_points
        FROM prices p
        JOIN products pr ON p.product_id = pr.id
        JOIN markets m ON p.market_id = m.id
        WHERE p.status = 'approved' AND p.created_at >= NOW() - INTERVAL '30 days'
    `;

    const params = [];
    let paramCount = 0;

    if (productIds.length > 0) {
        paramCount++;
        query += ` AND pr.id = ANY($${paramCount})`;
        params.push(productIds);
    }

    if (marketIds.length > 0) {
        paramCount++;
        query += ` AND m.id = ANY($${paramCount})`;
        params.push(marketIds);
    }

    query += ' GROUP BY pr.id, pr.name, m.id, m.name, m.province, m.district ORDER BY pr.name, avg_price';

    const result = await db.query(query, params);

    // Restructure for comparison
    const comparison = {};
    for (const row of result.rows) {
        if (!comparison[row.product_name]) {
            comparison[row.product_name] = {
                productId: row.product_id,
                markets: []
            };
        }
        comparison[row.product_name].markets.push({
            marketId: row.market_id,
            marketName: row.market_name,
            province: row.province,
            district: row.district,
            avgPrice: Math.round(parseFloat(row.avg_price)),
            minPrice: Math.round(parseFloat(row.min_price)),
            maxPrice: Math.round(parseFloat(row.max_price))
        });
    }

    // Calculate best deals
    const bestDeals = Object.entries(comparison).map(([product, data]) => {
        const markets = data.markets;
        const cheapest = markets[0];
        const mostExpensive = markets[markets.length - 1];
        const savings = mostExpensive.avgPrice - cheapest.avgPrice;
        
        return {
            product,
            cheapestMarket: cheapest.marketName,
            cheapestPrice: cheapest.avgPrice,
            mostExpensiveMarket: mostExpensive.marketName,
            mostExpensivePrice: mostExpensive.avgPrice,
            potentialSavings: savings,
            savingsPercent: Math.round(savings / mostExpensive.avgPrice * 100)
        };
    }).sort((a, b) => b.savingsPercent - a.savingsPercent);

    return {
        success: true,
        report: {
            title: 'Market Comparison Report',
            generatedAt: new Date().toISOString(),
            comparison,
            bestDeals
        }
    };
}

// Generate PDF report
export async function generatePDFReport(reportData, reportType = 'weekly') {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header
            doc.fontSize(24).font('Helvetica-Bold').text('Rwanda Market Price Checker', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(18).font('Helvetica').text(reportData.report.title, { align: 'center' });
            doc.moveDown(0.3);
            doc.fontSize(10).fillColor('#666666').text(
                `Generated: ${new Date(reportData.report.generatedAt).toLocaleString()}`,
                { align: 'center' }
            );
            doc.moveDown(1);

            // Summary section
            if (reportData.report.summary) {
                doc.fontSize(14).fillColor('#000000').font('Helvetica-Bold').text('Summary');
                doc.moveDown(0.3);
                doc.fontSize(10).font('Helvetica');
                
                const summary = reportData.report.summary;
                doc.text(`Period: ${summary.periodStart} to ${summary.periodEnd}`);
                doc.text(`Products Tracked: ${summary.totalProducts}`);
                doc.text(`Markets Covered: ${summary.totalMarkets}`);
                doc.text(`Data Points: ${summary.totalDataPoints}`);
                doc.moveDown(1);
            }

            // Price data by category
            if (reportData.report.byCategory) {
                for (const [category, products] of Object.entries(reportData.report.byCategory)) {
                    doc.fontSize(12).font('Helvetica-Bold').fillColor('#2563eb').text(category);
                    doc.moveDown(0.3);

                    // Table header
                    const tableTop = doc.y;
                    doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
                    doc.text('Product', 50, tableTop);
                    doc.text('Market', 150, tableTop);
                    doc.text('Avg', 280, tableTop);
                    doc.text('Min', 330, tableTop);
                    doc.text('Max', 380, tableTop);

                    doc.moveTo(50, tableTop + 15).lineTo(420, tableTop + 15).stroke();

                    // Table rows
                    let y = tableTop + 20;
                    doc.font('Helvetica').fontSize(9);

                    for (const item of products.slice(0, 20)) { // Limit to prevent overflow
                        if (y > 700) {
                            doc.addPage();
                            y = 50;
                        }

                        doc.text(item.product.substring(0, 18), 50, y);
                        doc.text(item.market.substring(0, 20), 150, y);
                        doc.text(`${item.avgPrice.toLocaleString()}`, 280, y);
                        doc.text(`${item.minPrice.toLocaleString()}`, 330, y);
                        doc.text(`${item.maxPrice.toLocaleString()}`, 380, y);
                        y += 15;
                    }

                    doc.y = y + 10;
                    doc.moveDown(0.5);
                }
            }

            // Best deals section
            if (reportData.report.bestDeals) {
                doc.addPage();
                doc.fontSize(14).font('Helvetica-Bold').fillColor('#16a34a').text('Best Deals - Where to Save');
                doc.moveDown(0.5);

                doc.fontSize(10).font('Helvetica').fillColor('#000000');

                for (const deal of reportData.report.bestDeals.slice(0, 15)) {
                    doc.font('Helvetica-Bold').text(deal.product);
                    doc.font('Helvetica').text(
                        `Buy at ${deal.cheapestMarket} (${deal.cheapestPrice.toLocaleString()} RWF) instead of ` +
                        `${deal.mostExpensiveMarket} (${deal.mostExpensivePrice.toLocaleString()} RWF) - ` +
                        `Save ${deal.savingsPercent}%`
                    );
                    doc.moveDown(0.5);
                }
            }

            // Footer
            doc.fontSize(8).fillColor('#999999').text(
                'This report is generated by Rwanda Market Price Checker. Prices are based on user submissions and may vary.',
                50,
                doc.page.height - 50,
                { align: 'center', width: doc.page.width - 100 }
            );

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

// Generate inflation tracking report
export async function generateInflationReport(months = 6) {
    const result = await db.query(`
        SELECT 
            pr.category,
            DATE_TRUNC('month', p.created_at) as month,
            AVG(p.price) as avg_price
        FROM prices p
        JOIN products pr ON p.product_id = pr.id
        WHERE p.status = 'approved' 
          AND p.created_at >= NOW() - INTERVAL '${months} months'
        GROUP BY pr.category, DATE_TRUNC('month', p.created_at)
        ORDER BY pr.category, month
    `);

    // Calculate month-over-month changes
    const byCategory = {};
    for (const row of result.rows) {
        const cat = row.category;
        if (!byCategory[cat]) {
            byCategory[cat] = [];
        }
        byCategory[cat].push({
            month: row.month,
            avgPrice: parseFloat(row.avg_price)
        });
    }

    // Calculate inflation rates
    const inflationByCategory = {};
    for (const [category, data] of Object.entries(byCategory)) {
        if (data.length >= 2) {
            const rates = [];
            for (let i = 1; i < data.length; i++) {
                const change = ((data[i].avgPrice - data[i - 1].avgPrice) / data[i - 1].avgPrice) * 100;
                rates.push({
                    month: data[i].month,
                    rate: Math.round(change * 100) / 100
                });
            }
            inflationByCategory[category] = {
                monthlyRates: rates,
                averageRate: rates.reduce((sum, r) => sum + r.rate, 0) / rates.length,
                totalChange: ((data[data.length - 1].avgPrice - data[0].avgPrice) / data[0].avgPrice) * 100
            };
        }
    }

    return {
        success: true,
        report: {
            title: 'Price Inflation Report',
            generatedAt: new Date().toISOString(),
            periodMonths: months,
            inflationByCategory
        }
    };
}

// Export routes
export function setupReportRoutes(app) {
    // Weekly report
    app.get('/api/reports/weekly', async (req, res) => {
        try {
            const { marketId, category } = req.query;
            const report = await generateWeeklyReport(marketId, category);
            res.json(report);
        } catch (error) {
            console.error('Weekly report error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Market comparison report
    app.post('/api/reports/comparison', async (req, res) => {
        try {
            const { productIds, marketIds } = req.body;
            const report = await generateMarketComparisonReport(productIds, marketIds);
            res.json(report);
        } catch (error) {
            console.error('Comparison report error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Inflation report
    app.get('/api/reports/inflation', async (req, res) => {
        try {
            const months = parseInt(req.query.months) || 6;
            const report = await generateInflationReport(months);
            res.json(report);
        } catch (error) {
            console.error('Inflation report error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // PDF export
    app.get('/api/reports/pdf/:type', async (req, res) => {
        try {
            const { type } = req.params;
            let reportData;

            switch (type) {
                case 'weekly':
                    reportData = await generateWeeklyReport();
                    break;
                case 'comparison':
                    reportData = await generateMarketComparisonReport();
                    break;
                case 'inflation':
                    reportData = await generateInflationReport();
                    break;
                default:
                    return res.status(400).json({ error: 'Invalid report type' });
            }

            const pdfBuffer = await generatePDFReport(reportData, type);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=market-report-${type}-${Date.now()}.pdf`);
            res.send(pdfBuffer);
        } catch (error) {
            console.error('PDF generation error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
}

export default {
    generateWeeklyReport,
    generateMarketComparisonReport,
    generatePDFReport,
    generateInflationReport,
    setupReportRoutes
};
