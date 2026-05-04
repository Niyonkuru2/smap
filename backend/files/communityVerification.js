/**
 * COMMUNITY VERIFICATION SYSTEM
 * =============================
 * Users can confirm or dispute prices submitted by vendors.
 * More confirmations = more trusted price
 * Multiple disputes = price gets flagged for review
 */

// Configuration
const CONFIG = {
    minConfirmationsForVerified: 3,    // Need 3 confirmations to mark as "verified"
    disputeThreshold: 2,               // 2 disputes triggers review
    confirmationWeight: 1,             // Each confirmation adds this to score
    disputeWeight: -2,                 // Each dispute subtracts this from score
    verifiedBonusToVendor: 5,          // Trust score bonus when price gets verified
    disputePenaltyToVendor: -10,       // Trust score penalty when price disputed
    cooldownMinutes: 60,               // User can only verify same price once per hour
};

/**
 * Process a community verification (confirm or dispute)
 */
function processVerification(priceId, userId, action, reason = null) {
    // action: 'confirm' or 'dispute'
    
    const verification = {
        priceId,
        userId,
        action,
        reason,
        timestamp: new Date().toISOString(),
        weight: action === 'confirm' ? CONFIG.confirmationWeight : CONFIG.disputeWeight
    };
    
    return verification;
}

/**
 * Calculate community trust score for a price
 */
function calculateCommunityScore(verifications) {
    if (!verifications || verifications.length === 0) {
        return {
            score: 0,
            confirmations: 0,
            disputes: 0,
            status: 'unverified',
            confidence: 'low'
        };
    }
    
    const confirmations = verifications.filter(v => v.action === 'confirm').length;
    const disputes = verifications.filter(v => v.action === 'dispute').length;
    
    // Calculate weighted score
    let score = 0;
    verifications.forEach(v => {
        score += v.action === 'confirm' ? CONFIG.confirmationWeight : CONFIG.disputeWeight;
    });
    
    // Determine status
    let status = 'unverified';
    let confidence = 'low';
    
    if (disputes >= CONFIG.disputeThreshold && disputes > confirmations) {
        status = 'disputed';
        confidence = 'flagged';
    } else if (confirmations >= CONFIG.minConfirmationsForVerified && confirmations > disputes * 2) {
        status = 'community_verified';
        confidence = 'high';
    } else if (confirmations > 0 && confirmations > disputes) {
        status = 'partially_verified';
        confidence = 'medium';
    } else if (disputes > 0) {
        status = 'under_review';
        confidence = 'low';
    }
    
    return {
        score,
        confirmations,
        disputes,
        status,
        confidence,
        totalVerifications: verifications.length
    };
}

/**
 * Check if user can verify a price (cooldown check)
 */
function canUserVerify(existingVerifications, userId) {
    const userVerifications = existingVerifications.filter(v => v.userId === userId);
    
    if (userVerifications.length === 0) return { canVerify: true };
    
    // Check cooldown
    const lastVerification = userVerifications.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
    )[0];
    
    const cooldownMs = CONFIG.cooldownMinutes * 60 * 1000;
    const timeSince = Date.now() - new Date(lastVerification.timestamp).getTime();
    
    if (timeSince < cooldownMs) {
        const minutesLeft = Math.ceil((cooldownMs - timeSince) / 60000);
        return {
            canVerify: false,
            reason: `Please wait ${minutesLeft} minutes before verifying this price again`
        };
    }
    
    return { canVerify: true };
}

/**
 * Get dispute reasons options
 */
function getDisputeReasons() {
    return [
        { code: 'price_too_high', label: 'Price is higher than actual market price' },
        { code: 'price_too_low', label: 'Price is lower than actual market price' },
        { code: 'wrong_product', label: 'Wrong product information' },
        { code: 'wrong_market', label: 'Wrong market location' },
        { code: 'outdated', label: 'Price is outdated' },
        { code: 'fake', label: 'Suspicious/fake submission' },
        { code: 'other', label: 'Other reason' }
    ];
}

/**
 * Calculate vendor trust adjustment based on community feedback
 */
function calculateVendorTrustAdjustment(communityScore) {
    let adjustment = 0;
    
    if (communityScore.status === 'community_verified') {
        adjustment = CONFIG.verifiedBonusToVendor;
    } else if (communityScore.status === 'disputed') {
        adjustment = CONFIG.disputePenaltyToVendor;
    }
    
    return {
        adjustment,
        reason: communityScore.status === 'community_verified' 
            ? 'Price verified by community' 
            : communityScore.status === 'disputed'
            ? 'Price disputed by community'
            : 'No adjustment'
    };
}

/**
 * Generate community verification badge
 */
function getVerificationBadge(communityScore) {
    const badges = {
        'community_verified': {
            icon: '✅',
            label: 'Community Verified',
            color: 'green',
            tooltip: `Confirmed by ${communityScore.confirmations} users`
        },
        'partially_verified': {
            icon: '🔵',
            label: 'Partially Verified',
            color: 'blue',
            tooltip: `${communityScore.confirmations} confirmations`
        },
        'under_review': {
            icon: '🟡',
            label: 'Under Review',
            color: 'yellow',
            tooltip: 'This price is being reviewed'
        },
        'disputed': {
            icon: '⚠️',
            label: 'Disputed',
            color: 'red',
            tooltip: `Disputed by ${communityScore.disputes} users`
        },
        'unverified': {
            icon: '⚪',
            label: 'Unverified',
            color: 'gray',
            tooltip: 'No community verification yet'
        }
    };
    
    return badges[communityScore.status] || badges['unverified'];
}

/**
 * Get leaderboard of most helpful verifiers
 */
function calculateVerifierLeaderboard(allVerifications) {
    const userStats = {};
    
    allVerifications.forEach(v => {
        if (!userStats[v.userId]) {
            userStats[v.userId] = {
                userId: v.userId,
                totalVerifications: 0,
                confirmations: 0,
                disputes: 0,
                helpfulScore: 0
            };
        }
        
        userStats[v.userId].totalVerifications++;
        if (v.action === 'confirm') {
            userStats[v.userId].confirmations++;
            userStats[v.userId].helpfulScore += 1;
        } else {
            userStats[v.userId].disputes++;
            userStats[v.userId].helpfulScore += 2; // Disputes are more valuable
        }
    });
    
    return Object.values(userStats)
        .sort((a, b) => b.helpfulScore - a.helpfulScore)
        .slice(0, 10); // Top 10
}

export default {
    CONFIG,
    processVerification,
    calculateCommunityScore,
    canUserVerify,
    getDisputeReasons,
    calculateVendorTrustAdjustment,
    getVerificationBadge,
    calculateVerifierLeaderboard
};
