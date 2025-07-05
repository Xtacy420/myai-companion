"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocalUser } from "@/hooks/useLocalUser";
import { localDB } from "@/lib/database/database";
import type { LifeTemplate, CustomCalendar } from "@/lib/database/schema";
import { Plus, Edit, Trash2, Repeat, Play, Info } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@/hooks/useUser";

interface LifeTemplate {
  _id: string;
  name: string;
  description?: string;
  category: string;
  template: {
    title: string;
    type: string;
    recurring: {
      frequency: string;
      interval: number;
      daysOfWeek?: number[];
      dayOfMonth?: number;
    };
    defaultReminders?: Array<{
      minutes: number;
      type: string;
    }>;
    metadata?: {
      amount?: number;
      provider?: string;
      accountNumber?: string;
    };
  };
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

interface LifeTemplateManagerProps {
  onClose?: () => void;
}

interface RecurringSettings {
  frequency: string;
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
}

const TEMPLATE_CATEGORIES = [
  { value: "bills", label: "Bills", icon: DollarSign, description: "Monthly bills and payments" },
  { value: "health", label: "Health", icon: Heart, description: "Medical appointments and health reminders" },
  { value: "maintenance", label: "Maintenance", icon: Settings, description: "Vehicle, home, and equipment maintenance" },
  { value: "personal", label: "Personal", icon: Home, description: "Personal goals and activities" },
  { value: "work", label: "Work", icon: Briefcase, description: "Work-related recurring tasks" },
];

const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const EVENT_TYPES = [
  { value: "bill", label: "Bill Payment" },
  { value: "appointment", label: "Appointment" },
  { value: "reminder", label: "Reminder" },
  { value: "task", label: "Task" },
  { value: "maintenance", label: "Maintenance" },
];

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export default function LifeTemplateManager({ onClose }: LifeTemplateManagerProps) {
  const { userId } = useUser();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<LifeTemplate | null>(null);
  const [showAutomationDialog, setShowAutomationDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<LifeTemplate | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "bills",
    template: {
      title: "",
      type: "bill",
      recurring: {
        frequency: "monthly",
        interval: 1,
        daysOfWeek: [] as number[],
        dayOfMonth: 1,
      },
      defaultReminders: [
        { minutes: 1440, type: "notification" }, // 1 day before
      ],
      metadata: {
        amount: undefined as number | undefined,
        provider: "",
        accountNumber: "",
      },
    },
  });

  // Automation settings
  const [automationSettings, setAutomationSettings] = useState({
    numberOfOccurrences: 12,
    startDate: new Date().toISOString().split('T')[0],
    calendarId: "",
  });

  // Queries and mutations
  const [templates, setTemplates] = useState<LifeTemplate[]>([]);
  const [calendars, setCalendars] = useState<CustomCalendar[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadTemplates();
      loadCalendars();
    }
  }, [userId]);

  const loadTemplates = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const userTemplates = await localDB.getUserTemplates(userId);
      setTemplates(userTemplates);
    } catch (error) {
      console.error("Failed to load templates:", error);
    }
    setIsLoading(false);
  };

  const loadCalendars = async () => {
    if (!userId) return;
    try {
      const userCalendars = await localDB.getUserCalendars(userId);
      setCalendars(userCalendars);
    } catch (error) {
      console.error("Failed to load calendars:", error);
    }
  };

  const handleSaveTemplate = async (templateData: TemplateFormData) => {
    if (!userId) return;

    const data: Omit<LifeTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        name: templateData.name,
        description: templateData.description,
        category: templateData.category,
        template: templateData.template,
        isActive: true
    }

    if (editingTemplate) {
        await localDB.updateLifeTemplate(editingTemplate.id, data);
    } else {
        await localDB.createLifeTemplate(data as LifeTemplate);
    }
    await loadTemplates();
    setShowTemplateDialog(false);
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
        await localDB.deleteLifeTemplate(templateId);
        await loadTemplates();
    }
  };

  const handleToggleActive = async (template: LifeTemplate) => {
      await localDB.updateLifeTemplate(template.id, { isActive: !template.isActive });
      await loadTemplates();
  };

  const handleCreateTemplate = async () => {
    if (!formData.name.trim() || !formData.template.title.trim()) return;

    try {
      await createTemplate({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category,
        template: {
          ...formData.template,
          metadata: formData.template.metadata.amount
            ? formData.template.metadata
            : undefined,
        },
      });

      resetForm();
      setShowCreateDialog(false);
    } catch (error) {
      console.error("Failed to create template:", error);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate || !formData.name.trim()) return;

    try {
      await updateTemplate({
        templateId: editingTemplate._id,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category,
        template: {
          ...formData.template,
          metadata: formData.template.metadata.amount
            ? formData.template.metadata
            : undefined,
        },
      });

      resetForm();
      setShowCreateDialog(false);
    } catch (error) {
      console.error("Failed to update template:", error);
    }
  };

  const handleEditTemplate = (template: LifeTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      category: template.category,
      template: {
        ...template.template,
        metadata: template.template.metadata || {
          amount: undefined,
          provider: "",
          accountNumber: "",
        },
      },
    });
    setShowCreateDialog(true);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      await deleteTemplate({ templateId });
    } catch (error) {
      console.error("Failed to delete template:", error);
    }
  };

  const handleToggleTemplate = async (template: LifeTemplate) => {
    try {
      await updateTemplate({
        templateId: template._id,
        isActive: !template.isActive,
      });
    } catch (error) {
      console.error("Failed to toggle template:", error);
    }
  };

  const handleAutomateTemplate = (template: LifeTemplate) => {
    setSelectedTemplate(template);
    setAutomationSettings({
      numberOfOccurrences: 12,
      startDate: new Date().toISOString().split('T')[0],
      calendarId: calendars?.[0]?._id || "",
    });
    setShowAutomationDialog(true);
  };

  const executeAutomation = async () => {
    if (!selectedTemplate || !automationSettings.calendarId) return;

    try {
      await createEventsFromTemplate({
        templateId: selectedTemplate._id,
        calendarId: automationSettings.calendarId,
        startDate: new Date(automationSettings.startDate).getTime(),
        numberOfOccurrences: automationSettings.numberOfOccurrences,
      });

      setShowAutomationDialog(false);
      setSelectedTemplate(null);
    } catch (error) {
      console.error("Failed to create events from template:", error);
    }
  };

  const initializeDefaults = async () => {
    try {
      await initializeDefaultTemplates();
    } catch (error) {
      console.error("Failed to initialize default templates:", error);
    }
  };

  const getRecurringDescription = (recurring: RecurringSettings) => {
    const { frequency, interval, daysOfWeek, dayOfMonth } = recurring;

    if (frequency === "weekly" && daysOfWeek?.length) {
      const dayNames = daysOfWeek.map(day => DAYS_OF_WEEK.find(d => d.value === day)?.label).join(", ");
      return `Every ${interval > 1 ? `${interval} weeks` : "week"} on ${dayNames}`;
    } else if (frequency === "monthly") {
      return `Every ${interval > 1 ? `${interval} months` : "month"} on day ${dayOfMonth}`;
    } else if (frequency === "yearly") {
      return `Every ${interval > 1 ? `${interval} years` : "year"}`;
    } else {
      return `Every ${interval > 1 ? `${interval} ${frequency}` : frequency.slice(0, -2)}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Repeat className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold">Life Templates</h3>
          <Badge variant="secondary" className="text-xs">
            {templates?.filter(t => t.isActive).length || 0} active
          </Badge>
        </div>
        <div className="flex gap-2">
          {(!templates || templates.length === 0) && (
            <Button variant="outline" size="sm" onClick={initializeDefaults} className="gap-2">
              <Zap className="w-3 h-3" />
              Add Defaults
            </Button>
          )}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2" onClick={resetForm}>
                <Plus className="w-4 h-4" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Repeat className="w-5 h-5" />
                  {editingTemplate ? "Edit Template" : "Create Life Template"}
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="recurring">Recurring</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="template-name">Template Name</Label>
                      <Input
                        id="template-name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Monthly Bills"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={formData.category} onValueChange={(value) =>
                        setFormData(prev => ({ ...prev, category: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TEMPLATE_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              <div className="flex items-center gap-2">
                                <cat.icon className="w-4 h-4" />
                                <div>
                                  <div className="font-medium">{cat.label}</div>
                                  <div className="text-xs text-slate-500">{cat.description}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="template-description">Description</Label>
                    <Textarea
                      id="template-description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Template description..."
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="event-title">Event Title</Label>
                      <Input
                        id="event-title"
                        value={formData.template.title}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          template: { ...prev.template, title: e.target.value }
                        }))}
                        placeholder="Electric Bill Payment"
                      />
                    </div>
                    <div>
                      <Label htmlFor="event-type">Event Type</Label>
                      <Select value={formData.template.type} onValueChange={(value) =>
                        setFormData(prev => ({
                          ...prev,
                          template: { ...prev.template, type: value }
                        }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EVENT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="recurring" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Frequency</Label>
                      <Select value={formData.template.recurring.frequency} onValueChange={(value) =>
                        setFormData(prev => ({
                          ...prev,
                          template: {
                            ...prev.template,
                            recurring: { ...prev.template.recurring, frequency: value }
                          }
                        }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FREQUENCY_OPTIONS.map((freq) => (
                            <SelectItem key={freq.value} value={freq.value}>
                              {freq.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="interval">Interval</Label>
                      <Input
                        id="interval"
                        type="number"
                        min="1"
                        value={formData.template.recurring.interval}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          template: {
                            ...prev.template,
                            recurring: { ...prev.template.recurring, interval: parseInt(e.target.value) || 1 }
                          }
                        }))}
                        placeholder="1"
                      />
                    </div>
                  </div>

                  {formData.template.recurring.frequency === "weekly" && (
                    <div>
                      <Label>Days of Week</Label>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {DAYS_OF_WEEK.map((day) => (
                          <div key={day.value} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`day-${day.value}`}
                              checked={formData.template.recurring.daysOfWeek?.includes(day.value) || false}
                              onChange={(e) => {
                                const daysOfWeek = formData.template.recurring.daysOfWeek || [];
                                if (e.target.checked) {
                                  setFormData(prev => ({
                                    ...prev,
                                    template: {
                                      ...prev.template,
                                      recurring: {
                                        ...prev.template.recurring,
                                        daysOfWeek: [...daysOfWeek, day.value]
                                      }
                                    }
                                  }));
                                } else {
                                  setFormData(prev => ({
                                    ...prev,
                                    template: {
                                      ...prev.template,
                                      recurring: {
                                        ...prev.template.recurring,
                                        daysOfWeek: daysOfWeek.filter(d => d !== day.value)
                                      }
                                    }
                                  }));
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                            <Label htmlFor={`day-${day.value}`} className="text-sm">
                              {day.label.slice(0, 3)}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.template.recurring.frequency === "monthly" && (
                    <div>
                      <Label htmlFor="day-of-month">Day of Month</Label>
                      <Input
                        id="day-of-month"
                        type="number"
                        min="1"
                        max="31"
                        value={formData.template.recurring.dayOfMonth}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          template: {
                            ...prev.template,
                            recurring: { ...prev.template.recurring, dayOfMonth: parseInt(e.target.value) || 1 }
                          }
                        }))}
                      />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4">
                  {formData.template.type === "bill" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          value={formData.template.metadata?.amount || ""}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            template: {
                              ...prev.template,
                              metadata: {
                                ...prev.template.metadata,
                                amount: parseFloat(e.target.value) || undefined
                              }
                            }
                          }))}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="provider">Provider</Label>
                        <Input
                          id="provider"
                          value={formData.template.metadata?.provider || ""}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            template: {
                              ...prev.template,
                              metadata: {
                                ...prev.template.metadata,
                                provider: e.target.value
                              }
                            }
                          }))}
                          placeholder="Electric Company"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>Default Reminders</Label>
                    <div className="space-y-2 mt-2">
                      {formData.template.defaultReminders?.map((reminder, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={reminder.minutes}
                            onChange={(e) => {
                              const reminders = [...(formData.template.defaultReminders || [])];
                              reminders[index] = { ...reminder, minutes: parseInt(e.target.value) || 0 };
                              setFormData(prev => ({
                                ...prev,
                                template: { ...prev.template, defaultReminders: reminders }
                              }));
                            }}
                            className="w-24"
                          />
                          <span className="text-sm text-slate-500">minutes before</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const reminders = formData.template.defaultReminders?.filter((_, i) => i !== index) || [];
                              setFormData(prev => ({
                                ...prev,
                                template: { ...prev.template, defaultReminders: reminders }
                              }));
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const reminders = [...(formData.template.defaultReminders || []), { minutes: 60, type: "notification" }];
                          setFormData(prev => ({
                            ...prev,
                            template: { ...prev.template, defaultReminders: reminders }
                          }));
                        }}
                        className="gap-2"
                      >
                        <Plus className="w-3 h-3" />
                        Add Reminder
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}>
                  {editingTemplate ? "Update" : "Create"} Template
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Template List */}
      <div className="space-y-3">
        {templates && templates.length > 0 ? (
          templates.map((template) => {
            const categoryInfo = TEMPLATE_CATEGORIES.find(cat => cat.value === template.category);
            const CategoryIcon = categoryInfo?.icon || Repeat;

            return (
              <Card key={template._id} className={`transition-colors ${template.isActive ? "" : "opacity-75"}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      template.isActive ? "bg-purple-100 text-purple-600" : "bg-slate-100 text-slate-400"
                    }`}>
                      <CategoryIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            {template.name}
                            <Badge variant={template.isActive ? "default" : "secondary"} className="text-xs">
                              {template.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </h4>
                          {template.description && (
                            <p className="text-sm text-slate-600 mt-1">{template.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleTemplate(template)}
                            className="p-1 h-auto"
                            title={template.isActive ? "Deactivate" : "Activate"}
                          >
                            {template.isActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAutomateTemplate(template)}
                            className="p-1 h-auto text-purple-600"
                            title="Generate Events"
                          >
                            <Zap className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTemplate(template)}
                            className="p-1 h-auto"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTemplate(template._id)}
                            className="p-1 h-auto text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-2 space-y-1">
                        <div className="text-sm text-slate-700">
                          <strong>Event:</strong> {template.template.title}
                        </div>
                        <div className="text-sm text-slate-600">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {getRecurringDescription(template.template.recurring)}
                        </div>
                        {template.template.metadata?.amount && (
                          <div className="text-sm text-slate-600">
                            <DollarSign className="w-3 h-3 inline mr-1" />
                            ${template.template.metadata.amount.toFixed(2)}
                            {template.template.metadata.provider && ` - ${template.template.metadata.provider}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center text-slate-500 py-8">
            <Repeat className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <div className="text-sm">No life templates created yet</div>
            <div className="text-xs mt-1">Create templates to automate recurring events</div>
          </div>
        )}
      </div>

      {/* Automation Dialog */}
      <Dialog open={showAutomationDialog} onOpenChange={setShowAutomationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              Generate Events
            </DialogTitle>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg">
                <h4 className="font-medium text-sm">{selectedTemplate.name}</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Will create: "{selectedTemplate.template.title}"
                </p>
                <p className="text-xs text-slate-600">
                  {getRecurringDescription(selectedTemplate.template.recurring)}
                </p>
              </div>

              <div>
                <Label htmlFor="target-calendar">Target Calendar</Label>
                <Select value={automationSettings.calendarId} onValueChange={(value) =>
                  setAutomationSettings(prev => ({ ...prev, calendarId: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select calendar" />
                  </SelectTrigger>
                  <SelectContent>
                    {calendars?.map((calendar) => (
                      <SelectItem key={calendar._id} value={calendar._id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: calendar.color }} />
                          {calendar.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={automationSettings.startDate}
                  onChange={(e) => setAutomationSettings(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="occurrences">Number of Occurrences</Label>
                <Input
                  id="occurrences"
                  type="number"
                  min="1"
                  max="24"
                  value={automationSettings.numberOfOccurrences}
                  onChange={(e) => setAutomationSettings(prev => ({
                    ...prev,
                    numberOfOccurrences: parseInt(e.target.value) || 1
                  }))}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Creates {automationSettings.numberOfOccurrences} future events
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowAutomationDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={executeAutomation} className="gap-2">
                  <Target className="w-4 h-4" />
                  Generate Events
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
