import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

// Create a new custom calendar
export const createCalendar = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.optional(v.string()),
    category: v.string(),
    isDefault: v.optional(v.boolean()),
    settings: v.optional(v.object({
      notifications: v.boolean(),
      defaultDuration: v.optional(v.number()),
      defaultReminder: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const user = await auth.getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }
    const userId = user.sub;

    return await ctx.db.insert("customCalendars", {
      userId,
      name: args.name,
      description: args.description,
      color: args.color,
      icon: args.icon,
      category: args.category,
      isDefault: args.isDefault || false,
      isVisible: true,
      settings: args.settings,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Get all calendars for authenticated user
export const getUserCalendars = query({
  args: {},
  handler: async (ctx) => {
    const user = await auth.getAuthenticatedUser(ctx);
    if (!user) {
      return [];
    }
    const userId = user.sub;

    return await ctx.db
      .query("customCalendars")
      .filter((q) => q.eq(q.field("userId"), userId))
      .order("desc")
      .collect();
  },
});

// Update calendar
export const updateCalendar = mutation({
  args: {
    calendarId: v.id("customCalendars"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    category: v.optional(v.string()),
    isVisible: v.optional(v.boolean()),
    settings: v.optional(v.object({
      notifications: v.boolean(),
      defaultDuration: v.optional(v.number()),
      defaultReminder: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const user = await auth.getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }
    const userId = user.sub;

    const { calendarId, ...updates } = args;
    const calendar = await ctx.db.get(calendarId);

    if (!calendar || calendar.userId !== userId) {
      throw new Error("Calendar not found or access denied");
    }

    await ctx.db.patch(calendarId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return calendarId;
  },
});

// Delete calendar
export const deleteCalendar = mutation({
  args: { calendarId: v.id("customCalendars") },
  handler: async (ctx, args) => {
    const user = await auth.getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }
    const userId = user.sub;

    const calendar = await ctx.db.get(args.calendarId);

    if (!calendar || calendar.userId !== userId) {
      throw new Error("Calendar not found or access denied");
    }

    // Check if it's the default calendar
    if (calendar.isDefault) {
      throw new Error("Cannot delete default calendar");
    }

    // Delete all events in this calendar
    const events = await ctx.db
      .query("events")
      .filter((q) => q.and(
        q.eq(q.field("userId"), userId),
        q.eq(q.field("calendarId"), args.calendarId)
      ))
      .collect();

    for (const event of events) {
      await ctx.db.delete(event._id);
    }

    await ctx.db.delete(args.calendarId);
    return args.calendarId;
  },
});

// Initialize default calendars for new user
export const initializeDefaultCalendars = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await auth.getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }
    const userId = user.sub;

    // Check if user already has calendars
    const existingCalendars = await ctx.db
      .query("customCalendars")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    if (existingCalendars.length > 0) {
      return existingCalendars;
    }

    // Create default calendars
    const defaultCalendars = [
      {
        name: "Personal",
        description: "Personal events and reminders",
        color: "#3b82f6",
        icon: "👤",
        category: "personal",
        isDefault: true,
      },
      {
        name: "Work",
        description: "Work-related events and deadlines",
        color: "#10b981",
        icon: "💼",
        category: "work",
        isDefault: false,
      },
      {
        name: "Health & Wellness",
        description: "Medical appointments and health reminders",
        color: "#ef4444",
        icon: "🏥",
        category: "health",
        isDefault: false,
      },
      {
        name: "Finance",
        description: "Bills, payments, and financial deadlines",
        color: "#f59e0b",
        icon: "💳",
        category: "finance",
        isDefault: false,
      },
      {
        name: "Family",
        description: "Family events, birthdays, and celebrations",
        color: "#8b5cf6",
        icon: "👨‍👩‍👧‍👦",
        category: "family",
        isDefault: false,
      },
    ];

    const createdCalendars = [];
    for (const calendar of defaultCalendars) {
      const calendarId = await ctx.db.insert("customCalendars", {
        userId,
        ...calendar,
        isVisible: true,
        settings: {
          notifications: true,
          defaultDuration: 60,
          defaultReminder: 15,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      createdCalendars.push(calendarId);
    }

    return createdCalendars;
  },
});
