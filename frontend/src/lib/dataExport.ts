// Data Export Utilities - CSV and PDF generation

import type { Product, Market, PriceData } from '../hooks/useAppData';

interface PriceSubmission {
  id: string;
  productId: string;
  marketId: string;
  vendorId: string;
  vendorName: string;
  price: number;
  quantity: number;
  unit: string;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  ageInHours: number;
  imageUrl?: string;
  rejectionReason?: string;
}

// ========== CSV EXPORT ==========

export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      
      // Handle different data types
      if (value === null || value === undefined) {
        return '';
      }
      
      // Convert dates to readable format
      if (value instanceof Date) {
        return value.toLocaleString();
      }
      
      // Escape commas and quotes in strings
      if (typeof value === 'string') {
        return `"${value.replace(/"/g, '""')}"`;
      }
      
      return value;
    });
    
    csvRows.push(values.join(','));
  }
  
  const csvContent = csvRows.join('\n');
  
  // Download file
  downloadFile(csvContent, filename, 'text/csv');
}

// ========== PRICE DATA EXPORT ==========

export function exportPriceData(
  priceData: PriceData[],
  products: Product[],
  markets: Market[],
  filename: string = 'price_data.csv'
) {
  const exportData = priceData.map(price => {
    const product = products.find(p => p.id === price.productId);
    const market = markets.find(m => m.id === price.marketId);
    
    return {
      'Product': product?.name || price.productId,
      'Category': product?.category || '',
      'Market': market?.name || price.marketId,
      'Location': market?.location || '',
      'Province': market?.province || '',
      'Current Price (RWF)': price.current,
      'Average Price (RWF)': price.average,
      'Lowest Price (RWF)': price.lowest,
      'Highest Price (RWF)': price.highest,
      'Trend': price.trend,
      'Last Updated': price.lastUpdated,
      'Rating': price.rating || 'N/A',
      'Total Ratings': price.totalRatings || 0
    };
  });
  
  exportToCSV(exportData, filename);
}

// ========== PRICE SUBMISSIONS EXPORT ==========

export function exportPriceSubmissions(
  submissions: PriceSubmission[],
  products: Product[],
  markets: Market[],
  filename: string = 'price_submissions.csv'
) {
  const exportData = submissions.map(submission => {
    const product = products.find(p => p.id === submission.productId);
    const market = markets.find(m => m.id === submission.marketId);
    
    return {
      'Submission ID': submission.id,
      'Product': product?.name || submission.productId,
      'Market': market?.name || submission.marketId,
      'Vendor': submission.vendorName,
      'Price (RWF)': submission.price,
      'Quantity': submission.quantity,
      'Unit': submission.unit,
      'Status': submission.status,
      'Submitted At': submission.submittedAt,
      'Age (hours)': submission.ageInHours
    };
  });
  
  exportToCSV(exportData, filename);
}

// ========== MARKET COMPARISON EXPORT ==========

export function exportMarketComparison(
  productName: string,
  comparisons: Array<{
    marketName: string;
    location: string;
    province: string;
    price: number;
    trend: string;
  }>,
  filename?: string
) {
  const exportData = comparisons.map(comp => ({
    'Product': productName,
    'Market': comp.marketName,
    'Location': comp.location,
    'Province': comp.province,
    'Price (RWF)': comp.price,
    'Trend': comp.trend
  }));
  
  exportToCSV(
    exportData,
    filename || `${productName.replace(/\s+/g, '_')}_market_comparison.csv`
  );
}

// ========== PRICE TRENDS EXPORT ==========

export function exportPriceTrends(
  productName: string,
  marketName: string,
  history: Array<{ date: Date; price: number }>,
  filename?: string
) {
  const exportData = history.map(entry => ({
    'Date': entry.date.toLocaleDateString(),
    'Product': productName,
    'Market': marketName,
    'Price (RWF)': entry.price
  }));
  
  exportToCSV(
    exportData,
    filename || `${productName.replace(/\s+/g, '_')}_price_trends.csv`
  );
}

// ========== BUSINESS ANALYTICS EXPORT ==========

export function exportBusinessAnalytics(
  data: {
    topProducts?: Array<{ name: string; marketCount: number; avgPrice: number }>;
    priceComparisons?: Array<{ product: string; cheapest: number; mostExpensive: number; potentialSavings: number }>;
    marketPerformance?: Array<{ market: string; avgPrice: number; priceRange: string; submissions: number }>;
  },
  filename: string = 'business_analytics.csv'
) {
  let exportData: any[] = [];
  
  if (data.topProducts) {
    exportData = data.topProducts.map(p => ({
      'Type': 'Top Product',
      'Name': p.name,
      'Market Count': p.marketCount,
      'Average Price (RWF)': p.avgPrice
    }));
  }
  
  if (data.priceComparisons) {
    const compData = data.priceComparisons.map(p => ({
      'Type': 'Price Comparison',
      'Product': p.product,
      'Cheapest (RWF)': p.cheapest,
      'Most Expensive (RWF)': p.mostExpensive,
      'Potential Savings (RWF)': p.potentialSavings
    }));
    exportData = [...exportData, ...compData];
  }
  
  if (data.marketPerformance) {
    const perfData = data.marketPerformance.map(m => ({
      'Type': 'Market Performance',
      'Market': m.market,
      'Average Price (RWF)': m.avgPrice,
      'Price Range': m.priceRange,
      'Submissions': m.submissions
    }));
    exportData = [...exportData, ...perfData];
  }
  
  if (exportData.length > 0) {
    exportToCSV(exportData, filename);
  }
}

// ========== ADMIN ANALYTICS EXPORT ==========

export function exportAdminAnalytics(
  analytics: {
    popularProducts?: Array<{ name: string; searches: number }>;
    activeMarkets?: Array<{ name: string; submissions: number }>;
    priceChangeAlerts?: Array<{ product: string; market: string; change: string; type: string }>;
    overview?: {
      totalProducts: number;
      totalMarkets: number;
      totalUsers: number;
      activeVendors: number;
      pendingApprovals: number;
      priceUpdatesToday: number;
    };
  },
  filename: string = 'admin_analytics.csv'
) {
  const exportData: any[] = [];
  
  // Overview data
  if (analytics.overview) {
    exportData.push(
      { 'Metric': 'Total Products', 'Value': analytics.overview.totalProducts },
      { 'Metric': 'Total Markets', 'Value': analytics.overview.totalMarkets },
      { 'Metric': 'Total Users', 'Value': analytics.overview.totalUsers },
      { 'Metric': 'Active Vendors', 'Value': analytics.overview.activeVendors },
      { 'Metric': 'Pending Approvals', 'Value': analytics.overview.pendingApprovals },
      { 'Metric': 'Price Updates Today', 'Value': analytics.overview.priceUpdatesToday },
      { 'Metric': '', 'Value': '' } // Blank row
    );
  }
  
  // Popular products
  if (analytics.popularProducts) {
    exportData.push({ 'Metric': 'Popular Products', 'Value': 'Searches' });
    analytics.popularProducts.forEach(p => {
      exportData.push({ 'Metric': p.name, 'Value': p.searches });
    });
    exportData.push({ 'Metric': '', 'Value': '' }); // Blank row
  }
  
  // Active markets
  if (analytics.activeMarkets) {
    exportData.push({ 'Metric': 'Active Markets', 'Value': 'Submissions' });
    analytics.activeMarkets.forEach(m => {
      exportData.push({ 'Metric': m.name, 'Value': m.submissions });
    });
    exportData.push({ 'Metric': '', 'Value': '' }); // Blank row
  }
  
  // Price change alerts
  if (analytics.priceChangeAlerts) {
    exportData.push({ 'Metric': 'Price Change Alerts', 'Value': '' });
    analytics.priceChangeAlerts.forEach(a => {
      exportData.push({
        'Metric': `${a.product} at ${a.market}`,
        'Value': `${a.change} (${a.type})`
      });
    });
  }
  
  exportToCSV(exportData, filename);
}

// ========== UTILITY FUNCTIONS ==========

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ========== PDF EXPORT (Simplified) ==========

export function exportToPDF(title: string, data: any[], filename: string = 'export.pdf') {
  // For now, create a formatted text file that can be easily converted to PDF
  // In a real app, you'd use a library like jsPDF or pdfmake
  
  let content = `${title}\n`;
  content += `Generated: ${new Date().toLocaleString()}\n`;
  content += `\n${'='.repeat(60)}\n\n`;
  
  if (data.length > 0) {
    const headers = Object.keys(data[0]);
    
    // Add headers
    content += headers.join(' | ') + '\n';
    content += '-'.repeat(60) + '\n';
    
    // Add data
    data.forEach(row => {
      const values = headers.map(h => {
        const val = row[h];
        if (val instanceof Date) return val.toLocaleDateString();
        return String(val || '');
      });
      content += values.join(' | ') + '\n';
    });
  }
  
  content += `\n${'='.repeat(60)}\n`;
  content += `Total Records: ${data.length}\n`;
  
  downloadFile(content, filename.replace('.pdf', '.txt'), 'text/plain');
}
