"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  FileText,
  Database,
  Calendar,
  Loader2
} from "lucide-react";

interface ExportDataProps {
  userId: Id<"users">;
}

export default function ExportData({ userId }: ExportDataProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<"json" | "pdf" | null>(null);

  const user = useQuery(api.users.getCurrentUser);
  const memories = useQuery(api.memory.getMemoriesByUser, {});
  const conversations = useQuery(api.conversations.getConversationsByUser, {});
  const checkIns = useQuery(api.checkIns.getCheckInsByUser, {});
  const familyMembers = useQuery(api.family.getFamilyMembers, {});
  const reminders = useQuery(api.reminders.getRemindersByUser, {});

  const isDataLoaded = user && memories && conversations && checkIns && familyMembers && reminders;

  const exportToJSON = async () => {
    if (!isDataLoaded) return;

    setIsExporting(true);
    setExportType("json");

    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        user: {
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          timezone: user.timezone,
        },
        memories: memories.map(memory => ({
          type: memory.type,
          content: memory.content,
          summary: memory.summary,
          importance: memory.importance,
          tags: memory.tags,
          metadata: memory.metadata,
          createdAt: memory.createdAt,
          updatedAt: memory.updatedAt,
        })),
        conversations: conversations.map(conv => ({
          title: conv.title,
          messages: conv.messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
          })),
          createdAt: conv.createdAt,
        })),
        checkIns: checkIns.map(checkIn => ({
          date: checkIn.date,
          mood: checkIn.mood,
          emotions: checkIn.emotions,
          highlights: checkIn.highlights,
          challenges: checkIn.challenges,
          goals: checkIn.goals,
          gratitude: checkIn.gratitude,
          notes: checkIn.notes,
          createdAt: checkIn.createdAt,
        })),
        familyMembers: familyMembers.map(member => ({
          name: member.name,
          relationship: member.relationship,
          birthday: member.birthday,

          notes: member.notes,
          createdAt: member.createdAt,
        })),
        reminders: reminders.map(reminder => ({
          title: reminder.title,
          description: reminder.description,
          dueDate: reminder.dueDate,
          priority: reminder.priority,
          status: reminder.status,
          category: reminder.category,
          createdAt: reminder.createdAt,
          completedAt: reminder.completedAt,
        })),
        stats: {
          totalMemories: memories.length,
          totalConversations: conversations.length,
          totalCheckIns: checkIns.length,
          totalFamilyMembers: familyMembers.length,
          totalReminders: reminders.length,
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json"
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `myai-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const exportToPDF = async () => {
    if (!isDataLoaded) return;

    setIsExporting(true);
    setExportType("pdf");

    try {
      // Create HTML content for PDF
      const htmlContent = generatePDFContent();

      // Create a new window for printing
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        throw new Error("Popup blocked. Please allow popups for this site.");
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for content to load then print
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };

    } catch (error) {
      console.error("PDF export failed:", error);
      alert("PDF export failed. Please try again or check your popup settings.");
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const generatePDFContent = () => {
    if (!isDataLoaded) return "";

    const formatDate = (timestamp: number) => {
      return new Date(timestamp).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>MyAi Data Export - ${user.name || "User"}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
          h2 { color: #475569; margin-top: 30px; }
          h3 { color: #64748b; margin-top: 20px; }
          .section { margin-bottom: 30px; }
          .memory, .conversation, .checkin, .family, .reminder {
            border: 1px solid #e2e8f0;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            background: #f8fafc;
          }
          .tag {
            background: #e2e8f0;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            margin: 2px;
            display: inline-block;
          }
          .importance { color: #dc2626; font-weight: bold; }
          .mood { color: #059669; font-weight: bold; }
          .date { color: #6b7280; font-size: 0.9em; }
          .stats { display: flex; flex-wrap: wrap; gap: 20px; }
          .stat {
            background: #dbeafe;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            min-width: 120px;
          }
          .stat-number { font-size: 2em; font-weight: bold; color: #2563eb; }
          .stat-label { color: #475569; }
          @media print {
            body { margin: 20px; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>MyAi Personal Memory Export</h1>
        <p><strong>User:</strong> ${user.name || "Unknown"}</p>
        <p><strong>Export Date:</strong> ${formatDate(Date.now())}</p>

        <div class="section">
          <h2>Summary Statistics</h2>
          <div class="stats">
            <div class="stat">
              <div class="stat-number">${memories.length}</div>
              <div class="stat-label">Memories</div>
            </div>
            <div class="stat">
              <div class="stat-number">${conversations.length}</div>
              <div class="stat-label">Conversations</div>
            </div>
            <div class="stat">
              <div class="stat-number">${checkIns.length}</div>
              <div class="stat-label">Check-ins</div>
            </div>
            <div class="stat">
              <div class="stat-number">${familyMembers.length}</div>
              <div class="stat-label">Family & Friends</div>
            </div>
            <div class="stat">
              <div class="stat-number">${reminders.length}</div>
              <div class="stat-label">Reminders</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Memories (${memories.length})</h2>
          ${memories.map(memory => `
            <div class="memory">
              <h3>${memory.summary || memory.type.charAt(0).toUpperCase() + memory.type.slice(1)}</h3>
              <p>${memory.content}</p>
              <p><span class="importance">Importance: ${memory.importance}/10</span></p>
              <p>Tags: ${memory.tags.map(tag => `<span class="tag">#${tag}</span>`).join(' ')}</p>
              <p class="date">Created: ${formatDate(memory.createdAt)}</p>
            </div>
          `).join('')}
        </div>

        <div class="section">
          <h2>Daily Check-ins (${checkIns.length})</h2>
          ${checkIns.map(checkIn => `
            <div class="checkin">
              <h3>${checkIn.date}</h3>
              <p><span class="mood">Mood: ${checkIn.mood}/10</span></p>
              <p><strong>Emotions:</strong> ${checkIn.emotions.join(', ')}</p>
              ${checkIn.highlights?.length ? `<p><strong>Highlights:</strong> ${checkIn.highlights.join(', ')}</p>` : ''}
              ${checkIn.challenges?.length ? `<p><strong>Challenges:</strong> ${checkIn.challenges.join(', ')}</p>` : ''}
              ${checkIn.goals?.length ? `<p><strong>Goals:</strong> ${checkIn.goals.join(', ')}</p>` : ''}
              ${checkIn.gratitude?.length ? `<p><strong>Gratitude:</strong> ${checkIn.gratitude.join(', ')}</p>` : ''}
              ${checkIn.notes ? `<p><strong>Notes:</strong> ${checkIn.notes}</p>` : ''}
            </div>
          `).join('')}
        </div>

        <div class="section">
          <h2>Family & Friends (${familyMembers.length})</h2>
          ${familyMembers.map(member => `
            <div class="family">
              <h3>${member.name}</h3>
              <p><strong>Relationship:</strong> ${member.relationship}</p>
              ${member.birthday ? `<p><strong>Birthday:</strong> ${member.birthday}</p>` : ''}

              ${member.notes ? `<p><strong>Notes:</strong> ${member.notes}</p>` : ''}
            </div>
          `).join('')}
        </div>

        <div class="section">
          <h2>Reminders (${reminders.length})</h2>
          ${reminders.map(reminder => `
            <div class="reminder">
              <h3>${reminder.title}</h3>
              ${reminder.description ? `<p>${reminder.description}</p>` : ''}
              <p><strong>Priority:</strong> ${reminder.priority}</p>
              <p><strong>Status:</strong> ${reminder.status}</p>
              ${reminder.dueDate ? `<p><strong>Due:</strong> ${formatDate(reminder.dueDate)}</p>` : ''}
              ${reminder.category ? `<p><strong>Category:</strong> ${reminder.category}</p>` : ''}
            </div>
          `).join('')}
        </div>

        <div class="section">
          <h2>Conversations (${conversations.length})</h2>
          ${conversations.slice(0, 5).map(conv => `
            <div class="conversation">
              <h3>${conv.title || 'Untitled Conversation'}</h3>
              <p class="date">Started: ${formatDate(conv.createdAt)}</p>
              <p><strong>Messages:</strong> ${conv.messages.length}</p>
            </div>
          `).join('')}
          ${conversations.length > 5 ? `<p><em>... and ${conversations.length - 5} more conversations</em></p>` : ''}
        </div>

        <footer style="margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #6b7280;">
          <p>Generated by MyAi Personal Memory Companion</p>
          <p>Export Date: ${formatDate(Date.now())}</p>
        </footer>
      </body>
      </html>
    `;
  };

  const totalItems = (memories?.length || 0) +
                     (conversations?.length || 0) +
                     (checkIns?.length || 0) +
                     (familyMembers?.length || 0) +
                     (reminders?.length || 0);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Your Data</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalItems}</div>
            <div className="text-sm text-slate-600">Total items to export</div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <div className="font-semibold">{memories?.length || 0}</div>
              <div>Memories</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <div className="font-semibold">{conversations?.length || 0}</div>
              <div>Conversations</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <div className="font-semibold">{checkIns?.length || 0}</div>
              <div>Check-ins</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <div className="font-semibold">{(familyMembers?.length || 0) + (reminders?.length || 0)}</div>
              <div>Family & Reminders</div>
            </div>
          </div>

          <div className="space-y-3">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <Button
                  onClick={exportToJSON}
                  disabled={isExporting || !isDataLoaded}
                  className="w-full justify-start gap-3"
                  variant="ghost"
                >
                  {isExporting && exportType === "json" ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Database className="w-5 h-5" />
                  )}
                  <div className="text-left">
                    <div className="font-medium">JSON Export</div>
                    <div className="text-xs text-slate-500">
                      Complete data backup for import/restore
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <Button
                  onClick={exportToPDF}
                  disabled={isExporting || !isDataLoaded}
                  className="w-full justify-start gap-3"
                  variant="ghost"
                >
                  {isExporting && exportType === "pdf" ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                  <div className="text-left">
                    <div className="font-medium">PDF Report</div>
                    <div className="text-xs text-slate-500">
                      Formatted report for reading/printing
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </div>

          {!isDataLoaded && (
            <div className="text-center text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
              Loading your data...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
