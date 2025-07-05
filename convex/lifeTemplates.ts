import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

// Create a new life template
export const createTemplate = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    template: v.object({
      title: v.string(),
      type: v.string(),
      recurring: v.object({
        frequency: v.string(),
        interval: v.number(),
        daysOfWeek: v.optional(v.array(v.number())),
        dayOfMonth: v.optional(v.number()),
      }),
      defaultReminders: v.optional(v.array(v.object({
        minutes: v.number(),
        type: v.string(),
      }))),
      metadata: v.optional(v.object({
        amount: v.optional(v.number()),
        provider: v.optional(v.string()),
        accountNumber: v.optional(v.string()),
      })),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    return await ctx.db.insert("lifeTemplates", {
      userId,
      name: args.name,
      description: args.description,
      category: args.category,
      template: args.template,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Get user's life templates
export const getUserTemplates = query({
  args: {
    category: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return [];
    }

    let query = ctx.db
      .query("lifeTemplates")
      .filter((q) => q.eq(q.field("userId"), userId));

    const templates = await query.collect();

    let filteredTemplates = templates;

    if (args.category) {
      filteredTemplates = filteredTemplates.filter(t => t.category === args.category);
    }

    if (args.isActive !== undefined) {
      filteredTemplates = filteredTemplates.filter(t => t.isActive === args.isActive);
    }

    return filteredTemplates.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Update template
export const updateTemplate = mutation({
  args: {
    templateId: v.id("lifeTemplates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    template: v.optional(v.object({
      title: v.string(),
      type: v.string(),
      recurring: v.object({
        frequency: v.string(),
        interval: v.number(),
        daysOfWeek: v.optional(v.array(v.number())),
        dayOfMonth: v.optional(v.number()),
      }),
      defaultReminders: v.optional(v.array(v.object({
        minutes: v.number(),
        type: v.string(),
      }))),
      metadata: v.optional(v.object({
        amount: v.optional(v.number()),
        provider: v.optional(v.string()),
        accountNumber: v.optional(v.string()),
      })),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const { templateId, ...updates } = args;
    const template = await ctx.db.get(templateId);

    if (!template || template.userId !== userId) {
      throw new Error("Template not found or access denied");
    }

    await ctx.db.patch(templateId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return templateId;
  },
});

// Delete template
export const deleteTemplate = mutation({
  args: { templateId: v.id("lifeTemplates") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const template = await ctx.db.get(args.templateId);

    if (!template || template.userId !== userId) {
      throw new Error("Template not found or access denied");
    }

    await ctx.db.delete(args.templateId);
    return args.templateId;
  },
});

// Create events from template
export const createEventsFromTemplate = mutation({
  args: {
    templateId: v.id("lifeTemplates"),
    calendarId: v.id("customCalendars"),
    startDate: v.number(),
    numberOfOccurrences: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const template = await ctx.db.get(args.templateId);
    const calendar = await ctx.db.get(args.calendarId);

    if (!template || template.userId !== userId) {
      throw new Error("Template not found or access denied");
    }

    if (!calendar || calendar.userId !== userId) {
      throw new Error("Calendar not found or access denied");
    }

    const { template: templateData } = template;
    const numberOfOccurrences = args.numberOfOccurrences || 12; // Default 12 occurrences
    const createdEvents = [];

    for (let i = 0; i < numberOfOccurrences; i++) {
      const eventDate = calculateNextOccurrence(
        args.startDate,
        templateData.recurring,
        i
      );

      const eventId = await ctx.db.insert("events", {
        userId,
        calendarId: args.calendarId,
        title: templateData.title,
        description: `Generated from template: ${template.name}`,
        startDate: eventDate,
        allDay: true,
        type: templateData.type,
        status: "scheduled",
        priority: "medium",
        recurring: templateData.recurring,
        reminders: templateData.defaultReminders,
        amount: templateData.metadata?.amount,
        currency: "USD",
        isPaid: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      createdEvents.push(eventId);
    }

    return createdEvents;
  },
});

// Initialize default templates for new users
export const initializeDefaultTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Check if user already has templates
    const existingTemplates = await ctx.db
      .query("lifeTemplates")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    if (existingTemplates.length > 0) {
      return existingTemplates;
    }

    const defaultTemplates = [
      {
        name: "Monthly Bills",
        description: "Template for monthly recurring bills",
        category: "bills",
        template: {
          title: "Monthly Bill Payment",
          type: "bill",
          recurring: {
            frequency: "monthly",
            interval: 1,
            dayOfMonth: 1,
          },
          defaultReminders: [
            { minutes: 2880, type: "notification" }, // 2 days before
            { minutes: 1440, type: "notification" }, // 1 day before
          ],
          metadata: {
            amount: 0,
            provider: "",
            accountNumber: "",
          },
        },
      },
      {
        name: "Health Check-up",
        description: "Annual health and medical check-ups",
        category: "health",
        template: {
          title: "Annual Health Check-up",
          type: "appointment",
          recurring: {
            frequency: "yearly",
            interval: 1,
          },
          defaultReminders: [
            { minutes: 10080, type: "notification" }, // 1 week before
            { minutes: 1440, type: "notification" }, // 1 day before
          ],
        },
      },
      {
        name: "Weekly Planning",
        description: "Weekly planning and review sessions",
        category: "personal",
        template: {
          title: "Weekly Planning Session",
          type: "task",
          recurring: {
            frequency: "weekly",
            interval: 1,
            daysOfWeek: [0], // Sunday
          },
          defaultReminders: [
            { minutes: 30, type: "notification" },
          ],
        },
      },
      {
        name: "Vehicle Maintenance",
        description: "Regular vehicle maintenance reminders",
        category: "maintenance",
        template: {
          title: "Vehicle Maintenance",
          type: "reminder",
          recurring: {
            frequency: "monthly",
            interval: 3, // Every 3 months
          },
          defaultReminders: [
            { minutes: 10080, type: "notification" }, // 1 week before
          ],
        },
      },
    ];

    const createdTemplates = [];
    for (const template of defaultTemplates) {
      const templateId = await ctx.db.insert("lifeTemplates", {
        userId,
        ...template,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      createdTemplates.push(templateId);
    }

    return createdTemplates;
  },
});

// Helper function to calculate next occurrence
function calculateNextOccurrence(
  startDate: number,
  recurring: {
    frequency: string;
    interval: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
  },
  occurrenceIndex: number
): number {
  const baseDate = new Date(startDate);

  switch (recurring.frequency) {
    case "daily":
      return baseDate.getTime() + (occurrenceIndex * recurring.interval * 24 * 60 * 60 * 1000);

    case "weekly":
      return baseDate.getTime() + (occurrenceIndex * recurring.interval * 7 * 24 * 60 * 60 * 1000);

    case "monthly":
      const monthlyDate = new Date(baseDate);
      monthlyDate.setMonth(monthlyDate.getMonth() + (occurrenceIndex * recurring.interval));
      if (recurring.dayOfMonth) {
        monthlyDate.setDate(recurring.dayOfMonth);
      }
      return monthlyDate.getTime();

    case "yearly":
      const yearlyDate = new Date(baseDate);
      yearlyDate.setFullYear(yearlyDate.getFullYear() + (occurrenceIndex * recurring.interval));
      return yearlyDate.getTime();

    default:
      return baseDate.getTime();
  }
}
