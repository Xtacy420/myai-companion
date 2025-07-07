import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const recordEmotion = mutation({
  args: {
    name: v.string(),
    intensity: v.number(),
    context: v.optional(v.string()),
    triggers: v.optional(v.array(v.string())),
    checkInId: v.optional(v.id("checkIns")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }
    const userId = identity.subject;

    return await ctx.db.insert("emotions", {
      userId,
      name: args.name,
      intensity: args.intensity,
      context: args.context,
      triggers: args.triggers,
      checkInId: args.checkInId,
      timestamp: Date.now(),
    });
  },
});

export const getEmotionsByUser = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const userId = identity.subject;

    const query = ctx.db
      .query("emotions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc");

    if (args.limit) {
      return await query.take(args.limit);
    }

    return await query.collect();
  },
});

export const getEmotionTrends = query({
  args: { days: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {};
    }
    const userId = identity.subject;

    const startDate = Date.now() - (args.days * 24 * 60 * 60 * 1000);

    const emotions = await ctx.db
      .query("emotions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("timestamp"), startDate))
      .order("desc")
      .collect();

    // Group emotions by day
    const emotionsByDay: { [key: string]: Array<{ emotion: string; intensity: number }> } = {};

    emotions.forEach(emotion => {
      const date = new Date(emotion.timestamp).toISOString().split('T')[0];
      if (!emotionsByDay[date]) {
        emotionsByDay[date] = [];
      }
      emotionsByDay[date].push({
        emotion: emotion.name,
        intensity: emotion.intensity,
      });
    });

    return emotionsByDay;
  },
});

export const getEmotionStats = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const userId = identity.subject;

    const days = args.days || 30;
    const startDate = Date.now() - (days * 24 * 60 * 60 * 1000);

    const emotions = await ctx.db
      .query("emotions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("timestamp"), startDate))
      .collect();

    // Calculate emotion frequency
    const emotionCounts: { [key: string]: number } = {};
    const intensitySum: { [key: string]: number } = {};

    emotions.forEach(emotion => {
      emotionCounts[emotion.name] = (emotionCounts[emotion.name] || 0) + 1;
      intensitySum[emotion.name] = (intensitySum[emotion.name] || 0) + emotion.intensity;
    });

    // Calculate averages
    const emotionStats = Object.keys(emotionCounts).map(emotion => ({
      emotion,
      count: emotionCounts[emotion],
      averageIntensity: intensitySum[emotion] / emotionCounts[emotion],
    }));

    return emotionStats.sort((a, b) => b.count - a.count);
  },
});

export const deleteEmotion = mutation({
  args: { emotionId: v.id("emotions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }
    const userId = identity.subject;

    const emotion = await ctx.db.get(args.emotionId);

    if (!emotion || emotion.userId !== userId) {
      throw new Error("Emotion not found or access denied");
    }

    return await ctx.db.delete(args.emotionId);
  },
});
