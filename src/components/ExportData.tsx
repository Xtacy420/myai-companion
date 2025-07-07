"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useLocalUser } from "@/hooks/useLocalUser";
import {
  Download,
  FileText,
  Database,
  Calendar,
  Loader2
} from "lucide-react";

interface ExportDataProps {
  userId: string;
}

export default function ExportData({ userId }: ExportDataProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<"json" | "pdf" | null>(null);
  const { user, exportUserData, getDatabaseSize } = useLocalUser();

  const exportToJSON = async () => {
    if (!user) return;

    setIsExporting(true);
    setExportType("json");

    try {
      const data = await exportUserData();
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `myai-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const exportToPDF = async () => {
    // PDF export would require additional implementation
    console.log("PDF export not yet implemented");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Export Your Data
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-slate-600 text-sm">
            Download a complete backup of your MyAi data including conversations, memories, and settings.
          </p>

          <div className="space-y-3">
            <Card className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={exportToJSON}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div>
                      <div className="font-medium">JSON Export</div>
                      <div className="text-sm text-slate-600">Complete data backup</div>
                    </div>
                  </div>
                  <Badge variant="secondary">Recommended</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              onClick={exportToJSON}
              disabled={isExporting || !user}
              className="gap-2"
            >
              {isExporting && exportType === "json" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export JSON
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
