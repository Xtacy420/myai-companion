/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as characters from "../characters.js";
import type * as checkIns from "../checkIns.js";
import type * as conversations from "../conversations.js";
import type * as customCalendars from "../customCalendars.js";
import type * as emotions from "../emotions.js";
import type * as events from "../events.js";
import type * as family from "../family.js";
import type * as http from "../http.js";
import type * as lifeTemplates from "../lifeTemplates.js";
import type * as memory from "../memory.js";
import type * as reminders from "../reminders.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  characters: typeof characters;
  checkIns: typeof checkIns;
  conversations: typeof conversations;
  customCalendars: typeof customCalendars;
  emotions: typeof emotions;
  events: typeof events;
  family: typeof family;
  http: typeof http;
  lifeTemplates: typeof lifeTemplates;
  memory: typeof memory;
  reminders: typeof reminders;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
