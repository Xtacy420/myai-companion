"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocalUser } from "@/hooks/useLocalUser";
import { localDB } from "@/lib/database/database";
import ProtectedRoute from "@/components/ProtectedRoute";
import AIPersonalitySettings from "@/components/AIPersonalitySettings";
import CloudSyncSettings from "@/components/CloudSyncSettings";
import ExportData from "@/components/ExportData";
import {
  User,
  Edit2,
  Save,
  Calendar,
  MessageCircle,
  Brain,
  Users,
  Bell,
  Settings,
  Home,
  Activity,
  Camera,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Download,
  Shield,
  Database
} from "lucide-react";
import Link from "next/link";

function ProfilePageContent() {
  const { user, updateUser, userId } = useLocalUser();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({
    name: "",
    email: "",
    bio: "",
    location: "",
    timezone: "",
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Initialize edit form when user data loads
  useEffect(() => {
    if (user) {
      setEditedUser({
        name: user.name || "",
        email: user.email || "",
        bio: user.bio || "",
        location: user.location || "",
        timezone: user.timezone || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    await updateUser(editedUser);
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (user) {
      setEditedUser({
        name: user.name || "",
        email: user.email || "",
        bio: user.bio || "",
        location: user.location || "",
        timezone: user.timezone || "",
      });
    }
    setIsEditing(false);
  };

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
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const navigationItems = [
    { id: "home", label: "Home", icon: Home, href: "/home" },
    { id: "activity", label: "Activity", icon: Activity, href: "/activity" },
    { id: "chat", label: "Chat", icon: MessageCircle, href: "/chat" },
    { id: "calendar", label: "Calendar", icon: Calendar, href: "/calendar" },
    { id: "profile", label: "Profile", icon: User, href: "/profile", active: true },
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-white/50 backdrop-blur-sm border-r border-slate-200 flex-col overflow-hidden`}>
        {sidebarOpen && (
          <>
            {/* Sidebar Header */}
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Profile
                  </h1>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Quick Settings */}
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-700">Quick Settings</h3>
                <div className="space-y-2">
                  <AIPersonalitySettings userId={userId!} />
                  <CloudSyncSettings userId={userId!} />
                  <ExportData userId={userId!} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!sidebarOpen && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
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
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Online
              </Badge>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </nav>

        {/* Profile Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Profile Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  <div className="relative">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={user.profilePicture} />
                      <AvatarFallback className="text-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {getInitials(user.name || "User")}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 w-8 h-8 p-0 rounded-full"
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h1 className="text-2xl font-bold text-slate-800">{user.name}</h1>
                        <p className="text-slate-600">{user.email}</p>
                      </div>
                      <Button
                        onClick={() => setIsEditing(!isEditing)}
                        variant={isEditing ? "outline" : "default"}
                        className="gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        {isEditing ? "Cancel" : "Edit Profile"}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span>Joined {formatDate(user.createdAt)}</span>
                      </div>
                      {user.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-500" />
                          <span>{user.location}</span>
                        </div>
                      )}
                      {user.timezone && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <span>{user.timezone}</span>
                        </div>
                      )}
                    </div>

                    {user.bio && (
                      <p className="mt-4 text-slate-700">{user.bio}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Edit Profile Form */}
            {isEditing && (
              <Card>
                <CardHeader>
                  <CardTitle>Edit Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={editedUser.name}
                        onChange={(e) => setEditedUser({...editedUser, name: e.target.value})}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editedUser.email}
                        onChange={(e) => setEditedUser({...editedUser, email: e.target.value})}
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={editedUser.bio}
                      onChange={(e) => setEditedUser({...editedUser, bio: e.target.value})}
                      placeholder="Tell us about yourself"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={editedUser.location}
                        onChange={(e) => setEditedUser({...editedUser, location: e.target.value})}
                        placeholder="City, Country"
                      />
                    </div>
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Input
                        id="timezone"
                        value={editedUser.timezone}
                        onChange={(e) => setEditedUser({...editedUser, timezone: e.target.value})}
                        placeholder="UTC+0"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} className="gap-2">
                      <Save className="w-4 h-4" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Settings & Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Brain className="w-8 h-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold">AI Personality</h3>
                      <p className="text-sm text-slate-600">Customize how I respond</p>
                    </div>
                  </div>
                  <AIPersonalitySettings userId={userId!} />
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="w-8 h-8 text-green-600" />
                    <div>
                      <h3 className="font-semibold">Cloud Sync</h3>
                      <p className="text-sm text-slate-600">Backup & sync data</p>
                    </div>
                  </div>
                  <CloudSyncSettings userId={userId!} />
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Database className="w-8 h-8 text-purple-600" />
                    <div>
                      <h3 className="font-semibold">Export Data</h3>
                      <p className="text-sm text-slate-600">Download your data</p>
                    </div>
                  </div>
                  <ExportData userId={userId!} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
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
