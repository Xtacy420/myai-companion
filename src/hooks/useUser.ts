import { useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";

export function useUser() {
  const { signIn, signOut } = useAuthActions();

  // Get current authenticated user
  const user = useQuery(api.users.getCurrentUser);
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);
  const updateLastActive = useMutation(api.users.updateLastActive);

  // Check if user is authenticated
  const isAuthenticated = user !== null && user !== undefined;
  const isLoading = user === undefined;

  // Get user ID from the user object
  const userId = user?._id || null;

  // Sign in function
  const handleSignIn = async (email: string, password: string) => {
    try {
      await signIn("password", { email, password });
      return { success: true };
    } catch (error) {
      console.error("Sign in error:", error);
      return { success: false, error: error instanceof Error ? error.message : "Sign in failed" };
    }
  };

  // Sign up function
  const handleSignUp = async (email: string, password: string, name: string) => {
    try {
      await signIn("password", { email, password, flow: "signUp" });

      // Create user profile after successful authentication
      if (name) {
        await createOrUpdateUser({
          name,
          email,
        });
      }

      return { success: true };
    } catch (error) {
      console.error("Sign up error:", error);
      return { success: false, error: error instanceof Error ? error.message : "Sign up failed" };
    }
  };

  // Sign out function
  const handleSignOut = async () => {
    try {
      await signOut();
      return { success: true };
    } catch (error) {
      console.error("Sign out error:", error);
      return { success: false, error: error instanceof Error ? error.message : "Sign out failed" };
    }
  };

  // Create or update user profile
  const createUserProfile = async (userData: {
    name: string;
    email?: string;
    profilePicture?: string;
    timezone?: string;
  }) => {
    try {
      await createOrUpdateUser(userData);
      return { success: true };
    } catch (error) {
      console.error("Create user profile error:", error);
      return { success: false, error: error instanceof Error ? error.message : "Failed to create user profile" };
    }
  };

  // Update last active timestamp
  const markUserActive = async () => {
    if (isAuthenticated) {
      try {
        await updateLastActive();
      } catch (error) {
        console.error("Update last active error:", error);
      }
    }
  };

  return {
    user,
    userId,
    isAuthenticated,
    isLoading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    createUserProfile,
    markUserActive,
  };
}
