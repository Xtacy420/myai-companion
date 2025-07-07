"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocalUser } from "@/hooks/useLocalUser";
import { localDB } from "@/lib/database/database";
import {
  type LifeTemplate,
  LifeArea,
  type LifeGoal,
  LifeValue,
  LifeMilestone
} from "@/lib/database/schema";
import {
  Target,
  Plus,
  Calendar,
  TrendingUp,
  Award,
  Heart,
  Brain,
  Briefcase,
  Users,
  Activity,
  BookOpen,
  Home,
  DollarSign,
  Sparkles,
  CheckCircle2,
  Circle,
  Edit,
  Trash2,
  Save,
  Star
} from "lucide-react";

interface LifeTemplateManagerProps {
  userId: string;
}

export default function LifeTemplateManager({ userId }: LifeTemplateManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<LifeTemplate | null>(null);
  const [templates, setTemplates] = useState<LifeTemplate[]>([]);
  const [userGoals, setUserGoals] = useState<LifeGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadTemplatesAndGoals();
    }
  }, [userId]);

  const loadTemplatesAndGoals = async () => {
    try {
      setIsLoading(true);
      // For now, we'll use predefined templates since this is a complex feature
      // In a real implementation, these would be stored in the database
      const defaultTemplates = getDefaultTemplates();
      setTemplates(defaultTemplates);

      // Load user's current goals
      const goals = await localDB.getLifeGoalsByUser(userId);
      setUserGoals(goals);
    } catch (error) {
      console.error("Failed to load templates and goals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultTemplates = (): LifeTemplate[] => [
    {
      id: "personal-growth",
      name: "Personal Growth & Development",
      description: "Focus on self-improvement, learning, and personal development",
      category: "self-development",
      areas: [
        {
          id: "mindfulness",
          name: "Mindfulness & Mental Health",
          description: "Develop mental clarity and emotional well-being",
          icon: "brain",
          color: "purple",
          goals: [
            { title: "Practice meditation daily", type: "habit", timeframe: "ongoing" },
            { title: "Read 12 books this year", type: "achievement", timeframe: "yearly" },
            { title: "Complete a mindfulness course", type: "learning", timeframe: "quarterly" }
          ],
          values: ["mindfulness", "growth", "balance"],
          milestones: [
            { title: "30-day meditation streak", description: "Meditate every day for 30 days" },
            { title: "Complete first book", description: "Finish reading your first book of the year" }
          ]
        },
        {
          id: "skills",
          name: "Skills & Learning",
          description: "Continuous learning and skill development",
          icon: "book",
          color: "blue",
          goals: [
            { title: "Learn a new language", type: "learning", timeframe: "yearly" },
            { title: "Take an online course monthly", type: "habit", timeframe: "monthly" },
            { title: "Attend workshops and seminars", type: "experience", timeframe: "quarterly" }
          ],
          values: ["curiosity", "growth", "knowledge"],
          milestones: [
            { title: "Complete first course", description: "Finish your first online course" },
            { title: "Basic language proficiency", description: "Achieve conversational level in new language" }
          ]
        }
      ],
      isActive: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "career-success",
      name: "Career & Professional Success",
      description: "Advance your career and achieve professional goals",
      category: "career",
      areas: [
        {
          id: "career-growth",
          name: "Career Advancement",
          description: "Progress in your professional journey",
          icon: "briefcase",
          color: "green",
          goals: [
            { title: "Get promoted within 18 months", type: "achievement", timeframe: "yearly" },
            { title: "Build professional network", type: "relationship", timeframe: "ongoing" },
            { title: "Develop leadership skills", type: "learning", timeframe: "quarterly" }
          ],
          values: ["excellence", "leadership", "innovation"],
          milestones: [
            { title: "First networking event", description: "Attend your first professional networking event" },
            { title: "Complete leadership course", description: "Finish a leadership development program" }
          ]
        }
      ],
      isActive: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "health-wellness",
      name: "Health & Wellness",
      description: "Maintain physical and mental health",
      category: "health",
      areas: [
        {
          id: "fitness",
          name: "Physical Fitness",
          description: "Stay active and maintain physical health",
          icon: "activity",
          color: "red",
          goals: [
            { title: "Exercise 4 times per week", type: "habit", timeframe: "weekly" },
            { title: "Run a 10K race", type: "achievement", timeframe: "quarterly" },
            { title: "Maintain healthy weight", type: "ongoing", timeframe: "ongoing" }
          ],
          values: ["health", "discipline", "vitality"],
          milestones: [
            { title: "First 5K run", description: "Complete your first 5K run" },
            { title: "30-day exercise streak", description: "Exercise consistently for 30 days" }
          ]
        }
      ],
      isActive: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ];

  const handleApplyTemplate = async (template: LifeTemplate) => {
    try {
      // Create goals for each area in the template
      for (const area of template.areas) {
        for (const goalData of area.goals) {
          const newGoal: LifeGoal = {
            id: localDB.generateId(),
            userId,
            title: goalData.title,
            description: `From ${template.name} template - ${area.name}`,
            category: area.name,
            type: goalData.type,
            timeframe: goalData.timeframe,
            status: "not_started",
            priority: "medium",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          await localDB.createLifeGoal(newGoal);
        }
      }

      await loadTemplatesAndGoals();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to apply template:", error);
    }
  };

  const getAreaIcon = (iconName: string) => {
    const icons: { [key: string]: React.ComponentType<{ className?: string }> } = {
      brain: Brain,
      book: BookOpen,
      briefcase: Briefcase,
      activity: Activity,
      users: Users,
      home: Home,
      "dollar-sign": DollarSign,
      heart: Heart,
    };
    return icons[iconName] || Target;
  };

  const getAreaColor = (color: string) => {
    const colors: { [key: string]: string } = {
      purple: "bg-purple-100 text-purple-800 border-purple-200",
      blue: "bg-blue-100 text-blue-800 border-blue-200",
      green: "bg-green-100 text-green-800 border-green-200",
      red: "bg-red-100 text-red-800 border-red-200",
      yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
      pink: "bg-pink-100 text-pink-800 border-pink-200",
    };
    return colors[color] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse">Loading life templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Life Templates</h2>
          <p className="text-slate-600">
            Structured frameworks to help you achieve your life goals
          </p>
        </div>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          <Target className="w-4 h-4 mr-1" />
          {userGoals.length} Active Goals
        </Badge>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{template.name}</CardTitle>
                  <p className="text-slate-600 mt-1">{template.description}</p>
                </div>
                <Dialog open={isDialogOpen && selectedTemplate?.id === template.id} onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (open) setSelectedTemplate(template);
                }}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Sparkles className="w-4 h-4" />
                      Apply Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Apply Template: {template.name}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <p className="text-slate-600 mb-6">{template.description}</p>

                      <div className="space-y-6">
                        {template.areas.map((area) => {
                          const IconComponent = getAreaIcon(area.icon);
                          return (
                            <Card key={area.id} className="border-2">
                              <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getAreaColor(area.color)}`}>
                                    <IconComponent className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold">{area.name}</h3>
                                    <p className="text-sm text-slate-600">{area.description}</p>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-medium mb-2">Goals ({area.goals.length})</h4>
                                    <div className="space-y-2">
                                      {area.goals.map((goal, index) => (
                                        <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                                          <Circle className="w-4 h-4 text-slate-400" />
                                          <span className="text-sm">{goal.title}</span>
                                          <Badge variant="outline" className="text-xs">
                                            {goal.type}
                                          </Badge>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="font-medium mb-2">Core Values</h4>
                                    <div className="flex flex-wrap gap-1">
                                      {area.values.map((value, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs">
                                          {value}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="font-medium mb-2">Milestones</h4>
                                    <div className="space-y-1">
                                      {area.milestones.map((milestone, index) => (
                                        <div key={index} className="text-sm">
                                          <div className="font-medium">{milestone.title}</div>
                                          <div className="text-slate-600">{milestone.description}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>

                      <div className="flex justify-end gap-2 mt-6">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={() => handleApplyTemplate(template)} className="gap-2">
                          <Sparkles className="w-4 h-4" />
                          Apply Template
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-600">
                    {template.areas.length} life area{template.areas.length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-slate-600">
                    {template.areas.reduce((total, area) => total + area.goals.length, 0)} goals
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {template.areas.map((area) => {
                    const IconComponent = getAreaIcon(area.icon);
                    return (
                      <div key={area.id} className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getAreaColor(area.color)}`}>
                        <IconComponent className="w-3 h-3" />
                        <span className="text-xs font-medium">{area.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Current Goals Summary */}
      {userGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Your Current Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {userGoals.slice(0, 5).map((goal) => (
                <div key={goal.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                  {goal.status === "completed" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="text-sm">{goal.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {goal.category}
                  </Badge>
                </div>
              ))}
              {userGoals.length > 5 && (
                <div className="text-sm text-slate-500 text-center py-2">
                  ... and {userGoals.length - 5} more goals
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
