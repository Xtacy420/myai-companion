import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

// Get current authenticated user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return null;
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    return user;
  },
});

// Create or update user profile
export const createOrUpdateUser = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    profilePicture: v.optional(v.string()),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const existingUser = await ctx.db.get(userId);

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(userId, {
        name: args.name,
        email: args.email,
        profilePicture: args.profilePicture,
        timezone: args.timezone,
        lastActiveAt: Date.now(),
      });

      return userId;
    } else {
      // Create new user profile
      const newUserId = await ctx.db.insert("users", {
        name: args.name,
        email: args.email,
        profilePicture: args.profilePicture,
        timezone: args.timezone,
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
      });

      return newUserId;
    }
  },
});

// Get user by ID
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUserId = await auth.getUserId(ctx);

    // Users can only access their own data
    if (currentUserId !== args.userId) {
      throw new Error("Unauthorized");
    }

    return await ctx.db.get(args.userId);
  },
});

// Update AI personality settings
export const updateAIPersonality = mutation({
  args: {
    tone: v.string(),
    style: v.string(),
    traits: v.array(v.string()),
    responseLength: v.string(),
    emotionalDepth: v.number(),
    memoryFocus: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    await ctx.db.patch(userId, {
      aiPersonality: {
        tone: args.tone,
        style: args.style,
        traits: args.traits,
        responseLength: args.responseLength,
        emotionalDepth: args.emotionalDepth,
        memoryFocus: args.memoryFocus,
      },
    });

    return userId;
  },
});

// Update cloud sync settings
export const updateCloudSync = mutation({
  args: {
    enabled: v.boolean(),
    provider: v.string(),
    syncToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const cloudSync = {
      enabled: args.enabled,
      provider: args.provider,
      syncToken: args.syncToken,
      lastSync: args.enabled ? Date.now() : undefined,
    };

    await ctx.db.patch(userId, {
      cloudSync,
    });

    return userId;
  },
});

// Update user last active timestamp
export const updateLastActive = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    await ctx.db.patch(userId, {
      lastActiveAt: Date.now(),
    });

    return userId;
  },
});
