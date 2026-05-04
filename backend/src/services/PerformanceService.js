/**
 * Monitor database connection pool
 */
export const monitorConnectionPool = (pool, interval = 30000) => {
    if (!pool) {
        console.warn('⚠️ No database pool provided for monitoring');
        return { monitoring: false };
    }

    const intervalId = setInterval(() => {
        try {
            if (pool.totalCount !== undefined) {
                const stats = {
                    total: pool.totalCount,
                    idle: pool.idleCount,
                    waiting: pool.waitingCount,
                    active: pool.totalCount - pool.idleCount
                };
                
                if (stats.waiting > 10) {
                    console.warn('⚠️ High connection pool wait:', stats);
                }
            }
        } catch (error) {
            // Silently fail
        }
    }, interval);

    return {
        monitoring: true,
        stop: () => clearInterval(intervalId)
    };
};