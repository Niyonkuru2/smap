/**
 * Price Verification & Anti-Fraud System
 * Ensures submitted prices are accurate and prevents manipulation
 */

import priceSimulator from './priceSimulator.js';

// Configuration for price verification
const config = {
    // Maximum allowed deviation from reference price (%)
    maxDeviationPercent: 50,
    
    // Minimum submissions required for "verified" status
    minSubmissionsForVerified: 3,
    
    // Trust score thresholds
    trustScoreThresholds: {
        newUser: 0,
        basicTrust: 50,
        trustedVendor: 80,
        verifiedVendor: 95
    },
    
    // Suspicious activity flags
    suspiciousPatterns: {
        rapidSubmissions: 5, // Max submissions per hour
        priceSwings: 0.30,   // 30% change flagged as suspicious
        sameIPMultipleAccounts: true
    }
};

/**
 * Validate a submitted price against reference data
 * @param {string} productName - Name of the product
 * @param {string} marketName - Name of the market
 * @param {number} submittedPrice - Price submitted by vendor
 * @returns {object} Validation result with status and details
 */
export function validatePrice(productName, submittedPrice, marketName) {
    const basePrice = priceSimulator.basePrices[productName];
    
    if (!basePrice) {
        return {
            valid: true,
            status: 'unknown_product',
            message: 'Product not in reference database - manual review required',
            requiresReview: true,
            confidence: 'low'
        };
    }
    
    // Get expected price range for this market
    const marketFactor = priceSimulator.marketFactors[marketName]?.factor || 1.0;
    const expectedPrice = basePrice.base * marketFactor;
    
    // Calculate deviation
    const deviation = Math.abs(submittedPrice - expectedPrice) / expectedPrice;
    const deviationPercent = Math.round(deviation * 100);
    
    // Determine price range bounds
    const minAcceptable = expectedPrice * (1 - config.maxDeviationPercent / 100);
    const maxAcceptable = expectedPrice * (1 + config.maxDeviationPercent / 100);
    
    let result = {
        submittedPrice,
        expectedPrice: Math.round(expectedPrice),
        deviation: deviationPercent,
        minAcceptable: Math.round(minAcceptable),
        maxAcceptable: Math.round(maxAcceptable),
        unit: basePrice.unit
    };
    
    if (submittedPrice < minAcceptable) {
        return {
            ...result,
            valid: false,
            status: 'price_too_low',
            message: `Price ${submittedPrice} RWF is ${deviationPercent}% below expected range (${Math.round(minAcceptable)}-${Math.round(maxAcceptable)} RWF)`,
            requiresReview: true,
            confidence: 'suspicious',
            flag: 'POSSIBLY_FAKE_LOW_PRICE'
        };
    }
    
    if (submittedPrice > maxAcceptable) {
        return {
            ...result,
            valid: false,
            status: 'price_too_high',
            message: `Price ${submittedPrice} RWF is ${deviationPercent}% above expected range (${Math.round(minAcceptable)}-${Math.round(maxAcceptable)} RWF)`,
            requiresReview: true,
            confidence: 'suspicious',
            flag: 'POSSIBLY_INFLATED_PRICE'
        };
    }
    
    // Price is within acceptable range
    let confidence = 'high';
    if (deviationPercent > 30) confidence = 'medium';
    if (deviationPercent > 40) confidence = 'low';
    
    return {
        ...result,
        valid: true,
        status: 'acceptable',
        message: `Price is within expected range (${deviationPercent}% deviation)`,
        requiresReview: deviationPercent > 30,
        confidence
    };
}

/**
 * Calculate vendor trust score based on submission history
 * @param {object} vendorStats - Vendor's submission statistics
 * @returns {object} Trust score and level
 */
export function calculateVendorTrustScore(vendorStats) {
    const {
        totalSubmissions = 0,
        approvedSubmissions = 0,
        rejectedSubmissions = 0,
        flaggedSubmissions = 0,
        accountAge = 0, // days
        verifiedPhone = false,
        verifiedEmail = false,
        hasProfilePhoto = false
    } = vendorStats;
    
    let score = 0;
    
    // Base score from approval rate
    if (totalSubmissions > 0) {
        const approvalRate = approvedSubmissions / totalSubmissions;
        score += approvalRate * 40; // Max 40 points
    }
    
    // Bonus for volume (more submissions = more trust if approved)
    if (approvedSubmissions >= 50) score += 15;
    else if (approvedSubmissions >= 20) score += 10;
    else if (approvedSubmissions >= 10) score += 5;
    
    // Account age bonus
    if (accountAge >= 365) score += 15;
    else if (accountAge >= 180) score += 10;
    else if (accountAge >= 30) score += 5;
    
    // Verification bonuses
    if (verifiedPhone) score += 10;
    if (verifiedEmail) score += 10;
    if (hasProfilePhoto) score += 5;
    
    // Penalties
    score -= rejectedSubmissions * 5;
    score -= flaggedSubmissions * 10;
    
    // Clamp score between 0-100
    score = Math.max(0, Math.min(100, score));
    
    // Determine trust level
    let level = 'new_user';
    let badge = '🆕';
    if (score >= 95) { level = 'verified_vendor'; badge = '✅'; }
    else if (score >= 80) { level = 'trusted_vendor'; badge = '⭐'; }
    else if (score >= 50) { level = 'basic_trust'; badge = '👤'; }
    
    return {
        score: Math.round(score),
        level,
        badge,
        canAutoApprove: score >= 80,
        requiresReview: score < 50
    };
}

/**
 * Check if a submission is suspicious based on patterns
 * @param {object} submission - The price submission
 * @param {array} recentSubmissions - Recent submissions from same vendor
 * @returns {object} Suspicion analysis
 */
export function detectSuspiciousActivity(submission, recentSubmissions = []) {
    const flags = [];
    let suspicionLevel = 0;
    
    // Check rapid submissions
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentCount = recentSubmissions.filter(s => 
        new Date(s.created_at).getTime() > oneHourAgo
    ).length;
    
    if (recentCount >= config.suspiciousPatterns.rapidSubmissions) {
        flags.push({
            type: 'RAPID_SUBMISSIONS',
            message: `${recentCount} submissions in the last hour`,
            severity: 'medium'
        });
        suspicionLevel += 20;
    }
    
    // Check for dramatic price swings on same product
    const sameProductSubmissions = recentSubmissions.filter(s => 
        s.product_name === submission.product_name &&
        s.market_name === submission.market_name
    );
    
    if (sameProductSubmissions.length > 0) {
        const lastPrice = sameProductSubmissions[0].price;
        const priceChange = Math.abs(submission.price - lastPrice) / lastPrice;
        
        if (priceChange > config.suspiciousPatterns.priceSwings) {
            flags.push({
                type: 'LARGE_PRICE_SWING',
                message: `${Math.round(priceChange * 100)}% price change from last submission`,
                severity: 'high',
                previousPrice: lastPrice,
                newPrice: submission.price
            });
            suspicionLevel += 30;
        }
    }
    
    // Check if price is exactly round (likely fake)
    if (submission.price % 100 === 0 && submission.price > 1000) {
        flags.push({
            type: 'SUSPICIOUS_ROUND_NUMBER',
            message: 'Suspiciously round price - real prices are rarely exact',
            severity: 'low'
        });
        suspicionLevel += 10;
    }
    
    return {
        suspicious: suspicionLevel >= 30,
        suspicionLevel,
        flags,
        recommendation: suspicionLevel >= 50 ? 'MANUAL_REVIEW_REQUIRED' :
                        suspicionLevel >= 30 ? 'FLAG_FOR_REVIEW' :
                        'AUTO_APPROVE_ELIGIBLE'
    };
}

/**
 * Calculate verified price from multiple submissions
 * Uses median to resist outlier manipulation
 * @param {array} submissions - Array of price submissions for same product/market
 * @returns {object} Verified price data
 */
export function calculateVerifiedPrice(submissions) {
    if (!submissions || submissions.length === 0) {
        return { verified: false, reason: 'No submissions' };
    }
    
    const prices = submissions.map(s => s.price).sort((a, b) => a - b);
    const count = prices.length;
    
    // Need minimum submissions for verification
    if (count < config.minSubmissionsForVerified) {
        return {
            verified: false,
            reason: `Need ${config.minSubmissionsForVerified} submissions, only have ${count}`,
            currentPrice: prices[Math.floor(count / 2)],
            submissionCount: count,
            status: 'pending_verification'
        };
    }
    
    // Calculate median (resistant to outliers/fake prices)
    const median = count % 2 === 0
        ? (prices[count / 2 - 1] + prices[count / 2]) / 2
        : prices[Math.floor(count / 2)];
    
    // Calculate mean
    const mean = prices.reduce((a, b) => a + b, 0) / count;
    
    // Calculate standard deviation
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / count;
    const stdDev = Math.sqrt(variance);
    
    // Identify outliers (beyond 2 standard deviations)
    const outliers = prices.filter(p => Math.abs(p - mean) > 2 * stdDev);
    
    // Confidence based on consistency
    const coefficientOfVariation = (stdDev / mean) * 100;
    let confidence = 'high';
    if (coefficientOfVariation > 20) confidence = 'medium';
    if (coefficientOfVariation > 35) confidence = 'low';
    
    return {
        verified: true,
        verifiedPrice: Math.round(median),
        mean: Math.round(mean),
        median: Math.round(median),
        min: prices[0],
        max: prices[count - 1],
        submissionCount: count,
        outlierCount: outliers.length,
        confidence,
        coefficientOfVariation: Math.round(coefficientOfVariation),
        lastUpdated: new Date(),
        status: 'verified'
    };
}

/**
 * Get price quality indicators
 * @param {object} priceData - Price submission data
 * @returns {object} Quality indicators for display
 */
export function getPriceQualityIndicators(priceData) {
    const indicators = [];
    
    if (priceData.submissionCount >= 5) {
        indicators.push({ icon: '✅', label: 'Multiple Sources', description: 'Verified by 5+ vendors' });
    } else if (priceData.submissionCount >= 3) {
        indicators.push({ icon: '👥', label: 'Community Verified', description: 'Confirmed by 3+ vendors' });
    } else {
        indicators.push({ icon: '⚠️', label: 'Limited Data', description: 'Needs more submissions' });
    }
    
    if (priceData.confidence === 'high') {
        indicators.push({ icon: '🎯', label: 'High Accuracy', description: 'Consistent price reports' });
    } else if (priceData.confidence === 'low') {
        indicators.push({ icon: '📊', label: 'Variable Prices', description: 'Prices vary significantly' });
    }
    
    // Freshness indicator
    const ageHours = (Date.now() - new Date(priceData.lastUpdated).getTime()) / (1000 * 60 * 60);
    if (ageHours < 24) {
        indicators.push({ icon: '🔄', label: 'Fresh', description: 'Updated today' });
    } else if (ageHours < 72) {
        indicators.push({ icon: '📅', label: 'Recent', description: 'Updated this week' });
    } else {
        indicators.push({ icon: '⏰', label: 'May be outdated', description: 'Update needed' });
    }
    
    return indicators;
}

export default {
    validatePrice,
    calculateVendorTrustScore,
    detectSuspiciousActivity,
    calculateVerifiedPrice,
    getPriceQualityIndicators,
    config
};
