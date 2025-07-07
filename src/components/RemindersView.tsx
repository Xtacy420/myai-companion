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
import { localDB } from "@/lib/database/database";
import type { Reminder } from "@/lib/database/schema";
import { Plus, Bell, Edit, Trash2, Clock, CheckCircle, Circle, AlertTriangle } from "lucide-react";

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
  const [statusFilter, setStatusFilter] = useState("pending");

  useEffect(() => {
    if (userId) {
      loadReminders();
    }
  }, [userId]);

  const loadReminders = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const userReminders = await localDB.getRemindersByUser(userId);
      setReminders(userReminders);

      const upcoming = await localDB.getUpcomingReminders(userId, 1);
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
    if (!userId) return;
    try {
      let dueDateTimestamp: number | undefined;
      if (dueDate) {
        const dateTime = dueTime ? `${dueDate}T${dueTime}` : `${dueDate}T23:59`;
        dueDateTimestamp = new Date(dateTime).getTime();
      }

      const reminderData = {
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDateTimestamp,
        priority,
        status: editingReminder?.status || 'pending',
        category: category.trim() || undefined,
        updatedAt: Date.now(),
      };

      if (editingReminder) {
        await localDB.updateReminder(editingReminder.id, reminderData);
      } else {
        const newReminder: Omit<Reminder, 'id'> = {
          userId,
          title: title.trim(),
          description: description.trim() || undefined,
          dueDate: dueDateTimestamp,
          priority,
          status: 'pending',
          category: category.trim() || undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await localDB.createReminder(newReminder as Reminder);
      }

      await loadReminders();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to save reminder:", error);
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

  const handleToggleStatus = async (reminder: Reminder) => {
    if (!userId) return;
    const newStatus = reminder.status === 'completed' ? 'pending' : 'completed';
    try {
      await localDB.updateReminder(reminder.id, {
        status: newStatus,
        completedAt: newStatus === 'completed' ? Date.now() : undefined,
      });
      await loadReminders();
    } catch (error) {
      console.error("Failed to toggle reminder status:", error);
    }
  };

  const priorityOptions = [
    { value: "low", label: "Low", color: "bg-green-100 text-green-800" },
    { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
    { value: "high", label: "High", color: "bg-red-100 text-red-800" },
  ];

  const statusFilters = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "completed", label: "Completed" },
  ];

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isOverdue = (timestamp: number) => {
    return timestamp < Date.now();
  };

  const getPriorityColor = (priority: string) => {
    const option = priorityOptions.find(p => p.value === priority);
    return option?.color || "bg-gray-100 text-gray-800";
  };

  const filteredReminders = reminders?.filter(reminder => {
    if (statusFilter === "all") return true;
    return reminder.status === statusFilter;
  });

  const pendingCount = reminders?.filter(r => r.status === "pending").length || 0;
  const completedCount = reminders?.filter(r => r.status === "completed").length || 0;
  const upcomingCount = upcomingReminders?.length || 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Reminders</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Stay on top of your tasks and important dates
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div>
                <div className="text-xl font-bold text-orange-600">{upcomingCount}</div>
                <div className="text-slate-600 dark:text-slate-400">Upcoming</div>
              </div>
              <div>
                <div className="text-xl font-bold text-blue-600">{pendingCount}</div>
                <div className="text-slate-600 dark:text-slate-400">Pending</div>
              </div>
              <div>
                <div className="text-xl font-bold text-green-600">{completedCount}</div>
                <div className="text-slate-600 dark:text-slate-400">Completed</div>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4" />
                  Add Reminder
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingReminder ? "Edit Reminder" : "Create New Reminder"}
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
                      placeholder="Add more details..."
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
                      <Label className="text-base font-medium">Due Time</Label>
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
                    <div className="mt-2 flex gap-2">
                      {priorityOptions.map((option) => (
                        <Button
                          key={option.value}
                          variant={priority === option.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPriority(option.value as any)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Category (Optional)</Label>
                    <Input
                      placeholder="e.g., Work, Personal, Health"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-1"
                    />
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

        {/* Upcoming Alerts */}
        {upcomingReminders && upcomingReminders.length > 0 && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <span className="font-medium text-orange-800 dark:text-orange-200">
                Upcoming Reminders (Next 24 Hours)
              </span>
            </div>
            <div className="space-y-1">
              {upcomingReminders.slice(0, 3).map((reminder: Reminder) => (
                <div key={reminder.id} className="text-orange-700 dark:text-orange-300 text-sm">
                  • {reminder.title} {reminder.dueDate && `- ${formatDateTime(reminder.dueDate)}`}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Filter */}
        <div className="mt-4 flex gap-2">
          {statusFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={statusFilter === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Reminders List */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-4 max-w-4xl mx-auto">
          {!filteredReminders ? (
            <div className="text-center py-8">
              <div className="animate-pulse">Loading reminders...</div>
            </div>
          ) : filteredReminders.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">
                {statusFilter === "all" ? "No reminders yet" : `No ${statusFilter} reminders`}
              </h3>
              <p className="text-slate-500 dark:text-slate-500 mb-4">
                Create your first reminder to stay organized
              </p>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="w-4 h-4" />
                Create First Reminder
              </Button>
            </div>
          ) : (
            filteredReminders.map((reminder) => (
              <Card key={reminder.id} className={`hover:shadow-md transition-shadow ${
                reminder.status === "completed" ? "opacity-75" : ""
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(reminder)}
                        className="mt-1 p-1"
                      >
                        {reminder.status === "completed" ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-400" />
                        )}
                      </Button>
                      <div>
                        <CardTitle className={`text-lg ${
                          reminder.status === "completed" ? "line-through text-slate-500" : "text-slate-800 dark:text-slate-200"
                        }`}>
                          {reminder.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="secondary"
                            className={getPriorityColor(reminder.priority)}
                          >
                            {reminder.priority}
                          </Badge>
                          {reminder.category && (
                            <Badge variant="outline">
                              {reminder.category}
                            </Badge>
                          )}
                          {reminder.dueDate && (
                            <Badge
                              variant="outline"
                              className={`${isOverdue(reminder.dueDate) && reminder.status === "pending"
                                  ? "bg-red-100 text-red-800 border-red-200"
                                  : ""
                              }`}>
                              <Clock className="w-3 h-3 mr-1" />
                              {formatDateTime(reminder.dueDate)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
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
                {reminder.description && (
                  <CardContent>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {reminder.description}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
