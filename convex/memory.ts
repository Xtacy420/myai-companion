import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

export const createMemory = mutation({
  args: {
    type: v.string(),
    content: v.string(),
    summary: v.string(),
    importance: v.number(),
    tags: v.array(v.string()),
    metadata: v.optional(v.object({
      context: v.optional(v.string()),
      location: v.optional(v.string()),
      emotion: v.optional(v.string()),
      relatedPeople: v.optional(v.array(v.string())),
    })),
  },
  handler: async (ctx, args) => {
    const user = await auth.getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }
    const userId = user.sub;

    return await ctx.db.insert("memory", {
      userId,
      type: args.type,
      content: args.content,
      summary: args.summary,
      importance: args.importance,
      tags: args.tags,
      metadata: args.metadata,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const getMemoriesByUser = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await auth.getAuthenticatedUser(ctx);
    if (!user) {
      return [];
    }
    const userId = user.sub;

    let query = ctx.db
      .query("memory")
      .filter((q) => q.eq(q.field("userId"), userId))
      .order("desc");

    if (args.limit) {
      return await query.take(args.limit);
    }

    return await query.collect();
  },
});

export const getMemory = query({
  args: { memoryId: v.id("memory") },
  handler: async (ctx, args) => {
    const user = await auth.getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }
    const userId = user.sub;

    const memory = await ctx.db.get(args.memoryId);

    // Ensure user can only access their own memories
    if (!memory || memory.userId !== userId) {
      throw new Error("Memory not found or access denied");
    }

    return memory;
  },
});

export const updateMemory = mutation({
  args: {
    memoryId: v.id("memory"),
    type: v.optional(v.string()),
    content: v.optional(v.string()),
    summary: v.optional(v.string()),
    importance: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    metadata: v.optional(v.object({
      context: v.optional(v.string()),
      location: v.optional(v.string()),
      emotion: v.optional(v.string()),
      relatedPeople: v.optional(v.array(v.string())),
    })),
  },
  handler: async (ctx, args) => {
    const user = await auth.getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }
    const userId = user.sub;

    const { memoryId, ...updates } = args;
    const memory = await ctx.db.get(memoryId);

    if (!memory || memory.userId !== userId) {
      throw new Error("Memory not found or access denied");
    }

    await ctx.db.patch(memoryId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return memoryId;
  },
});

export const deleteMemory = mutation({
  args: { memoryId: v.id("memory") },
  handler: async (ctx, args) => {
    const user = await auth.getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }
    const userId = user.sub;

    const memory = await ctx.db.get(args.memoryId);

    if (!memory || memory.userId !== userId) {
      throw new Error("Memory not found or access denied");
    }

    await ctx.db.delete(args.memoryId);
    return args.memoryId;
  },
});

export const searchMemories = query({
  args: {
    query: v.string(),
    tags: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await auth.getAuthenticatedUser(ctx);
    if (!user) {
      return [];
    }
    const userId = user.sub;

    // Simple text search in content and summary
    const allMemories = await ctx.db
      .query("memory")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    const searchTerm = args.query.toLowerCase();
    let filtered = allMemories.filter(memory =>
      memory.content.toLowerCase().includes(searchTerm) ||
      memory.summary.toLowerCase().includes(searchTerm) ||
      memory.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );

    // Filter by tags if provided
    if (args.tags && args.tags.length > 0) {
      filtered = filtered.filter(memory =>
        args.tags!.some(tag => memory.tags.includes(tag))
      );
    }

    // Sort by importance and recency
    filtered.sort((a, b) => {
      const importanceDiff = b.importance - a.importance;
      if (importanceDiff !== 0) return importanceDiff;
      return b.createdAt - a.createdAt;
    });

    if (args.limit) {
      filtered = filtered.slice(0, args.limit);
    }

    return filtered;
  },
});

export const getMemoriesByType = query({
  args: {
    type: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await auth.getAuthenticatedUser(ctx);
    if (!user) {
      return [];
    }
    const userId = user.sub;

    let query = ctx.db
      .query("memory")
      .filter((q) => q.and(
        q.eq(q.field("userId"), userId),
        q.eq(q.field("type"), args.type)
      ))
      .order("desc");

    if (args.limit) {
      return await query.take(args.limit);
    }

    return await query.collect();
  },
});

export const getMemoryStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await auth.getAuthenticatedUser(ctx);
    if (!user) {
      return {
        total: 0,
        byType: {},
        averageImportance: 0,
        totalTags: 0,
      };
    }
    const userId = user.sub;

    const memories = await ctx.db
      .query("memory")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    const byType: Record<string, number> = {};
    let totalImportance = 0;
    const allTags = new Set<string>();

    for (const memory of memories) {
      byType[memory.type] = (byType[memory.type] || 0) + 1;
      totalImportance += memory.importance;
      memory.tags.forEach(tag => allTags.add(tag));
    }

    return {
      total: memories.length,
      byType,
      averageImportance: memories.length > 0 ? totalImportance / memories.length : 0,
      totalTags: allTags.size,
    };
  },
});
