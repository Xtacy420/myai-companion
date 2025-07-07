import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const createCharacter = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    personality: v.object({
      traits: v.array(v.string()),
      tone: v.string(),
      expertise: v.array(v.string()),
      responseStyle: v.string(),
    }),
    avatar: v.optional(v.string()),
    backstory: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const now = Date.now();
    return await ctx.db.insert("characters", {
      userId,
      name: args.name,
      description: args.description,
      personality: args.personality,
      avatar: args.avatar,
      backstory: args.backstory,
      conversationCount: 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getCharactersByUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("characters")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getCharacter = query({
  args: { characterId: v.id("characters") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const character = await ctx.db.get(args.characterId);

    // Ensure user can only access their own characters
    if (!character || character.userId !== userId) {
      throw new Error("Character not found or access denied");
    }

    return character;
  },
});

export const updateCharacter = mutation({
  args: {
    characterId: v.id("characters"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    personality: v.optional(v.object({
      traits: v.array(v.string()),
      tone: v.string(),
      expertise: v.array(v.string()),
      responseStyle: v.string(),
    })),
    avatar: v.optional(v.string()),
    backstory: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const { characterId, ...updates } = args;
    const character = await ctx.db.get(characterId);

    if (!character || character.userId !== userId) {
      throw new Error("Character not found or access denied");
    }

    return await ctx.db.patch(characterId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const deleteCharacter = mutation({
  args: { characterId: v.id("characters") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const character = await ctx.db.get(args.characterId);

    if (!character || character.userId !== userId) {
      throw new Error("Character not found or access denied");
    }

    // Delete all conversations for this character
    const conversations = await ctx.db
      .query("characterConversations")
      .withIndex("by_character", (q) => q.eq("characterId", args.characterId))
      .collect();

    await Promise.all(
      conversations.map(conv => ctx.db.delete(conv._id))
    );

    // Delete the character
    return await ctx.db.delete(args.characterId);
  },
});

export const createCharacterConversation = mutation({
  args: {
    characterId: v.id("characters"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Verify character belongs to user
    const character = await ctx.db.get(args.characterId);
    if (!character || character.userId !== userId) {
      throw new Error("Character not found or access denied");
    }

    const now = Date.now();
    return await ctx.db.insert("characterConversations", {
      userId,
      characterId: args.characterId,
      title: args.title,
      messages: [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const addCharacterMessage = mutation({
  args: {
    conversationId: v.id("characterConversations"),
    role: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found or access denied");
    }

    const newMessage = {
      role: args.role,
      content: args.content,
      timestamp: Date.now(),
    };

    const updatedMessages = [...conversation.messages, newMessage];

    return await ctx.db.patch(args.conversationId, {
      messages: updatedMessages,
      updatedAt: Date.now(),
    });
  },
});

export const getCharacterConversations = query({
  args: { characterId: v.id("characters") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("characterConversations")
      .withIndex("by_character", (q) => q.eq("characterId", args.characterId))
      .order("desc")
      .collect();
  },
});

export const getCharacterConversation = query({
  args: { conversationId: v.id("characterConversations") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const conversation = await ctx.db.get(args.conversationId);

    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found or access denied");
    }

    return conversation;
  },
});

export const incrementCharacterUsage = mutation({
  args: { characterId: v.id("characters") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const character = await ctx.db.get(args.characterId);
    if (!character || character.userId !== userId) {
      throw new Error("Character not found or access denied");
    }

    await ctx.db.patch(args.characterId, {
      conversationCount: (character.conversationCount || 0) + 1,
      updatedAt: Date.now(),
    });

    return args.characterId;
  },
});
