"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Settings,
  Brain,
  Users,
  Heart,
  Calendar,
  Home,
  Activity,
  MessageCircle,
  Sparkles,
  Edit,
  Plus,
  Download,
  Shield,
  Mail,
  MapPin,
  Clock
} from "lucide-react";
import MemoriesView from "@/components/MemoriesView";
import FamilyView from "@/components/FamilyView";
import ExportData from "@/components/ExportData";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useLocalUser } from "@/hooks/useLocalUser";
import { localDB } from "@/lib/database/database";
import type { Memory, CheckIn, FamilyMember, Conversation } from "@/lib/database/schema";

function ProfilePageContent() {
  const [currentView, setCurrentView] = useState("overview");
  const [memories, setMemories] = useState<Memory[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const { userId, user } = useLocalUser();

  useEffect(() => {
    if (userId) {
      loadProfileData();
    }
  }, [userId]);

  const loadProfileData = async () => {
    if (!userId) return;

    const [userMemories, userConversations, userFamilyMembers, userCheckIns] = await Promise.all([
      localDB.getMemoriesByUser(userId),
      localDB.getConversationsByUser(userId),
      localDB.getFamilyMembersByUser(userId),
      localDB.getCheckInsByUser(userId)
    ]);

    setMemories(userMemories);
    setConversations(userConversations);
    setFamilyMembers(userFamilyMembers);
    setCheckIns(userCheckIns);
  };

  const navigationItems = [
    { id: "home", label: "Home", icon: Home, href: "/home" },
    { id: "activity", label: "Activity", icon: Activity, href: "/activity" },
    { id: "chat", label: "Chat", icon: MessageCircle, href: "/chat" },
    { id: "calendar", label: "Calendar", icon: Calendar, href: "/calendar" },
    { id: "profile", label: "Profile", icon: User, href: "/profile", active: true },
  ];

  const profileStats = [
    {
      label: "Memories Stored",
      value: memories?.length || 0,
      icon: Brain,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      label: "Conversations",
      value: conversations?.length || 0,
      icon: MessageCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      label: "Family & Friends",
      value: familyMembers?.length || 0,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      label: "Check-ins",
      value: checkIns?.length || 0,
      icon: Heart,
      color: "text-pink-600",
      bgColor: "bg-pink-50"
    }
  ];

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Profile</h1>
              <p className="text-slate-600">Manage your personal information and relationships</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant={currentView === "overview" ? "default" : "outline"}
                onClick={() => setCurrentView("overview")}
                className="gap-2"
              >
                <User className="w-4 h-4" />
                Overview
              </Button>
              <Button
                variant={currentView === "memories" ? "default" : "outline"}
                onClick={() => setCurrentView("memories")}
                className="gap-2"
              >
                <Brain className="w-4 h-4" />
                Memories
              </Button>
              <Button
                variant={currentView === "family" ? "default" : "outline"}
                onClick={() => setCurrentView("family")}
                className="gap-2"
              >
                <Users className="w-4 h-4" />
                Family & Friends
              </Button>
            </div>
          </div>
        </div>

        {currentView === "overview" ? (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="relative inline-block mb-6">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={user?.profilePicture} />
                      <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {user?.name ? getInitials(user.name) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>

                  <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    {user?.name || "User"}
                  </h2>

                  {user?.email && (
                    <div className="flex items-center justify-center gap-2 text-slate-600 mb-4">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{user.email}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2 text-slate-600 mb-6">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      Member since {user?.createdAt ? formatDate(user.createdAt) : "Unknown"}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <Button className="w-full gap-2">
                      <Edit className="w-4 h-4" />
                      Edit Profile
                    </Button>
                    {userId && (
                      <ExportData userId={userId} />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Settings */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Privacy</span>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Protected
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">AI Personality</span>
                    </div>
                    <Badge variant="outline">
                      {user?.aiPersonality?.tone || "Default"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">Timezone</span>
                    </div>
                    <span className="text-sm text-slate-600">
                      {user?.timezone || "Auto"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stats and Recent Activity */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                {profileStats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={index}>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                            <Icon className={`w-6 h-6 ${stat.color}`} />
                          </div>
                          <div>
                            <div className={`text-2xl font-bold ${stat.color}`}>
                              {stat.value}
                            </div>
                            <div className="text-sm text-slate-600">{stat.label}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Recent Memories */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-blue-600" />
                      Recent Memories
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setCurrentView("memories")}>
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {memories?.slice(0, 5).map((memory) => (
                      <div key={memory.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                          <Brain className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {memory.summary || "Memory"}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {formatDate(memory.createdAt)} • Importance: {memory.importance}/10
                          </div>
                          <div className="flex gap-1 mt-2">
                            {memory.tags.slice(0, 3).map((tag: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!memories || memories.length === 0) && (
                      <div className="text-center text-slate-500 py-8">
                        <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <div className="text-sm">No memories stored yet</div>
                        <div className="text-xs mt-1">Start chatting with MyAi to create memories</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Family Quick View */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-green-600" />
                      Family & Friends
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setCurrentView("family")}>
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {familyMembers?.slice(0, 4).map((member) => (
                      <div key={member.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs bg-green-100 text-green-700">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{member.name}</div>
                          <div className="text-xs text-slate-500">{member.relationship}</div>
                        </div>
                        {member.birthday && (
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(member.birthday).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </Badge>
                        )}
                      </div>
                    ))}
                    {(!familyMembers || familyMembers.length === 0) && (
                      <div className="text-center text-slate-500 py-8">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <div className="text-sm">No family members added yet</div>
                        <div className="text-xs mt-1">Add people important to you</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : currentView === "memories" ? (
          <div className="bg-white rounded-xl shadow-sm border">
            {userId && <MemoriesView userId={userId} />}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border">
            {userId && <FamilyView userId={userId} />}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}
