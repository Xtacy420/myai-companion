"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Brain,
  Heart,
  MessageCircle,
  Calendar,
  Users,
  Bell,
  TrendingUp,
  BarChart3,
  Activity,
  Plus,
  Sparkles,
  Settings,
  Home,
  User
} from "lucide-react";
import { useLocalUser } from "@/hooks/useLocalUser";
import { localDB } from "@/lib/database/database";
import type { CheckIn, Conversation, Memory, FamilyMember, Reminder } from "@/lib/database/schema";
import CheckInsView from "@/components/CheckInsView";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";

function ActivityPageContent() {
  const [currentView, setCurrentView] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const { userId, user } = useLocalUser();

  // Load data when component mounts or userId changes
  useEffect(() => {
    if (userId) {
      loadActivityData();
    }
  }, [userId]);

  const loadActivityData = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);

      // Load all data in parallel
      const [
        userMemories,
        userConversations,
        userCheckIns,
        userFamilyMembers,
        userReminders,
      ] = await Promise.all([
        localDB.getMemoriesByUser(userId),
        localDB.getConversationsByUser(userId),
        localDB.getCheckInsByUser(userId, 30), // Last 30 check-ins
        localDB.getFamilyMembersByUser(userId),
        // Note: We don't have reminders implemented yet, so empty array
        Promise.resolve([])
      ]);

      setMemories(userMemories);
      setConversations(userConversations);
      setCheckIns(userCheckIns);
      setFamilyMembers(userFamilyMembers);
      setReminders(userReminders);
    } catch (error) {
      console.error("Failed to load activity data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics
  const totalMemories = memories.length;
  const totalConversations = conversations.length;
  const totalCheckIns = checkIns.length;
  const totalFamily = familyMembers.length;
  const pendingReminders = reminders.filter(r => r.status === "pending").length;
  const completedReminders = reminders.filter(r => r.status === "completed").length;

  // Calculate average mood from recent check-ins (last 7 days)
  const recentCheckIns = checkIns.slice(0, 7);
  const averageMood = recentCheckIns.length > 0
    ? recentCheckIns.reduce((sum, checkIn) => sum + checkIn.mood, 0) / recentCheckIns.length
    : 0;

  const recentCheckIn = checkIns[0];
  const streakDays = calculateCheckInStreak(checkIns);

  // Get today's reminders/upcoming tasks
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const upcomingReminders = reminders.filter(reminder => {
    if (!reminder.dueDate) return false;
    const dueDate = new Date(reminder.dueDate);
    return dueDate >= todayStart && dueDate < todayEnd;
  });

  function calculateCheckInStreak(checkIns: CheckIn[]): number {
    if (!checkIns || checkIns.length === 0) return 0;

    let streak = 0;
    const today = new Date();

    for (let i = 0; i < checkIns.length; i++) {
      const checkInDate = new Date(checkIns[i].date);
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);

      if (checkInDate.toDateString() === expectedDate.toDateString()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  const getMoodEmoji = (mood: number) => {
    if (mood >= 8) return "😄";
    if (mood >= 6) return "😊";
    if (mood >= 4) return "😐";
    if (mood >= 2) return "🙁";
    return "😢";
  };

  const quickStats = [
    {
      title: "Total Memories",
      value: totalMemories,
      icon: Brain,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600"
    },
    {
      title: "Conversations",
      value: totalConversations,
      icon: MessageCircle,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600"
    },
    {
      title: "Check-ins",
      value: totalCheckIns,
      icon: Heart,
      color: "from-pink-500 to-pink-600",
      bgColor: "bg-pink-50",
      textColor: "text-pink-600"
    },
    {
      title: "Family & Friends",
      value: totalFamily,
      icon: Users,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600"
    },
    {
      title: "Pending Tasks",
      value: pendingReminders,
      icon: Bell,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600"
    },
    {
      title: "Completed Tasks",
      value: completedReminders,
      icon: Calendar,
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-600"
    }
  ];

  const navigationItems = [
    { id: "home", label: "Home", icon: Home, href: "/home" },
    { id: "activity", label: "Activity", icon: Activity, href: "/activity", active: true },
    { id: "chat", label: "Chat", icon: MessageCircle, href: "/chat" },
    { id: "calendar", label: "Calendar", icon: Calendar, href: "/calendar" },
    { id: "profile", label: "Profile", icon: User, href: "/profile" },
  ];



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Top Navigation */}
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Activity Dashboard</h1>
              <p className="text-slate-600">Track your progress and daily insights</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant={currentView === "dashboard" ? "default" : "outline"}
                onClick={() => setCurrentView("dashboard")}
                className="gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </Button>
              <Button
                variant={currentView === "checkins" ? "default" : "outline"}
                onClick={() => setCurrentView("checkins")}
                className="gap-2"
              >
                <Heart className="w-4 h-4" />
                Check-ins
              </Button>
            </div>
          </div>
        </div>

        {currentView === "dashboard" ? (
          <div className="space-y-8">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {quickStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center mb-4`}>
                        <Icon className={`w-6 h-6 ${stat.textColor}`} />
                      </div>
                      <div className={`text-2xl font-bold ${stat.textColor} mb-1`}>
                        {stat.value}
                      </div>
                      <div className="text-sm text-slate-600">{stat.title}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Key Insights */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Mood Tracking */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-600" />
                    Mood Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl mb-2">
                        {averageMood > 0 ? getMoodEmoji(averageMood) : "😐"}
                      </div>
                      <div className="text-2xl font-bold text-slate-800">
                        {averageMood.toFixed(1)}/10
                      </div>
                      <div className="text-sm text-slate-600">7-day average</div>
                    </div>
                    {recentCheckIn && (
                      <div className="text-center pt-4 border-t">
                        <div className="text-sm text-slate-600 mb-1">Latest check-in</div>
                        <div className="font-medium">{recentCheckIn.date}</div>
                        <Badge variant="secondary" className="mt-1">
                          Mood: {recentCheckIn.mood}/10
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Check-in Streak */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Check-in Streak
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      {streakDays}
                    </div>
                    <div className="text-lg font-medium text-slate-800">
                      {streakDays === 1 ? "Day" : "Days"}
                    </div>
                    <div className="text-sm text-slate-600 mt-1">
                      {streakDays > 0 ? "Keep it up!" : "Start your streak today"}
                    </div>
                    {streakDays >= 7 && (
                      <Badge className="mt-3 bg-green-100 text-green-800">
                        🔥 Week streak!
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Reminders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-orange-600" />
                    Today's Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingReminders.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingReminders.slice(0, 3).map((reminder) => (
                        <div key={reminder.id} className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            reminder.priority === "high" ? "bg-red-500" :
                            reminder.priority === "medium" ? "bg-yellow-500" : "bg-green-500"
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {reminder.title}
                            </div>
                            <div className="text-xs text-slate-500">
                              {reminder.dueDate && new Date(reminder.dueDate).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                      {upcomingReminders.length > 3 && (
                        <div className="text-xs text-slate-500 text-center pt-2">
                          +{upcomingReminders.length - 3} more tasks
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-slate-500 py-4">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <div className="text-sm">No tasks for today</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Activity className="w-8 h-8 mx-auto mb-2 text-slate-400 animate-pulse" />
                      <p className="text-slate-500">Loading recent activity...</p>
                    </div>
                  </div>
                ) : checkIns.length > 0 ? (
                  <div className="space-y-4">
                    {checkIns.slice(0, 5).map((checkIn) => (
                      <div key={checkIn.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                        <div className="text-2xl">{getMoodEmoji(checkIn.mood)}</div>
                        <div className="flex-1">
                          <div className="font-medium">Daily Check-in</div>
                          <div className="text-sm text-slate-600">
                            {checkIn.date} • Mood: {checkIn.mood}/10
                          </div>
                          {checkIn.emotions && checkIn.emotions.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {checkIn.emotions.slice(0, 3).map((emotion: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {emotion}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-slate-500 py-8">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">No recent activity</div>
                    <div className="text-xs mt-1">Start by creating your first check-in</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border">
            {userId && <CheckInsView userId={userId} />}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ActivityPage() {
  return (
    <ProtectedRoute>
      <ActivityPageContent />
    </ProtectedRoute>
  );
}
