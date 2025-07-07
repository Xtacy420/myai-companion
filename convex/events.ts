import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new event
export const createEvent = mutation({
  args: {
    calendarId: v.id("customCalendars"),
    title: v.string(),
    description: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    allDay: v.boolean(),
    timezone: v.optional(v.string()),
    type: v.string(),
    priority: v.string(),
    location: v.optional(v.string()),
    attendees: v.optional(v.array(v.string())),
    recurring: v.optional(v.object({
      frequency: v.string(),
      interval: v.number(),
      daysOfWeek: v.optional(v.array(v.number())),
      dayOfMonth: v.optional(v.number()),
      monthOfYear: v.optional(v.number()),
      endDate: v.optional(v.number()),
      maxOccurrences: v.optional(v.number()),
    })),
    reminders: v.optional(v.array(v.object({
      minutes: v.number(),
      type: v.string(),
    }))),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }
    const userId = identity.subject;

    // Verify calendar belongs to user
    const calendar = await ctx.db.get(args.calendarId);
    if (!calendar || calendar.userId !== userId) {
      throw new Error("Calendar not found or access denied");
    }

    return await ctx.db.insert("events", {
      userId,
      calendarId: args.calendarId,
      title: args.title,
      description: args.description,
      startDate: args.startDate,
      endDate: args.endDate,
      allDay: args.allDay,
      timezone: args.timezone,
      type: args.type,
      status: "scheduled",
      priority: args.priority,
      location: args.location,
      attendees: args.attendees,
      recurring: args.recurring,
      reminders: args.reminders,
      amount: args.amount,
      currency: args.currency,
      isPaid: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Get events for authenticated user
export const getUserEvents = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    calendarIds: v.optional(v.array(v.id("customCalendars"))),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const userId = identity.subject;

    let query = ctx.db
      .query("events")
      .filter((q) => q.eq(q.field("userId"), userId));

    const events = await query.collect();

    // Filter by date range if provided
    let filteredEvents = events;
    if (args.startDate && args.endDate) {
      filteredEvents = events.filter(event =>
        event.startDate >= args.startDate! && event.startDate <= args.endDate!
      );
    }

    // Filter by calendar IDs if provided
    if (args.calendarIds && args.calendarIds.length > 0) {
      filteredEvents = filteredEvents.filter(event =>
        args.calendarIds!.includes(event.calendarId)
      );
    }

    // Filter by type if provided
    if (args.type) {
      filteredEvents = filteredEvents.filter(event => event.type === args.type);
    }

    return filteredEvents.sort((a, b) => a.startDate - b.startDate);
  },
});

// Get upcoming events (next 7 days)
export const getUpcomingEvents = query({
  args: {
    daysAhead: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const userId = identity.subject;

    const now = Date.now();
    const daysAhead = args.daysAhead || 7;
    const limit = args.limit || 10;
    const endTime = now + (daysAhead * 24 * 60 * 60 * 1000);

    const events = await ctx.db
      .query("events")
      .filter((q) => q.and(
        q.eq(q.field("userId"), userId),
        q.gte(q.field("startDate"), now),
        q.lte(q.field("startDate"), endTime)
      ))
      .order("asc")
      .take(limit);

    return events;
  },
});

// Update event
export const updateEvent = mutation({
  args: {
    eventId: v.id("events"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    allDay: v.optional(v.boolean()),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    location: v.optional(v.string()),
    attendees: v.optional(v.array(v.string())),
    isPaid: v.optional(v.boolean()),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }
    const userId = identity.subject;

    const { eventId, ...updates } = args;
    const event = await ctx.db.get(eventId);

    if (!event || event.userId !== userId) {
      throw new Error("Event not found or access denied");
    }

    // If marking as completed, set completedAt
    if (updates.status === "completed" && !updates.completedAt) {
      updates.completedAt = Date.now();
    }

    // If marking as paid, set paidAt
    if (updates.isPaid && !event.paidAt) {
      (updates as any).paidAt = Date.now();
    }

    await ctx.db.patch(eventId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return eventId;
  },
});

// Delete event
export const deleteEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }
    const userId = identity.subject;

    const event = await ctx.db.get(args.eventId);

    if (!event || event.userId !== userId) {
      throw new Error("Event not found or access denied");
    }

    await ctx.db.delete(args.eventId);
    return args.eventId;
  },
});

// Get events by type with stats
export const getEventsByType = query({
  args: {
    type: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { events: [], stats: { total: 0, completed: 0, pending: 0 } };
    }
    const userId = identity.subject;

    const events = await ctx.db
      .query("events")
      .filter((q) => q.and(
        q.eq(q.field("userId"), userId),
        q.eq(q.field("type"), args.type)
      ))
      .order("desc")
      .collect();

    const limitedEvents = args.limit ? events.slice(0, args.limit) : events;

    const stats = {
      total: events.length,
      completed: events.filter(e => e.status === "completed").length,
      pending: events.filter(e => e.status === "scheduled").length,
      overdue: events.filter(e =>
        e.status === "scheduled" && e.startDate < Date.now()
      ).length,
    };

    return { events: limitedEvents, stats };
  },
});

// Get bills/financial events
export const getBills = query({
  args: {
    year: v.optional(v.number()),
    month: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const userId = identity.subject;

    let startDate, endDate;
    if (args.year && args.month) {
      startDate = new Date(args.year, args.month - 1, 1).getTime();
      endDate = new Date(args.year, args.month, 0, 23, 59, 59).getTime();
    }

    const bills = await ctx.db
      .query("events")
      .filter((q) => q.and(
        q.eq(q.field("userId"), userId),
        q.eq(q.field("type"), "bill")
      ))
      .collect();

    let filteredBills = bills;
    if (startDate && endDate) {
      filteredBills = bills.filter(bill =>
        bill.startDate >= startDate && bill.startDate <= endDate
      );
    }

    return filteredBills.sort((a, b) => a.startDate - b.startDate);
  },
});

// Get birthday reminders
export const getBirthdays = query({
  args: {
    daysAhead: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const userId = identity.subject;

    const now = Date.now();
    const daysAhead = args.daysAhead || 30;
    const endTime = now + (daysAhead * 24 * 60 * 60 * 1000);

    const birthdays = await ctx.db
      .query("events")
      .filter((q) => q.and(
        q.eq(q.field("userId"), userId),
        q.eq(q.field("type"), "birthday"),
        q.gte(q.field("startDate"), now),
        q.lte(q.field("startDate"), endTime)
      ))
      .order("asc")
      .collect();

    return birthdays;
  },
});
