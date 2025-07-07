# /src Directory

This is the heart of the Next.js application, containing all the code that powers the user interface and application logic.

## Sub-directory Overview:

- **/app:** The core of the Next.js application, following the App Router convention. It contains all pages, layouts, and API routes.
  - See `docs/src/app/README.md` for more details.

- **/components:** Contains reusable React components that are used across multiple pages. This includes both general UI elements (like buttons and cards) and more complex, feature-specific components (like `MemoriesView` or `CharacterCreation`).
  - See `docs/src/components/README.md` for more details.

- **/hooks:** Holds custom React hooks. These hooks abstract away complex, stateful logic, such as managing user authentication, handling chat state, or interacting with the local database, making the main page components cleaner and easier to manage.
  - See `docs/src/hooks/README.md` for more details.

- **/lib:** A library of shared modules, helper functions, and core service integrations. This is where the application's central logic, like the local database setup (Dexie) and external API clients (Venice AI), resides.
  - See `docs/src/lib/README.md` for more details.
