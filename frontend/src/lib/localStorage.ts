// localStorage utility for data persistence
// Handles favorites, notifications, submissions, alerts, and user preferences

export interface StoredFavorite {
  productId: string;
  marketId: string;
  addedAt: string;
}

export interface StoredNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  userId: string;
  userRole: string;
  relatedId?: string;
}

export interface StoredPriceAlert {
  id: string;
  productId: string;
  marketId: string;
  threshold: number;
  type: 'increase' | 'decrease' | 'any';
  createdAt: string;
  userId: string;
  enabled: boolean;
}

export interface StoredPriceSubmission {
  id: string;
  productId: string;
  marketId: string;
  vendorId: string;
  vendorName: string;
  price: number;
  quantity: number;
  unit: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  ageInHours: number;
  imageUrl?: string;
  rejectionReason?: string;
}

export interface UserPreferences {
  language: 'en' | 'rw' | 'fr';
  theme: 'light' | 'dark';
  notifications: boolean;
  emailAlerts: boolean;
}

// Keys for localStorage
const KEYS = {
  FAVORITES: 'market_app_favorites',
  NOTIFICATIONS: 'market_app_notifications',
  PRICE_ALERTS: 'market_app_price_alerts',
  PRICE_SUBMISSIONS: 'market_app_price_submissions',
  USER_PREFERENCES: 'market_app_user_preferences',
};

// Generic get/set functions
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage (${key}):`, error);
  }
}

// ========== FAVORITES ==========

export function getFavorites(userId: string): StoredFavorite[] {
  const allFavorites = getFromStorage<Record<string, StoredFavorite[]>>(KEYS.FAVORITES, {});
  return allFavorites[userId] || [];
}

export function addFavorite(userId: string, productId: string, marketId: string): void {
  const allFavorites = getFromStorage<Record<string, StoredFavorite[]>>(KEYS.FAVORITES, {});
  const userFavorites = allFavorites[userId] || [];
  
  // Check if already exists
  const exists = userFavorites.some(
    f => f.productId === productId && f.marketId === marketId
  );
  
  if (!exists) {
    userFavorites.push({
      productId,
      marketId,
      addedAt: new Date().toISOString(),
    });
    allFavorites[userId] = userFavorites;
    setToStorage(KEYS.FAVORITES, allFavorites);
  }
}

export function removeFavorite(userId: string, productId: string, marketId: string): void {
  const allFavorites = getFromStorage<Record<string, StoredFavorite[]>>(KEYS.FAVORITES, {});
  const userFavorites = allFavorites[userId] || [];
  
  allFavorites[userId] = userFavorites.filter(
    f => !(f.productId === productId && f.marketId === marketId)
  );
  setToStorage(KEYS.FAVORITES, allFavorites);
}

export function isFavorite(userId: string, productId: string, marketId: string): boolean {
  const favorites = getFavorites(userId);
  return favorites.some(f => f.productId === productId && f.marketId === marketId);
}

// ========== NOTIFICATIONS ==========

export function getNotifications(userId: string): StoredNotification[] {
  const allNotifications = getFromStorage<Record<string, StoredNotification[]>>(KEYS.NOTIFICATIONS, {});
  return allNotifications[userId] || [];
}

export function addNotification(notification: StoredNotification): void {
  const allNotifications = getFromStorage<Record<string, StoredNotification[]>>(KEYS.NOTIFICATIONS, {});
  const userNotifications = allNotifications[notification.userId] || [];
  
  userNotifications.unshift(notification); // Add to beginning
  
  // Keep only last 100 notifications per user
  if (userNotifications.length > 100) {
    userNotifications.splice(100);
  }
  
  allNotifications[notification.userId] = userNotifications;
  setToStorage(KEYS.NOTIFICATIONS, allNotifications);
}

export function markNotificationAsRead(userId: string, notificationId: string): void {
  const allNotifications = getFromStorage<Record<string, StoredNotification[]>>(KEYS.NOTIFICATIONS, {});
  const userNotifications = allNotifications[userId] || [];
  
  const notification = userNotifications.find(n => n.id === notificationId);
  if (notification) {
    notification.read = true;
    allNotifications[userId] = userNotifications;
    setToStorage(KEYS.NOTIFICATIONS, allNotifications);
  }
}

export function markAllNotificationsAsRead(userId: string): void {
  const allNotifications = getFromStorage<Record<string, StoredNotification[]>>(KEYS.NOTIFICATIONS, {});
  const userNotifications = allNotifications[userId] || [];
  
  userNotifications.forEach(n => n.read = true);
  allNotifications[userId] = userNotifications;
  setToStorage(KEYS.NOTIFICATIONS, allNotifications);
}

export function getUnreadNotificationCount(userId: string): number {
  const notifications = getNotifications(userId);
  return notifications.filter(n => !n.read).length;
}

// ========== PRICE ALERTS ==========

export function getPriceAlerts(userId: string): StoredPriceAlert[] {
  const allAlerts = getFromStorage<Record<string, StoredPriceAlert[]>>(KEYS.PRICE_ALERTS, {});
  return allAlerts[userId] || [];
}

export function addPriceAlert(alert: StoredPriceAlert): void {
  const allAlerts = getFromStorage<Record<string, StoredPriceAlert[]>>(KEYS.PRICE_ALERTS, {});
  const userAlerts = allAlerts[alert.userId] || [];
  
  // Check if similar alert exists
  const exists = userAlerts.some(
    a => a.productId === alert.productId && 
         a.marketId === alert.marketId && 
         a.enabled
  );
  
  if (!exists) {
    userAlerts.push(alert);
    allAlerts[alert.userId] = userAlerts;
    setToStorage(KEYS.PRICE_ALERTS, allAlerts);
  }
}

export function removePriceAlert(userId: string, alertId: string): void {
  const allAlerts = getFromStorage<Record<string, StoredPriceAlert[]>>(KEYS.PRICE_ALERTS, {});
  const userAlerts = allAlerts[userId] || [];
  
  allAlerts[userId] = userAlerts.filter(a => a.id !== alertId);
  setToStorage(KEYS.PRICE_ALERTS, allAlerts);
}

export function togglePriceAlert(userId: string, alertId: string): void {
  const allAlerts = getFromStorage<Record<string, StoredPriceAlert[]>>(KEYS.PRICE_ALERTS, {});
  const userAlerts = allAlerts[userId] || [];
  
  const alert = userAlerts.find(a => a.id === alertId);
  if (alert) {
    alert.enabled = !alert.enabled;
    allAlerts[userId] = userAlerts;
    setToStorage(KEYS.PRICE_ALERTS, allAlerts);
  }
}

// ========== PRICE SUBMISSIONS ==========

export function getPriceSubmissions(): StoredPriceSubmission[] {
  return getFromStorage<StoredPriceSubmission[]>(KEYS.PRICE_SUBMISSIONS, []);
}

export function addPriceSubmission(submission: StoredPriceSubmission): void {
  const submissions = getPriceSubmissions();
  submissions.unshift(submission); // Add to beginning
  
  // Keep only last 500 submissions
  if (submissions.length > 500) {
    submissions.splice(500);
  }
  
  setToStorage(KEYS.PRICE_SUBMISSIONS, submissions);
}

export function updatePriceSubmissionStatus(
  submissionId: string, 
  status: 'approved' | 'rejected',
  rejectionReason?: string
): void {
  const submissions = getPriceSubmissions();
  const submission = submissions.find(s => s.id === submissionId);
  
  if (submission) {
    submission.status = status;
    if (rejectionReason) {
      submission.rejectionReason = rejectionReason;
    }
    setToStorage(KEYS.PRICE_SUBMISSIONS, submissions);
  }
}

export function getPriceSubmissionsByVendor(vendorId: string): StoredPriceSubmission[] {
  const submissions = getPriceSubmissions();
  return submissions.filter(s => s.vendorId === vendorId);
}

export function getPendingPriceSubmissions(): StoredPriceSubmission[] {
  const submissions = getPriceSubmissions();
  return submissions.filter(s => s.status === 'pending');
}

// ========== USER PREFERENCES ==========

export function getUserPreferences(userId: string): UserPreferences {
  const allPreferences = getFromStorage<Record<string, UserPreferences>>(KEYS.USER_PREFERENCES, {});
  return allPreferences[userId] || {
    language: 'en',
    theme: 'light',
    notifications: true,
    emailAlerts: false,
  };
}

export function updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): void {
  const allPreferences = getFromStorage<Record<string, UserPreferences>>(KEYS.USER_PREFERENCES, {});
  const currentPreferences = getUserPreferences(userId);
  
  allPreferences[userId] = { ...currentPreferences, ...preferences };
  setToStorage(KEYS.USER_PREFERENCES, allPreferences);
}

// ========== UTILITY FUNCTIONS ==========

export function clearUserData(userId: string): void {
  // Clear all data for a specific user
  const favorites = getFromStorage<Record<string, StoredFavorite[]>>(KEYS.FAVORITES, {});
  delete favorites[userId];
  setToStorage(KEYS.FAVORITES, favorites);
  
  const notifications = getFromStorage<Record<string, StoredNotification[]>>(KEYS.NOTIFICATIONS, {});
  delete notifications[userId];
  setToStorage(KEYS.NOTIFICATIONS, notifications);
  
  const alerts = getFromStorage<Record<string, StoredPriceAlert[]>>(KEYS.PRICE_ALERTS, {});
  delete alerts[userId];
  setToStorage(KEYS.PRICE_ALERTS, alerts);
  
  const preferences = getFromStorage<Record<string, UserPreferences>>(KEYS.USER_PREFERENCES, {});
  delete preferences[userId];
  setToStorage(KEYS.USER_PREFERENCES, preferences);
}

export function clearAllData(): void {
  if (typeof window === 'undefined') return;
  
  Object.values(KEYS).forEach(key => {
    window.localStorage.removeItem(key);
  });
}

export function exportUserData(userId: string): string {
  const data = {
    favorites: getFavorites(userId),
    notifications: getNotifications(userId),
    priceAlerts: getPriceAlerts(userId),
    preferences: getUserPreferences(userId),
    exportedAt: new Date().toISOString(),
  };
  
  return JSON.stringify(data, null, 2);
}
