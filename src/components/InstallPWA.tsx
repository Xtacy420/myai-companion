"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  X,
  Smartphone,
  Monitor,
  Wifi,
  Bell
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showFeatureHighlight, setShowFeatureHighlight] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Show install prompt after a delay if user hasn't dismissed it
      const installPromptDismissed = localStorage.getItem('myai-install-dismissed');
      if (!installPromptDismissed) {
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 30000); // Show after 30 seconds
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('MyAi: PWA was installed');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Show feature highlight on first visit
    const featuresShown = localStorage.getItem('myai-features-shown');
    if (!featuresShown) {
      setTimeout(() => {
        setShowFeatureHighlight(true);
        localStorage.setItem('myai-features-shown', 'true');
      }, 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`MyAi: User ${outcome} the install prompt`);
    setDeferredPrompt(null);
    setShowInstallPrompt(false);

    if (outcome === 'dismissed') {
      localStorage.setItem('myai-install-dismissed', 'true');
    }
  };

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('myai-install-dismissed', 'true');
  };

  const handleDismissFeatures = () => {
    setShowFeatureHighlight(false);
  };

  if (isInstalled) {
    return null; // Don't show anything if already installed
  }

  return (
    <>
      {/* Install Prompt */}
      {showInstallPrompt && deferredPrompt && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:w-96 z-50 animate-in slide-in-from-bottom-4">
          <Card className="border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Download className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900">Install MyAi</h3>
                    <p className="text-xs text-blue-700">Get the full app experience</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismissInstall}
                  className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex gap-2 mb-3 text-xs">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <Wifi className="w-3 h-3 mr-1" />
                  Works Offline
                </Badge>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  <Smartphone className="w-3 h-3 mr-1" />
                  Mobile Ready
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleInstallClick}
                  size="sm"
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Install App
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDismissInstall}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  Not Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Feature Highlight */}
      {showFeatureHighlight && (
        <div className="fixed top-4 left-4 right-4 md:left-auto md:w-80 z-50 animate-in slide-in-from-top-4">
          <Card className="border border-green-200 bg-gradient-to-r from-green-50 to-blue-50 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Bell className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900">New Features!</h3>
                    <p className="text-xs text-green-700">Enhanced MyAi experience</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismissFeatures}
                  className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2 text-xs text-green-800 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-green-600 rounded-full"></div>
                  <span>🎤 Voice input for hands-free chat</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-green-600 rounded-full"></div>
                  <span>✏️ Edit and enhance your memories</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-green-600 rounded-full"></div>
                  <span>📤 Export your data anytime</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-green-600 rounded-full"></div>
                  <span>🧠 Smarter AI responses</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDismissFeatures}
                className="w-full border-green-200 text-green-700 hover:bg-green-50"
              >
                Got it!
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
