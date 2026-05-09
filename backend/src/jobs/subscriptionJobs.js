// src/jobs/subscriptionJobs.js
import cron from 'node-cron';
import SubscriptionService from '../services/SubscriptionService.js';

// Run daily at midnight
cron.schedule('0 0 * * *', async () => {
    console.log('Running subscription expiry check...');
    await SubscriptionService.checkExpiringSubscriptions();
    await SubscriptionService.expireSubscriptions();
});

export default cron;