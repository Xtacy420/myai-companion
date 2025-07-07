"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useLocalUser } from "@/hooks/useLocalUser";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Cloud,
  CloudOff,
  Settings,
  Upload,
  Download,
  Save,
  AlertTriangle,
  CheckCircle2,
  Key,
  Shield
} from "lucide-react";

interface CloudSyncSettingsProps {
  userId: string;
}

export default function CloudSyncSettings({ userId }: CloudSyncSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, updateUser } = useLocalUser();

  // Form state
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState("");
  const [autoSyncInterval, setAutoSyncInterval] = useState("never");
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load current settings
  useEffect(() => {
    if (user?.cloudSync) {
      const settings = user.cloudSync;
      setCloudSyncEnabled(settings.enabled || false);
      setEncryptionKey(settings.encryptionKey || "");
      setAutoSyncInterval(settings.autoSyncInterval || "never");
      setLastSyncTime(settings.lastSyncTime || null);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const cloudSyncSettings = {
        enabled: cloudSyncEnabled,
        provider: "default",
        encryptionKey: encryptionKey.trim(),
        autoSyncInterval,
        lastSyncTime: lastSyncTime || undefined,
      };

      await updateUser({
        cloudSync: cloudSyncSettings,
      });

      setIsOpen(false);
    } catch (error) {
      console.error("Failed to update cloud sync settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateEncryptionKey = () => {
    const key = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    setEncryptionKey(key);
  };

  const syncIntervalOptions = [
    { value: "never", label: "Never", description: "Manual sync only" },
    { value: "daily", label: "Daily", description: "Sync once per day" },
    { value: "weekly", label: "Weekly", description: "Sync once per week" },
    { value: "monthly", label: "Monthly", description: "Sync once per month" },
  ];

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
    return `${Math.floor(diffMinutes / 1440)} days ago`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          {cloudSyncEnabled ? (
            <>
              <Cloud className="w-4 h-4" />
              Cloud Sync
            </>
          ) : (
            <>
              <CloudOff className="w-4 h-4" />
              Cloud Sync
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Cloud Sync Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Overview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {cloudSyncEnabled ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Cloud Sync Enabled
                  </>
                ) : (
                  <>
                    <CloudOff className="w-4 h-4 text-slate-500" />
                    Cloud Sync Disabled
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">
                    {cloudSyncEnabled
                      ? "Your data is being synced to the cloud with encryption"
                      : "Enable cloud sync to backup your data securely"
                    }
                  </p>
                  {cloudSyncEnabled && (
                    <p className="text-xs text-slate-500 mt-1">
                      Last sync: {formatLastSync(lastSyncTime)}
                    </p>
                  )}
                </div>
                <Switch
                  checked={cloudSyncEnabled}
                  onCheckedChange={setCloudSyncEnabled}
                />
              </div>
            </CardContent>
          </Card>

          {cloudSyncEnabled && (
            <>
              {/* Encryption Settings */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Encryption & Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                      <div className="text-sm">
                        <div className="font-medium text-amber-800">
                          Keep your encryption key safe
                        </div>
                        <div className="text-amber-700">
                          If you lose this key, your synced data cannot be recovered. Store it securely.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-medium flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      Encryption Key
                    </Label>
                    <div className="mt-2 flex gap-2">
                      <Input
                        type="password"
                        placeholder="Enter or generate encryption key"
                        value={encryptionKey}
                        onChange={(e) => setEncryptionKey(e.target.value)}
                        className="font-mono text-xs"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={generateEncryptionKey}
                      >
                        Generate
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      A strong encryption key protects your data during sync and storage
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Sync Schedule */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Sync Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {syncIntervalOptions.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id={option.value}
                          name="syncInterval"
                          value={option.value}
                          checked={autoSyncInterval === option.value}
                          onChange={(e) => setAutoSyncInterval(e.target.value)}
                          className="w-4 h-4"
                        />
                        <label htmlFor={option.value} className="flex-1 cursor-pointer">
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-slate-600">{option.description}</div>
                        </label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Manual Sync Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Manual Sync</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button variant="outline" className="gap-2 flex-1">
                      <Upload className="w-4 h-4" />
                      Upload Now
                    </Button>
                    <Button variant="outline" className="gap-2 flex-1">
                      <Download className="w-4 h-4" />
                      Download Latest
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Manually sync your data independent of the automatic schedule
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {/* Privacy Notice */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-blue-800 mb-1">
                    Privacy & Security
                  </div>
                  <div className="text-blue-700 space-y-1">
                    <p>• All data is encrypted before leaving your device</p>
                    <p>• Your encryption key is never stored in the cloud</p>
                    <p>• Only you can decrypt and access your synced data</p>
                    <p>• Data is stored securely with end-to-end encryption</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading || (cloudSyncEnabled && !encryptionKey.trim())}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
