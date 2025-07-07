"use client";

import ProtectedRoute from "@/components/ProtectedRoute";

export default function CalendarPage() {
  return (
    <ProtectedRoute>
      <div className="flex flex-col h-full">
        <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Calendar</h2>
          <p className="text-slate-600 dark:text-slate-400">
            Organize your schedule and events
          </p>
        </div>
        <div className="flex-1 p-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">
              Calendar coming soon
            </h3>
            <p className="text-slate-500 dark:text-slate-500">
              Calendar functionality will be available in a future update
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
