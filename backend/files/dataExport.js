/**
 * Data Export Module
 * Export data to CSV and PDF formats
 */

/**
 * Convert array of objects to CSV string
 */
function toCSV(data, columns = null) {
    if (!data || data.length === 0) {
        return '';
    }
    
    // Use provided columns or extract from first object
    const headers = columns || Object.keys(data[0]);
    
    // Create CSV header row
    const headerRow = headers.map(h => `"${h}"`).join(',');
    
    // Create data rows
    const dataRows = data.map(row => {
        return headers.map(header => {
            let value = row[header];
            
            // Handle different types
            if (value === null || value === undefined) {
                value = '';
            } else if (typeof value === 'object') {
                value = JSON.stringify(value);
            } else {
                value = String(value);
            }
            
            // Escape quotes and wrap in quotes
            value = value.replace(/"/g, '""');
            return `"${value}"`;
        }).join(',');
    });
    
    return [headerRow, ...dataRows].join('\n');
}

/**
 * Generate price report CSV
 */
function generatePriceReportCSV(prices, options = {}) {
    const { 
        includeTimestamp = true,
        currency = 'RWF'
    } = options;
    
    const formattedPrices = prices.map(p => ({
        'Product': p.product || p.productName || p.name,
        'Market': p.market || p.marketName,
        'Price': p.price,
        'Currency': currency,
        'Unit': p.unit || 'kg',
        'Category': p.category || 'N/A',
        'Vendor': p.vendorName || 'N/A',
        'Status': p.status || 'approved',
        'Date': p.createdAt || p.date || new Date().toISOString().split('T')[0]
    }));
    
    let csv = toCSV(formattedPrices);
    
    if (includeTimestamp) {
        csv = `# Price Report Generated: ${new Date().toISOString()}\n# Smart Market Price Monitoring and Prediction System (SMPMPS)\n\n${csv}`;
    }
    
    return csv;
}

/**
 * Generate market comparison CSV
 */
function generateMarketComparisonCSV(comparisons) {
    const formatted = comparisons.map(c => ({
        'Market': c.marketId || c.market,
        'Average Price': c.averagePrice,
        'Min Price': c.minPrice,
        'Max Price': c.maxPrice,
        'Latest Price': c.latestPrice,
        'Price Range': c.priceRange,
        'Trend': c.trend,
        'Trend Change (%)': c.trendChange,
        'Rank': c.rank,
        'Is Cheapest': c.isCheapest ? 'Yes' : 'No'
    }));
    
    return toCSV(formatted);
}

/**
 * Generate user activity report CSV
 */
function generateUserActivityCSV(users) {
    const formatted = users.map(u => ({
        'User ID': u.id,
        'Name': u.name,
        'Email': u.email,
        'Role': u.role,
        'Province': u.province || 'N/A',
        'District': u.district || 'N/A',
        'Verified': u.verified ? 'Yes' : 'No',
        'Created At': u.createdAt || u.created_at
    }));
    
    return toCSV(formatted);
}

/**
 * Generate simple HTML report (can be converted to PDF)
 */
function generateHTMLReport(title, data, options = {}) {
    const {
        subtitle = '',
        columns = null,
        footer = 'SMPMPS',
        currency = 'RWF'
    } = options;
    
    const headers = columns || (data.length > 0 ? Object.keys(data[0]) : []);
    
    const tableRows = data.map(row => {
        const cells = headers.map(h => {
            let value = row[h];
            if (value === null || value === undefined) value = '-';
            if (typeof value === 'number' && h.toLowerCase().includes('price')) {
                value = `${value.toLocaleString()} ${currency}`;
            }
            return `<td style="padding: 8px; border: 1px solid #ddd;">${value}</td>`;
        }).join('');
        return `<tr>${cells}</tr>`;
    }).join('');
    
    const headerCells = headers.map(h => 
        `<th style="padding: 10px; border: 1px solid #ddd; background: #1E88E5; color: white;">${h}</th>`
    ).join('');
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        .header { background: linear-gradient(135deg, #1E88E5 0%, #2ECC71 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .header h1 { margin: 0; }
        .header p { margin: 5px 0 0; opacity: 0.9; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        tr:nth-child(even) { background: #f9f9f9; }
        tr:hover { background: #f1f1f1; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
        .summary { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${title}</h1>
        ${subtitle ? `<p>${subtitle}</p>` : ''}
    </div>
    
    <div class="summary">
        <strong>Report Generated:</strong> ${new Date().toLocaleString()}<br>
        <strong>Total Records:</strong> ${data.length}
    </div>
    
    <table>
        <thead>
            <tr>${headerCells}</tr>
        </thead>
        <tbody>
            ${tableRows}
        </tbody>
    </table>
    
    <div class="footer">
        <p>${footer} &copy; ${new Date().getFullYear()}</p>
        <p>This report was automatically generated. For questions, contact support.</p>
    </div>
</body>
</html>`;
}

/**
 * Generate price trends report
 */
function generateTrendsReport(productName, trends, history) {
    const data = history.map(h => ({
        'Date': new Date(h.timestamp).toLocaleDateString(),
        'Price': h.price,
        'Change': ''
    }));
    
    // Calculate daily changes
    for (let i = 1; i < data.length; i++) {
        const change = ((history[i].price - history[i-1].price) / history[i-1].price * 100).toFixed(2);
        data[i]['Change'] = `${change > 0 ? '+' : ''}${change}%`;
    }
    
    return generateHTMLReport(
        `Price Trends: ${productName}`,
        data,
        {
            subtitle: `Trend: ${trends.trend} (${trends.change > 0 ? '+' : ''}${trends.change}%)`,
            footer: 'SMPMPS - Price Trends Analysis'
        }
    );
}

/**
 * Parse CSV to array of objects
 */
function parseCSV(csvString) {
    const lines = csvString.trim().split('\n');
    
    // Skip comment lines
    const dataLines = lines.filter(line => !line.startsWith('#'));
    
    if (dataLines.length < 2) {
        return { success: false, error: 'CSV must have header and at least one data row', data: [] };
    }
    
    // Parse header
    const headers = parseCSVLine(dataLines[0]);
    
    // Parse data rows
    const data = [];
    const errors = [];
    
    for (let i = 1; i < dataLines.length; i++) {
        try {
            const values = parseCSVLine(dataLines[i]);
            const row = {};
            
            headers.forEach((header, index) => {
                row[header.trim()] = values[index]?.trim() || '';
            });
            
            data.push(row);
        } catch (error) {
            errors.push({ line: i + 1, error: error.message });
        }
    }
    
    return {
        success: errors.length === 0,
        headers,
        data,
        totalRows: data.length,
        errors
    };
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                i++; // Skip next quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    values.push(current); // Don't forget last value
    return values;
}

/**
 * Validate bulk price import data
 */
function validateBulkPriceImport(data) {
    const requiredFields = ['Product', 'Market', 'Price'];
    const errors = [];
    const validRows = [];
    
    data.forEach((row, index) => {
        const rowErrors = [];
        
        // Check required fields
        requiredFields.forEach(field => {
            // Check for field with different cases
            const value = row[field] || row[field.toLowerCase()] || row[field.toUpperCase()];
            if (!value) {
                rowErrors.push(`Missing ${field}`);
            }
        });
        
        // Validate price
        const price = parseFloat(row.Price || row.price);
        if (isNaN(price) || price <= 0) {
            rowErrors.push('Invalid price');
        }
        
        if (rowErrors.length > 0) {
            errors.push({ row: index + 1, errors: rowErrors });
        } else {
            validRows.push({
                productName: row.Product || row.product,
                marketName: row.Market || row.market,
                price: price,
                unit: row.Unit || row.unit || 'kg',
                notes: row.Notes || row.notes || ''
            });
        }
    });
    
    return {
        valid: errors.length === 0,
        validRows,
        invalidRows: errors,
        summary: {
            total: data.length,
            valid: validRows.length,
            invalid: errors.length
        }
    };
}

export {
    toCSV,
    generatePriceReportCSV,
    generateMarketComparisonCSV,
    generateUserActivityCSV,
    generateHTMLReport,
    generateTrendsReport,
    parseCSV,
    validateBulkPriceImport
};
