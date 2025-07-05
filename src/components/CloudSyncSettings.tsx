"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalUser } from "@/hooks/useLocalUser";
import { localDB } from "@/lib/database/database";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Cloud,
  CloudOff,
  Shield,
  Smartphone,
  Monitor,
  RotateCw,
  CheckCircle,
  AlertTriangle,
  Info,
  Settings
} from "lucide-react";

interface CloudSyncSettingsProps {
  userId: Id<"users">;
}

export default function CloudSyncSettings({ userId }: CloudSyncSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");

  const user = useQuery(api.users.getUser, { userId });
  const updateCloudSync = useMutation(api.users.updateCloudSync);

  const cloudSync = user?.cloudSync;
  const isEnabled = cloudSync?.enabled || false;
  const provider = cloudSync?.provider || "none";
  const lastSync = cloudSync?.lastSync;

  const handleToggleSync = async (enabled: boolean) => {
    if (!enabled) {
      // Disable sync
      await updateCloudSync({
        userId,
        enabled: false,
        provider: "none",
      });
    } else {
      // User needs to select a provider
      setIsOpen(true);
    }
  };

  const handleConnectProvider = async (selectedProvider: "icloud" | "gdrive") => {
    setIsConnecting(true);
    setSyncStatus("syncing");

    try {
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In a real implementation, this would handle OAuth flow
      const mockSyncToken = `${selectedProvider}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await updateCloudSync({
        userId,
        enabled: true,
        provider: selectedProvider,
        syncToken: mockSyncToken,
      });

      setSyncStatus("success");
      setTimeout(() => {
        setIsOpen(false);
        setSyncStatus("idle");
      }, 1500);
    } catch (error) {
      console.error("Failed to connect cloud sync:", error);
      setSyncStatus("error");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleManualSync = async () => {
    if (!isEnabled) return;

    setSyncStatus("syncing");
    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 1500));

      await updateCloudSync({
        userId,
        enabled: true,
        provider,
      });

      setSyncStatus("success");
      setTimeout(() => setSyncStatus("idle"), 2000);
    } catch (error) {
      setSyncStatus("error");
      setTimeout(() => setSyncStatus("idle"), 2000);
    }
  };

  const formatLastSync = (timestamp?: number) => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getProviderInfo = (providerType: string) => {
    const providers = {
      icloud: {
        name: "iCloud",
        description: "Secure sync with Apple's iCloud service",
        features: ["End-to-end encryption", "Cross-device sync", "Automatic backup"],
        icon: "☁️",
        color: "from-blue-500 to-blue-600"
      },
      gdrive: {
        name: "Google Drive",
        description: "Reliable sync with Google Drive storage",
        features: ["Robust infrastructure", "Large storage capacity", "Fast synchronization"],
        icon: "📁",
        color: "from-green-500 to-green-600"
      }
    };
    return providers[providerType as keyof typeof providers];
  };

  const getSyncStatusInfo = () => {
    switch (syncStatus) {
      case "syncing":
        return { icon: RotateCw, text: "Syncing...", color: "text-blue-600" };
      case "success":
        return { icon: CheckCircle, text: "Synced", color: "text-green-600" };
      case "error":
        return { icon: AlertTriangle, text: "Sync failed", color: "text-red-600" };
      default:
        return { icon: Cloud, text: "Ready", color: "text-slate-600" };
    }
  };

  const statusInfo = getSyncStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-4">
      {/* Current Status Card */}
      <Card className={`${isEnabled ? 'border-green-200 bg-green-50/50' : 'border-slate-200'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isEnabled ? (
                <Cloud className="w-5 h-5 text-green-600" />
              ) : (
                <CloudOff className="w-5 h-5 text-slate-400" />
              )}
              <div>
                <div className="font-medium">
                  {isEnabled ? `Connected to ${getProviderInfo(provider)?.name || provider}` : "Cloud Sync Disabled"}
                </div>
                <div className="text-sm text-slate-600">
                  {isEnabled ? `Last sync: ${formatLastSync(lastSync)}` : "Your data stays local"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-1 ${statusInfo.color}`}>
                <StatusIcon className="w-4 h-4" />
                <span className="text-sm">{statusInfo.text}</span>
              </div>
              <Switch
                checked={isEnabled}
                onCheckedChange={handleToggleSync}
                disabled={isConnecting}
              />
            </div>
          </div>

          {isEnabled && (
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSync}
                disabled={syncStatus === "syncing"}
                className="gap-2"
              >
                <RotateCw className={`w-4 h-4 ${syncStatus === "syncing" ? "animate-spin" : ""}`} />
                Sync Now
              </Button>
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="w-4 h-4" />
                    Settings
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cloud className="w-5 h-5" />
              Cloud Sync Setup
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {syncStatus === "success" ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Successfully Connected!
                </h3>
                <p className="text-green-700">
                  Your data will now sync automatically across all your devices.
                </p>
              </div>
            ) : (
              <>
                {/* Info Section */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-800 mb-1">Privacy & Security</h4>
                        <p className="text-blue-700 text-sm">
                          Your data is encrypted before syncing. Only you can decrypt and access your personal information.
                          MyAi never stores your data on central servers.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Benefits */}
                <div>
                  <h4 className="font-medium mb-3">Benefits of Cloud Sync</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-green-600" />
                      <span>Cross-device access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span>Encrypted backup</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <RotateCw className="w-4 h-4 text-purple-600" />
                      <span>Automatic sync</span>
                    </div>
                  </div>
                </div>

                {/* Provider Selection */}
                <div>
                  <h4 className="font-medium mb-3">Choose Your Cloud Provider</h4>
                  <div className="grid gap-4">
                    {["icloud", "gdrive"].map((providerType) => {
                      const info = getProviderInfo(providerType);
                      if (!info) return null;

                      return (
                        <Card
                          key={providerType}
                          className="cursor-pointer hover:shadow-md transition-all border-2 hover:border-blue-300"
                          onClick={() => handleConnectProvider(providerType as "icloud" | "gdrive")}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className={`w-12 h-12 bg-gradient-to-br ${info.color} rounded-lg flex items-center justify-center text-2xl`}>
                                {info.icon}
                              </div>
                              <div className="flex-1">
                                <h5 className="font-medium text-lg mb-1">{info.name}</h5>
                                <p className="text-slate-600 text-sm mb-3">{info.description}</p>
                                <div className="flex flex-wrap gap-1">
                                  {info.features.map((feature, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {feature}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <Button
                                disabled={isConnecting}
                                className="shrink-0"
                              >
                                {isConnecting ? "Connecting..." : "Connect"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Warning */}
                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-800 mb-1">Important Note</h4>
                        <p className="text-amber-700 text-sm">
                          Cloud sync is optional. MyAi works perfectly with local storage only.
                          You can enable or disable sync at any time in your settings.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Action Buttons */}
            {syncStatus !== "success" && (
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
