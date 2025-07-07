# /src/app Directory

This directory is the core of the application's routing and page structure, following the Next.js App Router conventions.

## Root Files:

- **`layout.tsx`**: The root layout for the entire application. It sets up the basic HTML structure, includes global styles, and wraps all pages. It previously contained the `ConvexClientProvider` but is being simplified for the local-first approach.

- **`globals.css`**: Contains global CSS styles and Tailwind CSS imports. Any style defined here will be available across the entire application.

- **`page.tsx`**: The main landing page of the application. It currently handles the initial redirection to the `/home` route for login/registration.

- **`ConvexClientProvider.tsx`**: (Deprecated) A component that provided the Convex client to the application. This is no longer needed for the local-first architecture.

## Sub-directories (Pages):

Each sub-directory represents a distinct page or route in the application.

- **/activity:** The user's activity dashboard, showing stats and recent events.
- **/api:** Contains backend API routes. The `chat` subdirectory has the endpoint for communicating with the Venice AI service.
- **/calendar:** The interactive calendar page for managing events.
- **/chat:** The main chat interface for interacting with the AI companion.
- **/home:** The login and registration page.
- **/profile:** The user's profile page, where they can manage their data and settings.
