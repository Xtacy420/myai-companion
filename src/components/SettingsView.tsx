"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLocalUser } from "@/hooks/useLocalUser";
import { localDB } from "@/lib/database/database";
import AIPersonalitySettings from "@/components/AIPersonalitySettings";
import CloudSyncSettings from "@/components/CloudSyncSettings";
import ExportData from "@/components/ExportData";
import {
  Settings,
  User,
  Bell,
  Shield,
  Database,
  Brain,
  Palette,
  Globe,
  Smartphone,
  Volume2,
  Eye,
  Moon,
  Sun,
  Monitor,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Key,
  Lock
} from "lucide-react";

interface SettingsViewProps {
  userId: string;
}

export default function SettingsView({ userId }: SettingsViewProps) {
  const { user, updateUser, deleteAccount, getDatabaseSize } = useLocalUser();
  const [settings, setSettings] = useState({
    notifications: {
      enabled: true,
      sound: true,
      desktop: true,
      reminders: true,
      updates: false,
    },
    appearance: {
      theme: 'system' as 'light' | 'dark' | 'system',
      fontSize: 'medium' as 'small' | 'medium' | 'large',
      animations: true,
    },
    privacy: {
      analytics: false,
      crashReports: true,
      dataCollection: false,
    },
    advanced: {
      debugMode: false,
      betaFeatures: false,
      autoBackup: true,
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [databaseSize, setDatabaseSize] = useState(0);
  const [memoryStats, setMemoryStats] = useState({
    memories: 0,
    conversations: 0,
    familyMembers: 0,
    reminders: 0,
  });

  useEffect(() => {
    if (user) {
      loadSettings();
      loadStats();
    }
  }, [user]);

  const loadSettings = () => {
    if (user?.settings) {
      setSettings(prev => ({
        ...prev,
        ...user.settings,
      }));
    }
  };

  const loadStats = async () => {
    try {
      const size = await getDatabaseSize();
      setDatabaseSize(size);

      // Load memory stats
      const [memories, conversations, familyMembers, reminders] = await Promise.all([
        localDB.getMemoriesByUser(userId),
        localDB.getConversationsByUser(userId),
        localDB.getFamilyMembersByUser(userId),
        localDB.getRemindersByUser(userId),
      ]);

      setMemoryStats({
        memories: memories.length,
        conversations: conversations.length,
        familyMembers: familyMembers.length,
        reminders: reminders.length,
      });
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const handleUpdateSettings = async (section: string, key: string, value: any) => {
    const newSettings = {
      ...settings,
      [section]: {
        ...settings[section as keyof typeof settings],
        [key]: value,
      },
    };

    setSettings(newSettings);

    try {
      await updateUser({
        settings: newSettings,
      });
    } catch (error) {
      console.error("Failed to update settings:", error);
    }
  };

  const handleClearData = async (dataType: 'all' | 'conversations' | 'memories' | 'family' | 'reminders') => {
    if (!confirm(`Are you sure you want to clear all ${dataType === 'all' ? 'data' : dataType}? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsLoading(true);

      switch (dataType) {
        case 'conversations':
          const conversations = await localDB.getConversationsByUser(userId);
          await Promise.all(conversations.map(c => localDB.deleteConversation(c.id)));
          break;
        case 'memories':
          const memories = await localDB.getMemoriesByUser(userId);
          await Promise.all(memories.map(m => localDB.deleteMemory(m.id)));
          break;
        case 'family':
          const family = await localDB.getFamilyMembersByUser(userId);
          await Promise.all(family.map(f => localDB.deleteFamilyMember(f.id)));
          break;
        case 'reminders':
          const reminders = await localDB.getRemindersByUser(userId);
          await Promise.all(reminders.map(r => localDB.deleteReminder(r.id)));
          break;
        case 'all':
          await localDB.clearDatabase();
          break;
      }

      await loadStats();
    } catch (error) {
      console.error(`Failed to clear ${dataType}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalItems = memoryStats.memories + memoryStats.conversations +
                    memoryStats.familyMembers + memoryStats.reminders;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
          <p className="text-slate-600">
            Customize your MyAi experience and manage your data
          </p>
        </div>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          <Database className="w-4 h-4 mr-1" />
          {formatBytes(databaseSize)}
        </Badge>
      </div>

      {/* Account & Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Account & Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{user?.name || 'User'}</div>
              <div className="text-sm text-slate-600">{user?.email || 'No email set'}</div>
            </div>
            <Button variant="outline" size="sm">
              Edit Profile
            </Button>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AIPersonalitySettings userId={userId} />
            <CloudSyncSettings userId={userId} />
            <ExportData userId={userId} />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Enable Notifications</div>
                <div className="text-sm text-slate-600">Receive notifications for reminders and updates</div>
              </div>
              <Switch
                checked={settings.notifications.enabled}
                onCheckedChange={(checked) => handleUpdateSettings('notifications', 'enabled', checked)}
              />
            </div>

            {settings.notifications.enabled && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Sound Notifications</div>
                    <div className="text-sm text-slate-600">Play sound for notifications</div>
                  </div>
                  <Switch
                    checked={settings.notifications.sound}
                    onCheckedChange={(checked) => handleUpdateSettings('notifications', 'sound', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Desktop Notifications</div>
                    <div className="text-sm text-slate-600">Show desktop notifications</div>
                  </div>
                  <Switch
                    checked={settings.notifications.desktop}
                    onCheckedChange={(checked) => handleUpdateSettings('notifications', 'desktop', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Reminder Notifications</div>
                    <div className="text-sm text-slate-600">Get notified about due reminders</div>
                  </div>
                  <Switch
                    checked={settings.notifications.reminders}
                    onCheckedChange={(checked) => handleUpdateSettings('notifications', 'reminders', checked)}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-base font-medium">Theme</Label>
            <div className="mt-2 flex gap-2">
              {[
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'dark', label: 'Dark', icon: Moon },
                { value: 'system', label: 'System', icon: Monitor },
              ].map((theme) => {
                const Icon = theme.icon;
                return (
                  <Button
                    key={theme.value}
                    variant={settings.appearance.theme === theme.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleUpdateSettings('appearance', 'theme', theme.value)}
                    className="gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {theme.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="text-base font-medium">Font Size</Label>
            <div className="mt-2 flex gap-2">
              {[
                { value: 'small', label: 'Small' },
                { value: 'medium', label: 'Medium' },
                { value: 'large', label: 'Large' },
              ].map((size) => (
                <Button
                  key={size.value}
                  variant={settings.appearance.fontSize === size.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleUpdateSettings('appearance', 'fontSize', size.value)}
                >
                  {size.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Animations</div>
              <div className="text-sm text-slate-600">Enable smooth animations and transitions</div>
            </div>
            <Switch
              checked={settings.appearance.animations}
              onCheckedChange={(checked) => handleUpdateSettings('appearance', 'animations', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-blue-800 mb-1">
                  Your Data is Secure
                </div>
                <div className="text-blue-700">
                  All your data is stored locally on your device with encryption.
                  MyAi respects your privacy and never shares your personal information.
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Anonymous Analytics</div>
                <div className="text-sm text-slate-600">Help improve MyAi with anonymous usage data</div>
              </div>
              <Switch
                checked={settings.privacy.analytics}
                onCheckedChange={(checked) => handleUpdateSettings('privacy', 'analytics', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Crash Reports</div>
                <div className="text-sm text-slate-600">Send crash reports to help fix issues</div>
              </div>
              <Switch
                checked={settings.privacy.crashReports}
                onCheckedChange={(checked) => handleUpdateSettings('privacy', 'crashReports', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">{memoryStats.memories}</div>
              <div className="text-sm text-slate-600">Memories</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-xl font-bold text-purple-600">{memoryStats.conversations}</div>
              <div className="text-sm text-slate-600">Conversations</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-xl font-bold text-green-600">{memoryStats.familyMembers}</div>
              <div className="text-sm text-slate-600">Family & Friends</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-xl font-bold text-orange-600">{memoryStats.reminders}</div>
              <div className="text-sm text-slate-600">Reminders</div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Auto Backup</div>
                <div className="text-sm text-slate-600">Automatically backup data locally</div>
              </div>
              <Switch
                checked={settings.advanced.autoBackup}
                onCheckedChange={(checked) => handleUpdateSettings('advanced', 'autoBackup', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Storage Used</div>
                <div className="text-sm text-slate-600">{totalItems} items • {formatBytes(databaseSize)}</div>
              </div>
              <Button variant="outline" size="sm" onClick={loadStats} className="gap-2">
                <Database className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Clear Data
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleClearData('conversations')}
                disabled={isLoading}
                className="text-xs"
              >
                Clear Conversations
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleClearData('memories')}
                disabled={isLoading}
                className="text-xs"
              >
                Clear Memories
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleClearData('family')}
                disabled={isLoading}
                className="text-xs"
              >
                Clear Family
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleClearData('reminders')}
                disabled={isLoading}
                className="text-xs"
              >
                Clear Reminders
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Clear All Data
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="w-5 h-5" />
                      Clear All Data
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-slate-600">
                      This will permanently delete all your data including conversations, memories,
                      family members, and reminders. This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline">Cancel</Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleClearData('all')}
                        disabled={isLoading}
                        className="gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Everything
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Advanced
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Debug Mode</div>
              <div className="text-sm text-slate-600">Enable debug logging (developers only)</div>
            </div>
            <Switch
              checked={settings.advanced.debugMode}
              onCheckedChange={(checked) => handleUpdateSettings('advanced', 'debugMode', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Beta Features</div>
              <div className="text-sm text-slate-600">Access experimental features</div>
            </div>
            <Switch
              checked={settings.advanced.betaFeatures}
              onCheckedChange={(checked) => handleUpdateSettings('advanced', 'betaFeatures', checked)}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-red-600">
              <AlertTriangle className="w-4 h-4" />
              Danger Zone
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-5 h-5" />
                    Delete Account
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-slate-600">
                    This will permanently delete your account and all associated data.
                    This action cannot be undone.
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="text-sm text-red-800">
                      <div className="font-medium mb-1">This will delete:</div>
                      <ul className="list-disc list-inside space-y-1 text-red-700">
                        <li>All conversations and memories</li>
                        <li>Family and friend information</li>
                        <li>All reminders and goals</li>
                        <li>Account settings and preferences</li>
                        <li>Any synced cloud data</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline">Cancel</Button>
                    <Button
                      variant="destructive"
                      onClick={deleteAccount}
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
