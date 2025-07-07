import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  // Auth tables from Convex Auth
  ...authTables,

  // Users table - now linked to auth
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    profilePicture: v.optional(v.string()),
    timezone: v.optional(v.string()),
    createdAt: v.number(),
    lastActiveAt: v.optional(v.number()),

    // AI Personality settings
    aiPersonality: v.optional(v.object({
      tone: v.string(), // "empathetic", "analytical", "casual", "formal"
      style: v.string(), // "conversational", "professional", "friendly"
      traits: v.array(v.string()), // ["supportive", "curious", "thoughtful", etc.]
      responseLength: v.string(), // "brief", "moderate", "detailed"
      emotionalDepth: v.number(), // 1-10 scale
      memoryFocus: v.string(), // "detailed", "highlights", "patterns", "emotions"
    })),

    // Cloud sync settings
    cloudSync: v.optional(v.object({
      enabled: v.boolean(),
      provider: v.string(), // "icloud", "gdrive", "none"
      syncToken: v.optional(v.string()),
      lastSync: v.optional(v.number()),
    })),
  }),

  // Conversations table
  conversations: defineTable({
    userId: v.id("users"),
    title: v.string(),
    messages: v.array(v.object({
      role: v.string(), // "user" | "assistant"
      content: v.string(),
      timestamp: v.number(),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Characters table for AI personalities
  characters: defineTable({
    userId: v.id("users"),
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
    conversationCount: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Character conversations
  characterConversations: defineTable({
    userId: v.id("users"),
    characterId: v.id("characters"),
    title: v.string(),
    messages: v.array(v.object({
      role: v.string(), // "user" | "assistant"
      content: v.string(),
      timestamp: v.number(),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_character", ["characterId"])
    .index("by_user", ["userId"]),

  // Memories table
  memory: defineTable({
    userId: v.id("users"),
    type: v.string(), // "conversation", "personal", "goal", "reflection"
    content: v.string(),
    summary: v.string(),
    importance: v.number(), // 1-10 scale
    tags: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    metadata: v.optional(v.object({
      context: v.optional(v.string()),
      location: v.optional(v.string()),
      emotion: v.optional(v.string()),
      relatedPeople: v.optional(v.array(v.string())),
    })),
  }).index("by_user", ["userId"]),

  // Check-ins table
  checkIns: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD format
    mood: v.number(), // 1-10 scale
    emotions: v.array(v.string()),
    notes: v.optional(v.string()),
    activities: v.optional(v.array(v.string())),
    gratitude: v.optional(v.array(v.string())),
    goals: v.optional(v.array(v.string())),
    challenges: v.optional(v.array(v.string())),
    highlights: v.optional(v.array(v.string())),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Family and relationships table
  family: defineTable({
    userId: v.id("users"),
    name: v.string(),
    relationship: v.string(), // "mother", "father", "sibling", "friend", "partner", etc.
    birthday: v.optional(v.string()), // YYYY-MM-DD format
    notes: v.optional(v.string()),
    importantDates: v.optional(v.array(v.object({
      date: v.string(), // YYYY-MM-DD
      description: v.string(),
      type: v.string(), // "anniversary", "birthday", "meeting", etc.
    }))),
    contactInfo: v.optional(v.object({
      phone: v.optional(v.string()),
      email: v.optional(v.string()),
      address: v.optional(v.string()),
    })),
    preferences: v.optional(v.object({
      interests: v.optional(v.array(v.string())),
      dislikes: v.optional(v.array(v.string())),
      giftIdeas: v.optional(v.array(v.string())),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Reminders/Tasks table
  reminders: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    priority: v.string(), // "low", "medium", "high", "critical"
    category: v.optional(v.string()),
    status: v.string(), // "pending", "completed", "cancelled"
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_user", ["userId"])
    .index("by_due_date", ["dueDate"]),

  // Enhanced Custom Calendars
  customCalendars: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    color: v.string(), // hex color code
    icon: v.optional(v.string()), // icon name or emoji
    category: v.string(), // "personal", "work", "health", "finance", "family", "custom"
    isDefault: v.boolean(),
    isVisible: v.boolean(),
    settings: v.optional(v.object({
      notifications: v.boolean(),
      defaultDuration: v.optional(v.number()), // in minutes
      defaultReminder: v.optional(v.number()), // minutes before event
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Enhanced Events (replaces simple reminders)
  events: defineTable({
    userId: v.id("users"),
    calendarId: v.id("customCalendars"),
    title: v.string(),
    description: v.optional(v.string()),

    // Date and time
    startDate: v.number(), // timestamp
    endDate: v.optional(v.number()), // timestamp
    allDay: v.boolean(),
    timezone: v.optional(v.string()),

    // Event details
    type: v.string(), // "event", "task", "reminder", "bill", "birthday", "appointment"
    status: v.string(), // "scheduled", "completed", "cancelled", "in-progress"
    priority: v.string(), // "low", "medium", "high", "critical"

    // Location and people
    location: v.optional(v.string()),
    attendees: v.optional(v.array(v.string())),

    // Recurring settings
    recurring: v.optional(v.object({
      frequency: v.string(), // "daily", "weekly", "monthly", "yearly", "custom"
      interval: v.number(), // every X frequency
      daysOfWeek: v.optional(v.array(v.number())), // [0-6] for weekly
      dayOfMonth: v.optional(v.number()), // 1-31 for monthly
      monthOfYear: v.optional(v.number()), // 1-12 for yearly
      endDate: v.optional(v.number()),
      maxOccurrences: v.optional(v.number()),
    })),

    // Reminders
    reminders: v.optional(v.array(v.object({
      minutes: v.number(), // minutes before event
      type: v.string(), // "notification", "email", "sms"
    }))),

    // Task-specific fields
    completedAt: v.optional(v.number()),
    subtasks: v.optional(v.array(v.object({
      title: v.string(),
      completed: v.boolean(),
      completedAt: v.optional(v.number()),
    }))),

    // Bill-specific fields
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    isPaid: v.optional(v.boolean()),
    paidAt: v.optional(v.number()),

    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_calendar", ["calendarId"])
    .index("by_start_date", ["startDate"]),

  // Life Templates for recurring items
  lifeTemplates: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    category: v.string(), // "bills", "health", "maintenance", "personal", "work"
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
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Emotions tracking
  emotions: defineTable({
    userId: v.id("users"),
    name: v.string(),
    intensity: v.number(), // 1-10 scale
    context: v.optional(v.string()),
    triggers: v.optional(v.array(v.string())),
    timestamp: v.number(),
    checkInId: v.optional(v.id("checkIns")),
  }).index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"]),
});
