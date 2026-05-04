// Offline Authentication System
// Works completely without backend - all data in localStorage

interface OfflineUser {
  id: string;
  email: string;
  password: string; // In real app, this would be hashed
  name: string;
  role: 'admin' | 'consumer' | 'vendor' | 'business';
  marketId?: string;
  province?: string;
  district?: string;
  createdAt: string;
}

interface OfflineSession {
  userId: string;
  email: string;
  expiresAt: number;
}

const USERS_KEY = 'offline_users';
const SESSION_KEY = 'offline_session';

// Get all users
function getUsers(): OfflineUser[] {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
}

// Save users
function saveUsers(users: OfflineUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Find user by email
function findUserByEmail(email: string): OfflineUser | null {
  const users = getUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

// Create session
function createSession(user: OfflineUser): OfflineSession {
  const session: OfflineSession = {
    userId: user.id,
    email: user.email,
    expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

// Get current session
function getSession(): OfflineSession | null {
  const session = localStorage.getItem(SESSION_KEY);
  if (!session) return null;

  const parsed: OfflineSession = JSON.parse(session);

  // Check if expired
  if (parsed.expiresAt < Date.now()) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }

  return parsed;
}

// Clear session
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// Sign up
export async function offlineSignUp(data: {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'consumer' | 'vendor' | 'business';
  marketId?: string;
  province?: string;
  district?: string;
}): Promise<{ user: OfflineUser; session: OfflineSession }> {
  // Initialize demo users if needed
  initializeDemoUsers();

  // Check if user already exists
  const existingUser = findUserByEmail(data.email);
  if (existingUser) {
    throw new Error('User already registered');
  }

  // Create new user
  const newUser: OfflineUser = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    email: data.email.toLowerCase(),
    password: data.password, // In production, hash this!
    name: data.name,
    role: data.role,
    marketId: data.marketId,
    province: data.province,
    district: data.district,
    createdAt: new Date().toISOString(),
  };

  // Save user
  const users = getUsers();
  users.push(newUser);
  saveUsers(users);

  // Create session
  const session = createSession(newUser);

  return { user: newUser, session };
}

// Sign in
export async function offlineSignIn(email: string, password: string): Promise<{ user: OfflineUser; session: OfflineSession }> {
  // Initialize demo users if needed
  initializeDemoUsers();

  // Find user
  const user = findUserByEmail(email);
  if (!user) {
    throw new Error('Invalid login credentials');
  }

  // Check password
  if (user.password !== password) {
    throw new Error('Invalid login credentials');
  }

  // Create session
  const session = createSession(user);

  return { user, session };
}

// Sign out
export async function offlineSignOut(): Promise<void> {
  clearSession();
}

// Get current user
export async function offlineGetCurrentUser(): Promise<OfflineUser | null> {
  const session = getSession();
  if (!session) return null;

  const users = getUsers();
  return users.find(u => u.id === session.userId) || null;
}

// Check if user is authenticated
export function offlineIsAuthenticated(): boolean {
  const session = getSession();
  return session !== null && session.expiresAt > Date.now();
}

// Get profile
export async function offlineGetProfile(): Promise<OfflineUser> {
  const user = await offlineGetCurrentUser();
  if (!user) {
    throw new Error('Not authenticated');
  }
  return user;
}

// Update profile
export async function offlineUpdateProfile(updates: Partial<OfflineUser>): Promise<OfflineUser> {
  const currentUser = await offlineGetCurrentUser();
  if (!currentUser) {
    throw new Error('Not authenticated');
  }

  const users = getUsers();
  const index = users.findIndex(u => u.id === currentUser.id);

  if (index === -1) {
    throw new Error('User not found');
  }

  // Update user
  const updatedUser = { ...users[index], ...updates };
  users[index] = updatedUser;
  saveUsers(users);

  return updatedUser;
}

// Initialize on import
initializeDemoUsers();
