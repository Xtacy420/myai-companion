MyAi Companion - Documentation Structure
=====================================

This /docs folder contains plain-English explanations of every file in the MyAi Companion project.

PURPOSE:
- Understand what each file does without reading code
- Debug issues by understanding data flow
- Identify dependencies and critical systems
- Mark areas that need clarification or improvement

STRUCTURE:
This documentation mirrors the exact folder structure of the real application.
For example:
- Real file: src/app/chat/page.tsx
- Doc file: docs/src/app/chat/page.txt

Each documentation file includes:
1. The file's role in the application
2. What it imports/exports
3. What data it handles
4. Whether it's critical to auth/memory/sync
5. Any TODOs or clarifications needed

CRITICAL SYSTEMS:
- Authentication: Local-first using encrypted IndexedDB
- Memory System: Dexie database for storing conversations, memories, check-ins
- Sync System: Optional cloud sync (not fully implemented)
- Chat System: AI conversations with memory persistence
- Calendar System: Event management with recurring templates

STATUS:
- The app was migrated from Convex (cloud) to local-first architecture
- Current version: 22
- Deployment target: Netlify (static/dynamic)
