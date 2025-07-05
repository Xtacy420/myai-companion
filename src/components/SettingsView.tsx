"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AIPersonalitySettings from "./AIPersonalitySettings";
import CloudSyncSettings from "./CloudSyncSettings";
import ExportData from "./ExportData";
import {
  Settings,
  Brain,
  Cloud,
  Download,
  Bell,
  Shield,
  Palette,
  User,
  Smartphone,
  Volume2,
  Eye,
  Globe,
  Info
} from "lucide-react";

interface SettingsViewProps {
  userId: Id<"users">;
}

export default function SettingsView({ userId }: SettingsViewProps) {
  const user = useQuery(api.users.getUser, { userId });
  const memories = useQuery(api.memory.getMemoriesByUser, { userId });

  const getPersonalityStatus = () => {
    if (user?.aiPersonality) {
      const { tone, style, traits = [] } = user.aiPersonality;
      return `${tone} & ${style} with ${traits.length} traits`;
    }
    return "Default personality";
  };

  const getCloudSyncStatus = () => {
    if (user?.cloudSync?.enabled) {
      const provider = user.cloudSync.provider === "icloud" ? "iCloud" : "Google Drive";
      return `Connected to ${provider}`;
    }
    return "Disabled";
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Settings</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Customize your MyAi experience
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <User className="w-3 h-3 mr-1" />
              {user?.name || "User"}
            </Badge>
            <Badge variant="outline">
              Member since {user?.createdAt ? formatDate(user.createdAt) : "Unknown"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="ai" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="ai" className="gap-2">
                <Brain className="w-4 h-4" />
                AI
              </TabsTrigger>
              <TabsTrigger value="sync" className="gap-2">
                <Cloud className="w-4 h-4" />
                Sync
              </TabsTrigger>
              <TabsTrigger value="data" className="gap-2">
                <Download className="w-4 h-4" />
                Data
              </TabsTrigger>
              <TabsTrigger value="privacy" className="gap-2">
                <Shield className="w-4 h-4" />
                Privacy
              </TabsTrigger>
              <TabsTrigger value="about" className="gap-2">
                <Info className="w-4 h-4" />
                About
              </TabsTrigger>
            </TabsList>

            {/* AI Settings */}
            <TabsContent value="ai" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    AI Personality
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Current Personality</div>
                      <div className="text-sm text-slate-600">{getPersonalityStatus()}</div>
                    </div>
                    <AIPersonalitySettings userId={userId} />
                  </div>
                  <div className="border-t pt-4">
                    <div className="text-sm text-slate-600 mb-3">
                      Customize how your AI companion communicates, responds, and remembers your conversations.
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-blue-600">0</div>
                        <div className="text-slate-600">Characters</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-purple-600">{memories?.length || 0}</div>
                        <div className="text-slate-600">Memories</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-600">
                          {user?.aiPersonality?.emotionalDepth || 7}/10
                        </div>
                        <div className="text-slate-600">Emotional Depth</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-orange-600">
                          {user?.aiPersonality?.responseLength || "Moderate"}
                        </div>
                        <div className="text-slate-600">Response Length</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Volume2 className="w-5 h-5" />
                    Voice & Audio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Voice Input</div>
                        <div className="text-sm text-slate-600">Use speech recognition for hands-free chat</div>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-600">
                      Click the microphone icon in the chat to start voice input. Your speech will be converted to text automatically.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Cloud Sync Settings */}
            <TabsContent value="sync" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cloud className="w-5 h-5" />
                    Cloud Synchronization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CloudSyncSettings userId={userId} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5" />
                    Device Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-slate-600 mb-4">
                      View and manage devices connected to your MyAi account.
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Smartphone className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">Current Device</div>
                            <div className="text-sm text-slate-600">Last active: Now</div>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Data Export */}
            <TabsContent value="data" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Export Your Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-slate-600 mb-4">
                      Download your personal data in various formats. Your privacy is important to us.
                    </div>
                    <ExportData userId={userId} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Data Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{memories?.length || 0}</div>
                      <div className="text-sm text-slate-600">Memories</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">0</div>
                      <div className="text-sm text-slate-600">Characters</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {user?.cloudSync?.enabled ? "Yes" : "No"}
                      </div>
                      <div className="text-sm text-slate-600">Cloud Sync</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {user?.createdAt ? Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)) : 0}
                      </div>
                      <div className="text-sm text-slate-600">Days Active</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy Settings */}
            <TabsContent value="privacy" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Privacy & Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-2">Data Privacy</h4>
                    <div className="text-sm text-slate-600 space-y-2">
                      <p>• Your conversations and memories are stored locally and optionally synced with your chosen cloud provider</p>
                      <p>• All data is encrypted before cloud storage</p>
                      <p>• MyAi never shares your personal data with third parties</p>
                      <p>• You maintain full ownership and control of your data</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">AI Processing</h4>
                    <div className="text-sm text-slate-600 space-y-2">
                      <p>• AI responses are generated using Venice.ai API with privacy protection</p>
                      <p>• Conversations are processed to improve memory insights</p>
                      <p>• No conversation data is stored on external AI servers</p>
                      <p>• Memory analysis happens locally when possible</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Characters & Custom AIs</h4>
                    <div className="text-sm text-slate-600 space-y-2">
                      <p>• Custom characters are stored privately on your device/cloud</p>
                      <p>• Character conversations are never shared publicly</p>
                      <p>• You can create uncensored, personal scenarios safely</p>
                      <p>• Delete characters and their conversations anytime</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* About */}
            <TabsContent value="about" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    About MyAi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-2">Version Information</h4>
                    <div className="text-sm text-slate-600 space-y-1">
                      <p>MyAi Personal Memory Companion v2.0</p>
                      <p>Built with privacy and personalization in mind</p>
                      <p>Powered by Venice.ai for intelligent conversations</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Features</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>AI Personality Customization</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Custom AI Characters</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Voice Input & Recognition</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Memory Editing & Management</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Cloud Sync (iCloud/Google Drive)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Data Export (JSON/PDF)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>PWA & Offline Support</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Daily Check-ins & Mood Tracking</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Contact & Support</h4>
                    <div className="text-sm text-slate-600 space-y-1">
                      <p>For questions, feedback, or support:</p>
                      <p>Built with ❤️ for personal memory and reflection</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}
