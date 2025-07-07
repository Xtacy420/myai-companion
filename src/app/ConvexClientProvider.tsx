"use client";

import { ReactNode, useEffect, useState } from "react";
import { localDB } from "@/lib/database/database";

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await localDB.initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize local database:', error);
        setInitError(error instanceof Error ? error.message : 'Database initialization failed');
      }
    };

    initializeDatabase();
  }, []);

  // Show loading while initializing local database
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-800 mb-4">MyAi - Personal Memory Companion</h1>
          {initError ? (
            <>
              <p className="text-red-600 mb-4">Database Error: {initError}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </>
          ) : (
            <>
              <p className="text-slate-600 mb-4">Initializing local database...</p>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Database is initialized, render the app
  return <>{children}</>;
}
