# Convex Backend (Deprecated)

**This directory contains the backend logic and data schema that was used when the application was built on the Convex platform. It is now considered deprecated and is in the process of being completely replaced by the local-first architecture using Dexie (IndexedDB).**

While these files are no longer in active use, they are preserved here for reference during the final stages of the migration.

## File Overview:

- **`schema.ts`**: Defines the data models (tables) for the entire application, such as `users`, `memories`, `conversations`, `events`, etc. It specifies the fields and data types for each table.

- **`auth.ts`, `http.ts`**: Configuration files for setting up Convex authentication and HTTP actions.

- **Function Files (`users.ts`, `characters.ts`, `memory.ts`, etc.)**: Each of these files contains the server-side functions (queries and mutations) for interacting with a specific data model. For example:
  - `users.ts`: Handled creating, reading, and updating user profiles.
  - `memory.ts`: Handled the creation, retrieval, and searching of user memories.
  - `conversations.ts`: Managed chat conversation data.

**Status:** **DEPRECATED**. All functionality previously handled by these files is being migrated to local services found in `src/lib/database/` and hooks in `src/hooks/`.
