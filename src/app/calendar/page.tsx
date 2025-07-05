"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LifeTemplateManager from "@/components/LifeTemplateManager";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings,
  Filter,
  Bell,
  CheckCircle,
  Clock,
  Home,
  Activity,
  MessageCircle,
  User,
  Sparkles,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  DollarSign,
  Users,
  Briefcase,
  Heart,
  Palette,
  CalendarPlus,
  Repeat,
  MapPin,
  AlertCircle
} from "lucide-react";
import { useLocalUser } from "@/hooks/useLocalUser";
import { localDB } from "@/lib/database/database";
import type { Event as MyAiEvent, CustomCalendar as MyAiCustomCalendar, LifeTemplate } from "@/lib/database/schema";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";

interface EventFormData {
  calendarId: string;
  title: string;
  description?: string;
  type: string;
  priority: string;
  startDate: string;
  allDay: boolean;
  location?: string;
  amount?: string;
}

interface CalendarFormData {
  name: string;
  description: string;
  color: string;
  category: string;
  icon: string;
}

function CalendarPageContent() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<"month" | "week" | "day">("month");
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  const [showNewEventDialog, setShowNewEventDialog] = useState(false);
  const [showNewCalendarDialog, setShowNewCalendarDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<MyAiEvent | null>(null);
  const [showEventDetailDialog, setShowEventDetailDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<MyAiEvent | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<MyAiEvent | null>(null);

  const { userId } = useLocalUser();

  // State for local data
  const [calendars, setCalendars] = useState<MyAiCustomCalendar[]>([]);
  const [events, setEvents] = useState<MyAiEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<MyAiEvent[]>([]);
  const [bills, setBills] = useState<MyAiEvent[]>([]);
  const [templates, setTemplates] = useState<LifeTemplate[]>([]);

  // Load data from localDB
  useEffect(() => {
    if (userId) {
      loadCalendarData();
    }
  }, [userId, selectedDate]);

  const loadCalendarData = async () => {
    if (!userId) return;

    const monthStart = getMonthStart(selectedDate).getTime();
    const monthEnd = getMonthEnd(selectedDate).getTime();

    const [userCalendars, userEvents, upcoming, userBills, userTemplates] = await Promise.all([
      localDB.getUserCalendars(userId),
      localDB.getUserEvents(userId, monthStart, monthEnd),
      localDB.getUpcomingEvents(userId, 7, 5),
      localDB.getBills(userId, selectedDate.getFullYear(), selectedDate.getMonth() + 1),
      localDB.getUserTemplates(userId)
    ]);

    setCalendars(userCalendars);
    setEvents(userEvents);
    setUpcomingEvents(upcoming);
    setBills(userBills);
    setTemplates(userTemplates);

    if (userId && userCalendars.length === 0) {
      const defaultCalendars: MyAiCustomCalendar[] = [
        {
          id: localDB.generateId(),
          userId,
          name: "Personal",
          description: "For personal events and reminders",
          color: "#3b82f6",
          category: "personal",
          icon: "User",
          isDefault: true,
          isVisible: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          settings: undefined
        },
        {
          id: localDB.generateId(),
          userId,
          name: "Work",
          description: "For work-related events and meetings",
          color: "#8b5cf6",
          category: "work",
          icon: "Briefcase",
          isDefault: false,
          isVisible: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          settings: undefined
        },
      ];

      for (const cal of defaultCalendars) {
        await localDB.createCalendar(cal);
      }
      const reloadedCalendars = await localDB.getUserCalendars(userId);
      setCalendars(reloadedCalendars);
    }
  };

  useEffect(() => {
    if (calendars && selectedCalendars.length === 0) {
      const visibleCalendarIds = calendars
        .filter(cal => cal.isVisible)
        .map(cal => cal.id);
      setSelectedCalendars(visibleCalendarIds);
    }
  }, [calendars]);

  const navigationItems = [
    { id: "home", label: "Home", icon: Home, href: "/home" },
    { id: "activity", label: "Activity", icon: Activity, href: "/activity" },
    { id: "chat", label: "Chat", icon: MessageCircle, href: "/chat" },
    { id: "calendar", label: "Calendar", icon: CalendarIcon, href: "/calendar", active: true },
    { id: "profile", label: "Profile", icon: User, href: "/profile" },
  ];

  const generateCalendar = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    if (!events) return [];

    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = new Date(event.startDate).toISOString().split('T')[0];
      return eventDate === dateStr && selectedCalendars.includes(event.calendarId);
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(selectedDate.getMonth() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const toggleCalendarVisibility = (calendarId: string) => {
    setSelectedCalendars(prev =>
      prev.includes(calendarId)
        ? prev.filter(id => id !== calendarId)
        : [...prev, calendarId]
    );
  };

  const handleCreateEvent = async (eventData: EventFormData) => {
    if (!userId) return;

    const newEvent: MyAiEvent = {
      id: localDB.generateId(),
      userId,
      calendarId: eventData.calendarId,
      title: eventData.title,
      description: eventData.description,
      startDate: new Date(eventData.startDate).getTime(),
      allDay: eventData.allDay,
      type: eventData.type,
      status: 'pending',
      priority: eventData.priority,
      location: eventData.location,
      amount: eventData.amount ? parseFloat(eventData.amount) : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      endDate: undefined,
      attendees: [],
      currency: undefined,
      isPaid: false,
      paidAt: undefined,
      reminders: [],
      recurring: undefined,
      subtasks: [],
    };

    await localDB.createEvent(newEvent);
    await loadCalendarData();
    setShowNewEventDialog(false);
  };

  const handleUpdateEvent = async (eventId: string, updates: Partial<EventFormData>) => {
        const fullUpdates: Partial<MyAiEvent> = { ...updates };
        if (updates.startDate) {
            fullUpdates.startDate = new Date(updates.startDate).getTime();
        }
        if (updates.amount) {
            fullUpdates.amount = parseFloat(updates.amount);
        }
    await localDB.updateEvent(eventId, { ...fullUpdates, updatedAt: Date.now() });
    await loadCalendarData();
    setEditingEvent(null);
    setShowNewEventDialog(false);
    setShowEventDetailDialog(false);
  };

  const handleDeleteEvent = async (eventId: string) => {
    await localDB.deleteEvent(eventId);
    await loadCalendarData();
    setShowDeleteConfirm(false);
    setEventToDelete(null);
    setShowEventDetailDialog(false);
  };

  const handleCreateCalendar = async (calendarData: CalendarFormData) => {
    if (!userId) return;

    const newCalendar: MyAiCustomCalendar = {
      id: localDB.generateId(),
      userId,
      ...calendarData,
      isDefault: false,
      isVisible: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      settings: undefined
    };

    await localDB.createCalendar(newCalendar);
    await loadCalendarData();
    setShowNewCalendarDialog(false);
  };

  const handleEventClick = (event: MyAiEvent) => {
    setSelectedEvent(event);
    setShowEventDetailDialog(true);
  };

  const handleEditEvent = (event: MyAiEvent) => {
    setEditingEvent(event);
    setShowEventDetailDialog(false);
    setShowNewEventDialog(true);
  };

  const confirmDeleteEvent = (event: MyAiEvent) => {
    setEventToDelete(event);
    setShowDeleteConfirm(true);
  };

  const getCalendarColor = (calendarId: string) => {
    const calendar = calendars?.find(cal => cal.id === calendarId);
    return calendar?.color || "#3b82f6";
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      personal: User,
      work: Briefcase,
      health: Heart,
      finance: DollarSign,
      family: Users,
    };
    return icons[category as keyof typeof icons] || CalendarIcon;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      event: "bg-blue-100 text-blue-800",
      task: "bg-green-100 text-green-800",
      reminder: "bg-yellow-100 text-yellow-800",
      bill: "bg-red-100 text-red-800",
      birthday: "bg-purple-100 text-purple-800",
      appointment: "bg-indigo-100 text-indigo-800",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  function getMonthStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  function getMonthEnd(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  MyAi
                </h1>
              </div>
              <div className="hidden md:flex items-center gap-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.id} href={item.href}>
                      <Button
                        variant={item.active ? "secondary" : "ghost"}
                        className={`gap-2 ${item.active ? "bg-blue-50 text-blue-700" : ""}`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-slate-600" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Enhanced Calendar</h1>
              <p className="text-slate-600">Manage events, tasks, bills, and life schedules</p>
            </div>
            <div className="flex items-center gap-3">
              <Dialog open={showNewCalendarDialog} onOpenChange={setShowNewCalendarDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <CalendarPlus className="w-4 h-4" />
                    New Calendar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Calendar</DialogTitle>
                  </DialogHeader>
                  <NewCalendarForm onSubmit={handleCreateCalendar} onClose={() => setShowNewCalendarDialog(false)} />
                </DialogContent>
              </Dialog>

              <Dialog open={showNewEventDialog} onOpenChange={setShowNewEventDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2" onClick={() => setEditingEvent(null)}>
                    <Plus className="w-4 h-4" />
                    New Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingEvent ? "Edit Event" : "Create New Event"}</DialogTitle>
                  </DialogHeader>
                  <NewEventForm
                    calendars={calendars || []}
                    initialData={editingEvent ?? undefined}
                    onSubmit={async (data) => {
                      if (editingEvent) {
                        await handleUpdateEvent(editingEvent.id, data);
                      } else {
                        await handleCreateEvent(data);
                      }
                    }}
                    onClose={() => {
                      setShowNewEventDialog(false);
                      setEditingEvent(null);
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  My Calendars
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {calendars?.map((calendar) => {
                    const Icon = getCategoryIcon(calendar.category);
                    const isSelected = selectedCalendars.includes(calendar.id);

                    return (
                      <div key={calendar.id} className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          onClick={() => toggleCalendarVisibility(calendar.id)}
                        >
                          {isSelected ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 opacity-50" />}
                        </Button>
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: calendar.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <span className="text-sm font-medium truncate">{calendar.name}</span>
                          </div>
                          {calendar.description && (
                            <p className="text-xs text-slate-500 truncate">{calendar.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Access</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="upcoming" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="bills">Bills</TabsTrigger>
                    <TabsTrigger value="tasks">Tasks</TabsTrigger>
                  </TabsList>

                  <TabsContent value="upcoming" className="space-y-3 mt-4">
                    {upcomingEvents?.map((event) => (
                      <div key={event.id} className="flex items-start gap-3 p-2 bg-slate-50 rounded-lg">
                        <div
                          className="w-3 h-3 rounded-full mt-1"
                          style={{ backgroundColor: getCalendarColor(event.calendarId) }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{event.title}</div>
                          <div className="text-xs text-slate-500">
                            {new Date(event.startDate).toLocaleDateString()}
                            {event.startDate && !event.allDay && (
                              <span> at {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            )}
                          </div>
                          <Badge variant="outline" className={`text-xs mt-1 ${getTypeColor(event.type)}`}>
                            {event.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {(!upcomingEvents || upcomingEvents.length === 0) && (
                      <div className="text-center text-slate-500 py-4">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <div className="text-sm">No upcoming events</div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="bills" className="space-y-3 mt-4">
                    {bills?.slice(0, 5).map((bill) => (
                      <div key={bill.id} className="flex items-start gap-3 p-2 bg-slate-50 rounded-lg">
                        <DollarSign className="w-4 h-4 text-red-600 mt-1" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{bill.title}</div>
                          <div className="text-xs text-slate-500">
                            Due: {new Date(bill.startDate).toLocaleDateString()}
                          </div>
                          {bill.amount && (
                            <div className="text-xs font-medium text-red-600">
                              ${bill.amount.toFixed(2)}
                            </div>
                          )}
                          <Badge variant={bill.isPaid ? "secondary" : "destructive"} className="text-xs mt-1">
                            {bill.isPaid ? "Paid" : "Unpaid"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="tasks" className="space-y-3 mt-4">
                    {events?.filter(e => e.type === "task").slice(0, 5).map((task) => (
                      <div key={task.id} className="flex items-start gap-3 p-2 bg-slate-50 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-1" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{task.title}</div>
                          <div className="text-xs text-slate-500">
                            {new Date(task.startDate).toLocaleDateString()}
                          </div>
                          <Badge variant={task.status === "completed" ? "secondary" : "outline"} className="text-xs mt-1">
                            {task.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Repeat className="w-5 h-5" />
                  Life Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LifeTemplateManager />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate(new Date())}
                    >
                      Today
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {dayNames.map(day => (
                    <div key={day} className="text-center text-sm font-medium text-slate-600 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {generateCalendar().map((date, index) => {
                    const dayEvents = getEventsForDate(date);
                    const dayIsToday = date.toDateString() === new Date().toDateString();
                    const dayIsCurrentMonth = date.getMonth() === selectedDate.getMonth();

                    return (
                      <div
                        key={index}
                        className={`
                          min-h-[120px] p-2 border rounded-lg cursor-pointer transition-colors
                          ${dayIsToday ? 'bg-blue-50 border-blue-200' : 'border-slate-200 hover:bg-slate-50'}
                          ${!dayIsCurrentMonth ? 'opacity-40' : ''}
                        `}
                        onClick={() => setSelectedDate(date)}
                      >
                        <div className={`
                          text-sm font-medium mb-1
                          ${dayIsToday ? 'text-blue-600' : dayIsCurrentMonth ? 'text-slate-800' : 'text-slate-400'}
                        `}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((event, eventIndex) => (
                            <div
                              key={eventIndex}
                              className="text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity group"
                              style={{
                                backgroundColor: `${getCalendarColor(event.calendarId)}20`,
                                borderLeft: `3px solid ${getCalendarColor(event.calendarId)}`
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEventClick(event);
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="truncate">{event.title}</span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditEvent(event);
                                    }}
                                    className="w-3 h-3 text-slate-600 hover:text-blue-600"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      confirmDeleteEvent(event);
                                    }}
                                    className="w-3 h-3 text-slate-600 hover:text-red-600"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              {event.type === "bill" && event.amount && (
                                <span className="ml-1 font-medium">${event.amount}</span>
                              )}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div
                              className="text-xs text-slate-500 cursor-pointer hover:text-slate-700"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showEventDetailDialog} onOpenChange={setShowEventDetailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedEvent ? getCalendarColor(selectedEvent.calendarId) : "#3b82f6" }}
              />
              {selectedEvent?.title}
            </DialogTitle>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              {selectedEvent.description && (
                <div>
                  <h4 className="font-medium text-sm text-slate-700 mb-1">Description</h4>
                  <p className="text-sm text-slate-600">{selectedEvent.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-slate-700 mb-1">Date & Time</h4>
                  <p className="text-sm text-slate-600">
                    {new Date(selectedEvent.startDate).toLocaleDateString()}
                    {!selectedEvent.allDay && (
                      <span className="block">
                        {new Date(selectedEvent.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-slate-700 mb-1">Type</h4>
                  <Badge variant="outline" className={getTypeColor(selectedEvent.type)}>
                    {selectedEvent.type}
                  </Badge>
                </div>
              </div>

              {selectedEvent.location && (
                <div>
                  <h4 className="font-medium text-sm text-slate-700 mb-1">Location</h4>
                  <p className="text-sm text-slate-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {selectedEvent.location}
                  </p>
                </div>
              )}

              {selectedEvent.amount && (
                <div>
                  <h4 className="font-medium text-sm text-slate-700 mb-1">Amount</h4>
                  <p className="text-sm text-slate-600 font-medium">${selectedEvent.amount.toFixed(2)}</p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditEvent(selectedEvent)}
                  className="gap-2"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => confirmDeleteEvent(selectedEvent)}
                  className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </Button>
                <div className="flex-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEventDetailDialog(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Delete Event
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to delete "{eventToDelete?.title}"? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => eventToDelete && handleDeleteEvent(eventToDelete.id)}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Event
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface EventFormData {
  calendarId: string;
  title: string;
  description?: string;
  type: string;
  priority: string;
  startDate: string;
  allDay: boolean;
  location?: string;
  amount?: string;
}

interface CalendarFormData {
  name: string;
  description: string;
  color: string;
  category: string;
  icon: string;
}

function NewEventForm({ calendars, initialData, onSubmit, onClose }: {
    calendars: MyAiCustomCalendar[];
    initialData?: MyAiEvent;
    onSubmit: (data: EventFormData) => Promise<void>;
    onClose: () => void;
}) {
    const [formData, setFormData] = useState({
        calendarId: initialData?.calendarId || calendars[0]?.id || "",
        title: initialData?.title || "",
        description: initialData?.description || "",
        type: initialData?.type || "event",
        priority: initialData?.priority || "medium",
        startDate:
            initialData?.startDate
                ? new Date(initialData.startDate).toISOString().slice(0, 16)
                : new Date().toISOString().slice(0, 16),
        allDay: initialData?.allDay || false,
        location: initialData?.location || "",
        amount: initialData?.amount ? initialData.amount.toString() : "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error("Failed to save event:", error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="title">Event Title</Label>
                    <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Event title"
                        required
                    />
                </div>

                <div>
                    <Label htmlFor="calendar">Calendar</Label>
                    <Select value={formData.calendarId} onValueChange={(value) => setFormData(prev => ({ ...prev, calendarId: value }))}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {calendars.map((calendar) => (
                                <SelectItem key={calendar.id} value={calendar.id}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: calendar.color }} />
                                        {calendar.name}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Event description..."
                />
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div>
                    <Label htmlFor="type">Type</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="event">Event</SelectItem>
                            <SelectItem value="task">Task</SelectItem>
                            <SelectItem value="reminder">Reminder</SelectItem>
                            <SelectItem value="bill">Bill</SelectItem>
                            <SelectItem value="birthday">Birthday</SelectItem>
                            <SelectItem value="appointment">Appointment</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="startDate">Date & Time</Label>
                    <Input
                        id="startDate"
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Event location"
                    />
                </div>

                {formData.type === "bill" && (
                    <div>
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                            placeholder="0.00"
                        />
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit">
                    Create Event
                </Button>
            </div>
        </form>
    );
}

function NewCalendarForm({ onSubmit, onClose }: { onSubmit: (data: CalendarFormData) => Promise<void>, onClose: () => void }) {
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        color: "#3b82f6",
        category: "personal",
        icon: "📅",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error("Failed to create calendar:", error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="name">Calendar Name</Label>
                <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My Calendar"
                    required
                />
            </div>

            <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Calendar description..."
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="personal">Personal</SelectItem>
                            <SelectItem value="work">Work</SelectItem>
                            <SelectItem value="health">Health</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="family">Family</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="color">Color</Label>
                    <Input
                        id="color"
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit">
                    Create Calendar
                </Button>
            </div>
        </form>
    );
}
