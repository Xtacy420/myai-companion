import { ConvexReactClient } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://localhost:3210";

export const convex = new ConvexReactClient(convexUrl);
