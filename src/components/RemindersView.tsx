"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocalUser } from "@/hooks/useLocalUser";
import { localDB } from "@/lib/database/database";
import type { Reminder } from "@/lib/database/schema";
import { Plus, Bell, Edit, Trash2, Calendar, Clock, AlertCircle, CheckCircle2 } from "lucide-react";

interface RemindersViewProps {
  userId: string;
}

export default function RemindersView({ userId }: RemindersViewProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [category, setCategory] = useState("");
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadReminders();
    }
  }, [userId]);

  const loadReminders = async () => {
    try {
      setIsLoading(true);
      const userReminders = await localDB.getRemindersByUser(userId);
      setReminders(userReminders);

      // Get upcoming reminders (next 24 hours)
      const now = Date.now();
      const next24Hours = now + (24 * 60 * 60 * 1000);
      const upcoming = userReminders.filter(reminder =>
        reminder.dueDate &&
        reminder.dueDate >= now &&
        reminder.dueDate <= next24Hours &&
        reminder.status !== "completed"
      );
      setUpcomingReminders(upcoming);
    } catch (error) {
      console.error("Failed to load reminders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
    setDueTime("");
    setPriority("medium");
    setCategory("");
    setEditingReminder(null);
  };

  const handleOpenDialog = (reminder?: Reminder) => {
    if (reminder) {
      setEditingReminder(reminder);
      setTitle(reminder.title);
      setDescription(reminder.description || "");
      if (reminder.dueDate) {
        const date = new Date(reminder.dueDate);
        setDueDate(date.toISOString().split('T')[0]);
        setDueTime(date.toTimeString().slice(0, 5));
      }
      setPriority(reminder.priority as "low" | "medium" | "high");
      setCategory(reminder.category || "");
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      let dueDateTimestamp: number | undefined;
      if (dueDate) {
        const dateTime = dueTime ? `${dueDate}T${dueTime}` : `${dueDate}T12:00`;
        dueDateTimestamp = new Date(dateTime).getTime();
      }

      const reminderData: Partial<Reminder> = {
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDateTimestamp,
        priority,
        category: category.trim() || undefined,
      };

      if (editingReminder) {
        await localDB.updateReminder(editingReminder.id, {
          ...reminderData,
          updatedAt: Date.now(),
        });
      } else {
        const newReminder: Reminder = {
          id: localDB.generateId(),
          userId,
          title: reminderData.title!,
          description: reminderData.description,
          dueDate: reminderData.dueDate,
          priority: reminderData.priority!,
          category: reminderData.category,
          status: "pending",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await localDB.createReminder(newReminder);
      }

      setIsDialogOpen(false);
      resetForm();
      await loadReminders();
    } catch (error) {
      console.error("Failed to save reminder:", error);
    }
  };

  const handleComplete = async (reminderId: string) => {
    try {
      await localDB.updateReminder(reminderId, {
        status: "completed",
        completedAt: Date.now(),
        updatedAt: Date.now(),
      });
      await loadReminders();
    } catch (error) {
      console.error("Failed to complete reminder:", error);
    }
  };

  const handleDelete = async (reminderId: string) => {
    if (confirm("Are you sure you want to delete this reminder?")) {
      try {
        await localDB.deleteReminder(reminderId);
        await loadReminders();
      } catch (error) {
        console.error("Failed to delete reminder:", error);
      }
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isOverdue = (dueDate?: number) => {
    return dueDate && dueDate < Date.now();
  };

  const categories = ["Personal", "Work", "Health", "Finance", "Shopping", "Learning", "Other"];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse">Loading reminders...</div>
      </div>
    );
  }

  const activeReminders = reminders.filter(r => r.status !== "completed");
  const completedReminders = reminders.filter(r => r.status === "completed");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white/50 backdrop-blur-sm border-b border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Reminders</h2>
            <p className="text-slate-600">
              {activeReminders.length} active, {completedReminders.length} completed
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Bell className="w-4 h-4 mr-1" />
              {upcomingReminders.length} upcoming
            </Badge>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4" />
                  Add Reminder
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingReminder ? "Edit Reminder" : "Add New Reminder"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label className="text-base font-medium">Title</Label>
                    <Input
                      placeholder="What do you need to remember?"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-base font-medium">Description (Optional)</Label>
                    <Textarea
                      placeholder="Add any additional details..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-base font-medium">Due Date</Label>
                      <Input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-base font-medium">Time</Label>
                      <Input
                        type="time"
                        value={dueTime}
                        onChange={(e) => setDueTime(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Priority</Label>
                    <Select value={priority} onValueChange={(value) => setPriority(value as "low" | "medium" | "high")}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Category (Optional)</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat.toLowerCase()}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!title.trim()}>
                      {editingReminder ? "Update" : "Create"} Reminder
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Upcoming Reminders */}
        {upcomingReminders.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span className="font-medium text-amber-800">
                Upcoming Reminders (Next 24 Hours)
              </span>
            </div>
            <div className="space-y-2">
              {upcomingReminders.slice(0, 3).map((reminder) => (
                <div key={reminder.id} className="flex items-center justify-between bg-white p-2 rounded">
                  <div>
                    <div className="font-medium text-amber-900">{reminder.title}</div>
                    {reminder.dueDate && (
                      <div className="text-xs text-amber-700">
                        Due: {formatDate(reminder.dueDate)}
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className={getPriorityColor(reminder.priority)}>
                    {reminder.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reminders List */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Active Reminders */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Active Reminders ({activeReminders.length})
            </h3>
            {activeReminders.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-slate-600 mb-2">
                  No active reminders
                </h4>
                <p className="text-slate-500 mb-4">
                  Stay organized by adding reminders for important tasks
                </p>
                <Button onClick={() => handleOpenDialog()} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add First Reminder
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {activeReminders.map((reminder) => (
                  <Card key={reminder.id} className={`hover:shadow-md transition-shadow ${
                    isOverdue(reminder.dueDate) ? "border-red-200 bg-red-50/50" : ""
                  }`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-slate-800">
                            {reminder.title}
                          </CardTitle>
                          {reminder.description && (
                            <p className="text-slate-600 text-sm mt-1">
                              {reminder.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleComplete(reminder.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(reminder)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(reminder.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={getPriorityColor(reminder.priority)}>
                          {reminder.priority} priority
                        </Badge>
                        {reminder.category && (
                          <Badge variant="outline">
                            {reminder.category}
                          </Badge>
                        )}
                        {reminder.dueDate && (
                          <Badge variant="outline" className={
                            isOverdue(reminder.dueDate) ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                          }>
                            <Calendar className="w-3 h-3 mr-1" />
                            {isOverdue(reminder.dueDate) ? "Overdue" : "Due"}: {formatDate(reminder.dueDate)}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Completed Reminders */}
          {completedReminders.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Completed Reminders ({completedReminders.length})
              </h3>
              <div className="grid gap-4">
                {completedReminders.slice(0, 5).map((reminder) => (
                  <Card key={reminder.id} className="opacity-75 hover:opacity-100 transition-opacity">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-slate-800 line-through">
                            {reminder.title}
                          </CardTitle>
                          {reminder.description && (
                            <p className="text-slate-600 text-sm mt-1">
                              {reminder.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(reminder.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                        {reminder.completedAt && (
                          <span className="text-xs text-slate-500">
                            {formatDate(reminder.completedAt)}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
