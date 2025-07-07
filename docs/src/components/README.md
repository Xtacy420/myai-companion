# /src/components Directory

This directory contains all the reusable React components that make up the user interface of the application.

## Sub-directory:

- **/ui:** This sub-directory holds the generic, low-level UI components provided by `shadcn/ui`. These are the building blocks of the application's interface, such as `Button`, `Card`, `Input`, `Dialog`, etc. They are styled with Tailwind CSS and are highly customizable.

## Feature Components:

These are the more complex components that encapsulate a specific feature or section of the application.

- **`AIPersonalitySettings.tsx`**: A form that allows the user to customize the AI's behavior, tone, and memory focus. It interacts directly with the local database to save these preferences to the user's profile.

- **`CharacterCreation.tsx`**: Provides the UI for users to create, edit, and delete their own custom AI characters. All character data is stored in the local database.

- **`CheckInsView.tsx`**: (If present) A component for viewing and managing daily mood and activity check-ins.

- **`CloudSyncSettings.tsx`**: The user interface for managing cloud backup and synchronization settings. It would handle the logic for connecting to a service like Google Drive (though this is an optional, future feature).

- **`ExportData.tsx`**: A component that allows the user to export all of their local data into a single, downloadable file.

- **`FamilyView.tsx`**: A section for the user to manage information about their family members and important dates.

- **`InstallPWA.tsx`**: A component that prompts the user to install the application as a Progressive Web App (PWA) on their device.

- **`LifeTemplateManager.tsx`**: A powerful feature that lets users create templates for recurring events or tasks (e.g., monthly bills, weekly planning), which can then be applied to their calendar.

- **`MemoriesView.tsx`**: The main interface for browsing, searching, and managing all the memories the AI has recorded.

- **`ProtectedRoute.tsx`**: A higher-order component that wraps pages and prevents access to them unless a user is authenticated, redirecting them to the login page if they are not.

- **`RemindersView.tsx`**: A component for displaying and managing user reminders.

- **`SettingsView.tsx`**: A general container for various application-level settings.
