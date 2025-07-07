import { useState, useEffect, useCallback } from 'react';
import { userService } from '@/lib/database/services/userService';
import { localDB } from '@/lib/database/database';
import type { User } from '@/lib/database/schema';

export function useLocalUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize database and check for existing user
  useEffect(() => {
    const initializeUser = async () => {
      try {
        // Initialize database first
        await localDB.initialize();

        // Check for existing user session
        const currentUser = userService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);

          // Update last active
          await userService.updateLastActive(currentUser.id);
        }
      } catch (error) {
        console.error('Failed to initialize user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);

      const authenticatedUser = await userService.authenticateUser(email, password);
      if (!authenticatedUser) {
        return { success: false, error: 'Invalid email or password' };
      }

      setUser(authenticatedUser);
      setIsAuthenticated(true);
      userService.setCurrentUser(authenticatedUser);

      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign in failed'
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true);

      const newUser = await userService.registerUser(email, password, name);

      setUser(newUser);
      setIsAuthenticated(true);
      userService.setCurrentUser(newUser);

      return { success: true };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign up failed'
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      userService.clearCurrentUser();
      setUser(null);
      setIsAuthenticated(false);

      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign out failed'
      };
    }
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }

    try {
      await userService.updateUser(user.id, updates);

      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      userService.setCurrentUser(updatedUser);

      return { success: true };
    } catch (error) {
      console.error('Update user error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed'
      };
    }
  }, [user]);

  const createUserProfile = useCallback(async (userData: {
    name: string;
    email?: string;
    profilePicture?: string;
    timezone?: string;
  }) => {
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }

    try {
      await userService.updateUser(user.id, userData);

      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      userService.setCurrentUser(updatedUser);

      return { success: true };
    } catch (error) {
      console.error('Create user profile error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create user profile'
      };
    }
  }, [user]);

  const markUserActive = useCallback(async () => {
    if (user) {
      try {
        await userService.updateLastActive(user.id);

        const updatedUser = { ...user, lastActiveAt: Date.now() };
        setUser(updatedUser);
        userService.setCurrentUser(updatedUser);
      } catch (error) {
        console.error('Update last active error:', error);
      }
    }
  }, [user]);

  const deleteAccount = useCallback(async () => {
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }

    try {
      // Clear all local data
      await localDB.clearDatabase();
      await userService.deleteUser(user.id);

      // Clear session
      userService.clearCurrentUser();
      setUser(null);
      setIsAuthenticated(false);

      return { success: true };
    } catch (error) {
      console.error('Delete account error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Account deletion failed'
      };
    }
  }, [user]);

  const exportUserData = useCallback(async () => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      // Export encrypted database
      const databaseBackup = await localDB.exportDatabase();

      // Create comprehensive backup
      const backup = {
        version: '1.0',
        user: user,
        database: databaseBackup,
        exportedAt: Date.now(),
      };

      return JSON.stringify(backup);
    } catch (error) {
      console.error('Export user data error:', error);
      throw error;
    }
  }, [user]);

  const importUserData = useCallback(async (backupData: string) => {
    try {
      const backup = JSON.parse(backupData);

      if (!backup.database || !backup.user) {
        throw new Error('Invalid backup format');
      }

      // Import database
      await localDB.importDatabase(backup.database);

      // Set user
      setUser(backup.user);
      setIsAuthenticated(true);
      userService.setCurrentUser(backup.user);

      return { success: true };
    } catch (error) {
      console.error('Import user data error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Import failed'
      };
    }
  }, []);

  const getDatabaseSize = useCallback(() => {
    return localDB.getDatabaseSize();
  }, []);

  // Get user ID safely
  const userId = user?.id || null;

  return {
    user,
    userId,
    isAuthenticated,
    isLoading,
    signIn,
    signUp,
    signOut,
    updateUser,
    createUserProfile,
    markUserActive,
    deleteAccount,
    exportUserData,
    importUserData,
    getDatabaseSize,
  };
}
