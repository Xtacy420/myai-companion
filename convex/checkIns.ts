import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const createCheckIn = mutation({
  args: {
    date: v.string(),
    mood: v.number(),
    emotions: v.array(v.string()),
    highlights: v.optional(v.array(v.string())),
    challenges: v.optional(v.array(v.string())),
    goals: v.optional(v.array(v.string())),
    gratitude: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    activities: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Check if check-in already exists for this date
    const existingCheckIn = await ctx.db
      .query("checkIns")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("date"), args.date))
      .first();

    if (existingCheckIn) {
      // Update existing check-in
      return await ctx.db.patch(existingCheckIn._id, {
        mood: args.mood,
        emotions: args.emotions,
        highlights: args.highlights,
        challenges: args.challenges,
        goals: args.goals,
        gratitude: args.gratitude,
        notes: args.notes,
        activities: args.activities,
      });
    }

    return await ctx.db.insert("checkIns", {
      userId,
      date: args.date,
      mood: args.mood,
      emotions: args.emotions,
      highlights: args.highlights,
      challenges: args.challenges,
      goals: args.goals,
      gratitude: args.gratitude,
      notes: args.notes,
      activities: args.activities,
      createdAt: Date.now(),
    });
  },
});

export const getCheckInsByUser = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return [];
    }

    const query = ctx.db
      .query("checkIns")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc");

    if (args.limit) {
      return await query.take(args.limit);
    }

    return await query.collect();
  },
});

export const getCheckInByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return null;
    }

    return await ctx.db
      .query("checkIns")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("date"), args.date))
      .first();
  },
});

export const getMoodTrend = query({
  args: { days: v.number() },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return [];
    }

    const checkIns = await ctx.db
      .query("checkIns")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.days);

    return checkIns.map(checkIn => ({
      date: checkIn.date,
      mood: checkIn.mood,
      emotions: checkIn.emotions,
    }));
  },
});
