import { localDB } from '../database';
import type { User } from '../schema';

export class UserService {
  private static instance: UserService;

  private constructor() {}

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    return await localDB.createUser(userData);
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await localDB.getUserById(id);
    return user || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await localDB.getUserByEmail(email);
    return user || null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    await localDB.updateUser(id, updates);
  }

  async updateLastActive(id: string): Promise<void> {
    await localDB.updateUser(id, { lastActiveAt: Date.now() });
  }

  async deleteUser(id: string): Promise<void> {
    await localDB.deleteUser(id);
  }

  async getAllUsers(): Promise<User[]> {
    // This method isn't used in the current app, but kept for completeness
    return [];
  }



  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Authentication methods (simplified local auth)
  async authenticateUser(email: string, password: string): Promise<User | null> {
    // In a real app, you'd hash and verify the password
    // For now, we'll just check if the user exists
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    // Update last active
    await this.updateLastActive(user.id);
    return user;
  }

  async registerUser(email: string, password: string, name: string): Promise<User> {
    // Check if user already exists
    const existingUser = await this.getUserByEmail(email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Create new user
    const user = await this.createUser({
      email,
      name,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    return user;
  }

  // Local session management
  setCurrentUser(user: User): void {
    localStorage.setItem('myai-current-user', JSON.stringify(user));
  }

  getCurrentUser(): User | null {
    const userData = localStorage.getItem('myai-current-user');
    if (!userData) return null;

    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  }

  clearCurrentUser(): void {
    localStorage.removeItem('myai-current-user');
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }
}

export const userService = UserService.getInstance();
