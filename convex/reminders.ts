import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const createReminder = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    priority: v.string(), // "low", "medium", "high", "critical"
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await auth.getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }
    const userId = user.sub;

    return await ctx.db.insert("reminders", {
      userId,
      title: args.title,
      description: args.description,
      dueDate: args.dueDate,
      priority: args.priority,
      category: args.category,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const getRemindersByUser = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await auth.getAuthenticatedUser(ctx);
    if (!user) {
      return [];
    }
    const userId = user.sub;

    const query = ctx.db
      .query("reminders")
      .withIndex("by_user", (q) => q.eq("userId", userId));

    if (args.status) {
      return await query
        .filter((q) => q.eq(q.field("status"), args.status))
        .order("desc")
        .collect();
    }

    return await query.order("desc").collect();
  },
});

export const getUpcomingReminders = query({
  args: { hoursAhead: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await auth.getAuthenticatedUser(ctx);
    if (!user) {
      return [];
    }
    const userId = user.sub;

    const hoursAhead = args.hoursAhead || 24;
    const cutoff = Date.now() + (hoursAhead * 60 * 60 * 1000);

    return await ctx.db
      .query("reminders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "pending"),
          q.lte(q.field("dueDate"), cutoff)
        )
      )
      .order("asc")
      .collect();
  },
});

export const updateReminder = mutation({
  args: {
    reminderId: v.id("reminders"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    priority: v.optional(v.string()),
    status: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await auth.getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }
    const userId = user.sub;

    const { reminderId, ...updates } = args;
    const reminder = await ctx.db.get(reminderId);

    if (!reminder || reminder.userId !== userId) {
      throw new Error("Reminder not found or access denied");
    }

    const updateData: any = updates;

    if (updates.status === "completed") {
      updateData.completedAt = Date.now();
    }

    return await ctx.db.patch(reminderId, updateData);
  },
});

export const deleteReminder = mutation({
  args: { reminderId: v.id("reminders") },
  handler: async (ctx, args) => {
    const user = await auth.getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }
    const userId = user.sub;

    const reminder = await ctx.db.get(args.reminderId);

    if (!reminder || reminder.userId !== userId) {
      throw new Error("Reminder not found or access denied");
    }

    return await ctx.db.delete(args.reminderId);
  },
});

export const getRemindersByPriority = query({
  args: { priority: v.string() },
  handler: async (ctx, args) => {
    const user = await auth.getAuthenticatedUser(ctx);
    if (!user) {
      return [];
    }
    const userId = user.sub;

    return await ctx.db
      .query("reminders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("priority"), args.priority),
          q.eq(q.field("status"), "pending")
        )
      )
      .order("asc")
      .collect();
  },
});
