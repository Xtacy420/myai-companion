import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const addFamilyMember = mutation({
  args: {
    name: v.string(),
    relationship: v.string(),
    birthday: v.optional(v.string()),
    notes: v.optional(v.string()),
    importantDates: v.optional(v.array(v.object({
      date: v.string(),
      description: v.string(),
      type: v.string(),
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
  },
  handler: async (ctx, args) => {
    const user = await auth.getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }
    const userId = user.sub;

    const now = Date.now();
    return await ctx.db.insert("family", {
      userId,
      name: args.name,
      relationship: args.relationship,
      birthday: args.birthday,
      notes: args.notes,
      importantDates: args.importantDates,
      contactInfo: args.contactInfo,
      preferences: args.preferences,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getFamilyMembers = query({
  args: {},
  handler: async (ctx) => {
    const user = await auth.getAuthenticatedUser(ctx);
    if (!user) {
      return [];
    }
    const userId = user.sub;

    return await ctx.db
      .query("family")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("asc")
      .collect();
  },
});

export const updateFamilyMember = mutation({
  args: {
    familyMemberId: v.id("family"),
    name: v.optional(v.string()),
    relationship: v.optional(v.string()),
    birthday: v.optional(v.string()),
    notes: v.optional(v.string()),
    importantDates: v.optional(v.array(v.object({
      date: v.string(),
      description: v.string(),
      type: v.string(),
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
  },
  handler: async (ctx, args) => {
    const user = await auth.getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }
    const userId = user.sub;

    const { familyMemberId, ...updates } = args;
    const member = await ctx.db.get(familyMemberId);

    if (!member || member.userId !== userId) {
      throw new Error("Family member not found or access denied");
    }

    return await ctx.db.patch(familyMemberId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const deleteFamilyMember = mutation({
  args: { familyMemberId: v.id("family") },
  handler: async (ctx, args) => {
    const user = await auth.getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }
    const userId = user.sub;

    const member = await ctx.db.get(args.familyMemberId);

    if (!member || member.userId !== userId) {
      throw new Error("Family member not found or access denied");
    }

    return await ctx.db.delete(args.familyMemberId);
  },
});

export const getUpcomingBirthdays = query({
  args: { daysAhead: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await auth.getAuthenticatedUser(ctx);
    if (!user) {
      return [];
    }
    const userId = user.sub;

    const familyMembers = await ctx.db
      .query("family")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.neq(q.field("birthday"), undefined))
      .collect();

    const today = new Date();
    const daysAhead = args.daysAhead || 30;
    const futureDate = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    return familyMembers
      .map(member => {
        if (!member.birthday) return null;

        const birthday = new Date(member.birthday);
        const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());

        if (thisYearBirthday < today) {
          thisYearBirthday.setFullYear(today.getFullYear() + 1);
        }

        if (thisYearBirthday <= futureDate) {
          const daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
          return {
            ...member,
            daysUntilBirthday: daysUntil,
            birthdayThisYear: thisYearBirthday.toISOString().split('T')[0],
          };
        }

        return null;
      })
      .filter(Boolean)
      .sort((a, b) => a!.daysUntilBirthday - b!.daysUntilBirthday);
  },
});
