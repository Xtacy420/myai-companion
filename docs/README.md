# MyAi Companion - Project Documentation

This folder contains a high-level overview of the MyAi Companion application's structure and purpose. Each major directory in the source code has a corresponding `README.md` file in this `docs` folder that explains the role of the files within it.

This documentation serves as a key for understanding the project's architecture, troubleshooting issues, and guiding future development.

## Project Structure Overview

- **/convex:** (Now Deprecated) Contains all backend schema and functions for the Convex-based version of the app. This is being phased out in favor of a local-first architecture.
- **/public:** Static assets like icons and the web manifest.
- **/src:** The main source code for the Next.js application.
  - **/src/app:** Contains all the pages and API routes for the application.
  - **/src/components:** Reusable React components used across different pages.
  - **/src/hooks:** Custom React hooks that encapsulate stateful logic.
  - **/src/lib:** Core libraries, helper functions, and service integrations.

Navigate into the subdirectories to find more detailed `README.md` files for each section.
