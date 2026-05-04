/**
 * Saved Searches Module
 * Allow users to save their filter preferences
 */

// In-memory storage (use database in production)
const savedSearches = new Map(); // userId -> [{ id, name, filters, createdAt }]

/**
 * Save a search configuration
 */
function saveSearch(userId, name, filters) {
    const userSearches = savedSearches.get(userId) || [];
    
    // Check for duplicate names
    if (userSearches.some(s => s.name.toLowerCase() === name.toLowerCase())) {
        return { success: false, error: 'A saved search with this name already exists' };
    }
    
    // Limit to 20 saved searches per user
    if (userSearches.length >= 20) {
        return { success: false, error: 'Maximum saved searches limit reached (20)' };
    }
    
    const search = {
        id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim().slice(0, 50),
        filters: sanitizeFilters(filters),
        createdAt: new Date().toISOString(),
        lastUsed: null,
        useCount: 0
    };
    
    userSearches.push(search);
    savedSearches.set(userId, userSearches);
    
    return { 
        success: true, 
        search,
        message: 'Search saved successfully'
    };
}

/**
 * Sanitize filter object
 */
function sanitizeFilters(filters) {
    const sanitized = {};
    
    const allowedFields = [
        'query', 'category', 'market', 'minPrice', 'maxPrice',
        'sortBy', 'limit', 'province', 'district', 'productId'
    ];
    
    allowedFields.forEach(field => {
        if (filters[field] !== undefined && filters[field] !== null && filters[field] !== '') {
            sanitized[field] = filters[field];
        }
    });
    
    return sanitized;
}

/**
 * Get all saved searches for a user
 */
function getSavedSearches(userId) {
    const searches = savedSearches.get(userId) || [];
    return {
        searches: searches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        total: searches.length
    };
}

/**
 * Get a specific saved search
 */
function getSavedSearch(userId, searchId) {
    const userSearches = savedSearches.get(userId) || [];
    const search = userSearches.find(s => s.id === searchId);
    
    if (!search) {
        return { success: false, error: 'Saved search not found' };
    }
    
    // Update usage stats
    search.lastUsed = new Date().toISOString();
    search.useCount++;
    savedSearches.set(userId, userSearches);
    
    return { success: true, search };
}

/**
 * Update a saved search
 */
function updateSavedSearch(userId, searchId, updates) {
    const userSearches = savedSearches.get(userId) || [];
    const index = userSearches.findIndex(s => s.id === searchId);
    
    if (index === -1) {
        return { success: false, error: 'Saved search not found' };
    }
    
    // Check for duplicate name
    if (updates.name) {
        const duplicate = userSearches.find(s => 
            s.id !== searchId && 
            s.name.toLowerCase() === updates.name.toLowerCase()
        );
        if (duplicate) {
            return { success: false, error: 'A saved search with this name already exists' };
        }
        userSearches[index].name = updates.name.trim().slice(0, 50);
    }
    
    if (updates.filters) {
        userSearches[index].filters = sanitizeFilters(updates.filters);
    }
    
    userSearches[index].updatedAt = new Date().toISOString();
    savedSearches.set(userId, userSearches);
    
    return { 
        success: true, 
        search: userSearches[index],
        message: 'Saved search updated'
    };
}

/**
 * Delete a saved search
 */
function deleteSavedSearch(userId, searchId) {
    const userSearches = savedSearches.get(userId) || [];
    const index = userSearches.findIndex(s => s.id === searchId);
    
    if (index === -1) {
        return { success: false, error: 'Saved search not found' };
    }
    
    userSearches.splice(index, 1);
    savedSearches.set(userId, userSearches);
    
    return { success: true, message: 'Saved search deleted' };
}

/**
 * Get most used saved searches (for quick access)
 */
function getMostUsedSearches(userId, limit = 5) {
    const searches = savedSearches.get(userId) || [];
    return searches
        .filter(s => s.useCount > 0)
        .sort((a, b) => b.useCount - a.useCount)
        .slice(0, limit);
}

/**
 * Get recently used saved searches
 */
function getRecentSearches(userId, limit = 5) {
    const searches = savedSearches.get(userId) || [];
    return searches
        .filter(s => s.lastUsed)
        .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
        .slice(0, limit);
}

/**
 * Clone a saved search (useful for creating variations)
 */
function cloneSavedSearch(userId, searchId, newName) {
    const userSearches = savedSearches.get(userId) || [];
    const original = userSearches.find(s => s.id === searchId);
    
    if (!original) {
        return { success: false, error: 'Saved search not found' };
    }
    
    return saveSearch(userId, newName || `${original.name} (copy)`, original.filters);
}

/**
 * Export user's saved searches
 */
function exportSavedSearches(userId) {
    const searches = savedSearches.get(userId) || [];
    return {
        exportedAt: new Date().toISOString(),
        userId,
        searches: searches.map(s => ({
            name: s.name,
            filters: s.filters
        }))
    };
}

/**
 * Import saved searches
 */
function importSavedSearches(userId, data) {
    if (!data.searches || !Array.isArray(data.searches)) {
        return { success: false, error: 'Invalid import data' };
    }
    
    const results = { imported: 0, skipped: 0, errors: [] };
    
    data.searches.forEach(search => {
        if (!search.name || !search.filters) {
            results.skipped++;
            return;
        }
        
        const result = saveSearch(userId, search.name, search.filters);
        if (result.success) {
            results.imported++;
        } else {
            results.skipped++;
            results.errors.push(`${search.name}: ${result.error}`);
        }
    });
    
    return {
        success: true,
        ...results,
        message: `Imported ${results.imported} searches, skipped ${results.skipped}`
    };
}

export {
    saveSearch,
    getSavedSearches,
    getSavedSearch,
    updateSavedSearch,
    deleteSavedSearch,
    getMostUsedSearches,
    getRecentSearches,
    cloneSavedSearch,
    exportSavedSearches,
    importSavedSearches
};
