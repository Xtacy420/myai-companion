"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Heart,
  Plus,
  Calendar,
  TrendingUp,
  Smile,
  Frown,
  Meh,
  Star,
  Target,
  BookOpen,
  Gift,
  AlertTriangle,
  Sparkles,
  Edit3,
  Trash2
} from "lucide-react";
import { localDB } from "@/lib/database/database";
import type { CheckIn, Emotion } from "@/lib/database/schema";

interface CheckInsViewProps {
  userId: string;
}

const MOOD_EMOJIS = ["😢", "🙁", "😐", "🙂", "😊", "😄", "🤩", "🥳", "😍", "🤗"];
const MOOD_LABELS = ["Terrible", "Bad", "Okay", "Good", "Great", "Amazing", "Fantastic", "Incredible", "Perfect", "Blissful"];

const COMMON_EMOTIONS = [
  "Happy", "Sad", "Excited", "Anxious", "Grateful", "Frustrated",
  "Peaceful", "Stressed", "Confident", "Worried", "Energetic", "Tired",
  "Optimistic", "Overwhelmed", "Content", "Lonely", "Motivated", "Calm"
];

const COMMON_ACTIVITIES = [
  "Work", "Exercise", "Reading", "Cooking", "Socializing", "Learning",
  "Gaming", "Meditation", "Walking", "Music", "Art", "Writing",
  "Shopping", "Cleaning", "Movies", "Travel", "Family Time", "Rest"
];

export default function CheckInsView({ userId }: CheckInsViewProps) {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewCheckIn, setShowNewCheckIn] = useState(false);
  const [editingCheckIn, setEditingCheckIn] = useState<CheckIn | null>(null);

  // Form state for new/edit check-in
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    mood: 5,
    emotions: [] as string[],
    notes: "",
    activities: [] as string[],
    gratitude: [] as string[],
    goals: [] as string[],
    challenges: [] as string[],
    highlights: [] as string[]
  });

  // Temporary input states
  const [newEmotion, setNewEmotion] = useState("");
  const [newActivity, setNewActivity] = useState("");
  const [newGratitude, setNewGratitude] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [newChallenge, setNewChallenge] = useState("");
  const [newHighlight, setNewHighlight] = useState("");

  useEffect(() => {
    loadCheckIns();
  }, [userId]);

  const loadCheckIns = async () => {
    try {
      const userCheckIns = await localDB.getCheckInsByUser(userId);
      setCheckIns(userCheckIns);
    } catch (error) {
      console.error("Failed to load check-ins:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      mood: 5,
      emotions: [],
      notes: "",
      activities: [],
      gratitude: [],
      goals: [],
      challenges: [],
      highlights: []
    });
    setNewEmotion("");
    setNewActivity("");
    setNewGratitude("");
    setNewGoal("");
    setNewChallenge("");
    setNewHighlight("");
  };

  const startEdit = (checkIn: CheckIn) => {
    setEditingCheckIn(checkIn);
    setFormData({
      date: checkIn.date,
      mood: checkIn.mood,
      emotions: [...checkIn.emotions],
      notes: checkIn.notes || "",
      activities: checkIn.activities || [],
      gratitude: checkIn.gratitude || [],
      goals: checkIn.goals || [],
      challenges: checkIn.challenges || [],
      highlights: checkIn.highlights || []
    });
    setShowNewCheckIn(true);
  };

  const handleSaveCheckIn = async () => {
    try {
      const checkInData = {
        id: editingCheckIn?.id || localDB.generateId(),
        userId,
        date: formData.date,
        mood: formData.mood,
        emotions: formData.emotions,
        notes: formData.notes || undefined,
        activities: formData.activities.length > 0 ? formData.activities : undefined,
        gratitude: formData.gratitude.length > 0 ? formData.gratitude : undefined,
        goals: formData.goals.length > 0 ? formData.goals : undefined,
        challenges: formData.challenges.length > 0 ? formData.challenges : undefined,
        highlights: formData.highlights.length > 0 ? formData.highlights : undefined,
        createdAt: editingCheckIn?.createdAt || Date.now()
      };

      if (editingCheckIn) {
        await localDB.updateCheckIn(editingCheckIn.id, checkInData);
      } else {
        await localDB.createCheckIn(checkInData);
      }

      // Create emotion entries
      for (const emotionName of formData.emotions) {
        const emotionData = {
          id: localDB.generateId(),
          userId,
          name: emotionName,
          intensity: Math.round(formData.mood / 2), // Scale 1-5 based on mood
          timestamp: Date.now(),
          checkInId: checkInData.id
        };
        // Note: We'd need to add emotions table operations to localDB
      }

      await loadCheckIns();
      setShowNewCheckIn(false);
      setEditingCheckIn(null);
      resetForm();
    } catch (error) {
      console.error("Failed to save check-in:", error);
    }
  };

  const handleDeleteCheckIn = async (checkInId: string) => {
    if (!confirm("Are you sure you want to delete this check-in?")) return;

    try {
      await localDB.deleteCheckIn(checkInId);
      await loadCheckIns();
    } catch (error) {
      console.error("Failed to delete check-in:", error);
    }
  };

  const addToList = (listName: keyof typeof formData, value: string, setValue: (value: string) => void) => {
    if (!value.trim()) return;

    const currentList = formData[listName] as string[];
    if (!currentList.includes(value.trim())) {
      setFormData(prev => ({
        ...prev,
        [listName]: [...currentList, value.trim()]
      }));
    }
    setValue("");
  };

  const removeFromList = (listName: keyof typeof formData, index: number) => {
    const currentList = formData[listName] as string[];
    setFormData(prev => ({
      ...prev,
      [listName]: currentList.filter((_, i) => i !== index)
    }));
  };

  const calculateStreak = () => {
    if (checkIns.length === 0) return 0;

    let streak = 0;
    const today = new Date();

    for (let i = 0; i < checkIns.length; i++) {
      const checkInDate = new Date(checkIns[i].date);
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);

      if (checkInDate.toDateString() === expectedDate.toDateString()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const getAverageMood = (days: number = 7) => {
    const recentCheckIns = checkIns.slice(0, days);
    if (recentCheckIns.length === 0) return 0;
    return recentCheckIns.reduce((sum, checkIn) => sum + checkIn.mood, 0) / recentCheckIns.length;
  };

  const streak = calculateStreak();
  const averageMood = getAverageMood();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Heart className="w-8 h-8 mx-auto mb-2 text-pink-500 animate-pulse" />
          <p className="text-slate-600">Loading your check-ins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Daily Check-ins</h2>
          <p className="text-slate-600">Track your mood and daily experiences</p>
        </div>
        <Dialog open={showNewCheckIn} onOpenChange={setShowNewCheckIn}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => {
              setEditingCheckIn(null);
              resetForm();
            }}>
              <Plus className="w-4 h-4" />
              New Check-in
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCheckIn ? "Edit Check-in" : "New Daily Check-in"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Date and Mood */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Mood (1-10)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={formData.mood}
                      onChange={(e) => setFormData(prev => ({ ...prev, mood: parseInt(e.target.value) }))}
                      className="flex-1"
                    />
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-2xl">{MOOD_EMOJIS[formData.mood - 1]}</span>
                      <span className="text-sm font-medium">{formData.mood}/10</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{MOOD_LABELS[formData.mood - 1]}</p>
                </div>
              </div>

              {/* Emotions */}
              <div>
                <Label>Emotions</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Add an emotion..."
                    value={newEmotion}
                    onChange={(e) => setNewEmotion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addToList('emotions', newEmotion, setNewEmotion)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addToList('emotions', newEmotion, setNewEmotion)}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {COMMON_EMOTIONS.map(emotion => (
                    <Badge
                      key={emotion}
                      variant={formData.emotions.includes(emotion) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        if (formData.emotions.includes(emotion)) {
                          setFormData(prev => ({
                            ...prev,
                            emotions: prev.emotions.filter(e => e !== emotion)
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            emotions: [...prev.emotions, emotion]
                          }));
                        }
                      }}
                    >
                      {emotion}
                    </Badge>
                  ))}
                </div>
                {formData.emotions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.emotions.map((emotion, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {emotion}
                        <button onClick={() => removeFromList('emotions', index)}>×</button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Activities */}
              <div>
                <Label>Activities</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="What did you do today?"
                    value={newActivity}
                    onChange={(e) => setNewActivity(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addToList('activities', newActivity, setNewActivity)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addToList('activities', newActivity, setNewActivity)}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {COMMON_ACTIVITIES.slice(0, 12).map(activity => (
                    <Badge
                      key={activity}
                      variant={formData.activities.includes(activity) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => {
                        if (formData.activities.includes(activity)) {
                          setFormData(prev => ({
                            ...prev,
                            activities: prev.activities.filter(a => a !== activity)
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            activities: [...prev.activities, activity]
                          }));
                        }
                      }}
                    >
                      {activity}
                    </Badge>
                  ))}
                </div>
                {formData.activities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.activities.map((activity, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {activity}
                        <button onClick={() => removeFromList('activities', index)}>×</button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="How was your day? Any thoughts or reflections..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button onClick={handleSaveCheckIn} className="flex-1">
                  {editingCheckIn ? "Update Check-in" : "Save Check-in"}
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowNewCheckIn(false);
                  setEditingCheckIn(null);
                  resetForm();
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{streak}</div>
                <div className="text-sm text-slate-600">Day Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{averageMood.toFixed(1)}</div>
                <div className="text-sm text-slate-600">7-day Average</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{checkIns.length}</div>
                <div className="text-sm text-slate-600">Total Check-ins</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Check-ins List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Check-ins</CardTitle>
        </CardHeader>
        <CardContent>
          {checkIns.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">No check-ins yet</h3>
              <p className="text-slate-500 mb-4">Start tracking your daily mood and experiences</p>
              <Button onClick={() => setShowNewCheckIn(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create your first check-in
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {checkIns.map((checkIn) => (
                  <div key={checkIn.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{MOOD_EMOJIS[checkIn.mood - 1]}</span>
                        <div>
                          <div className="font-semibold">{new Date(checkIn.date).toLocaleDateString()}</div>
                          <div className="text-sm text-slate-600">
                            Mood: {checkIn.mood}/10 - {MOOD_LABELS[checkIn.mood - 1]}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(checkIn)}
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCheckIn(checkIn.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {checkIn.emotions && checkIn.emotions.length > 0 && (
                      <div className="mb-2">
                        <div className="text-xs text-slate-500 mb-1">Emotions</div>
                        <div className="flex flex-wrap gap-1">
                          {checkIn.emotions.map((emotion, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {emotion}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {checkIn.activities && checkIn.activities.length > 0 && (
                      <div className="mb-2">
                        <div className="text-xs text-slate-500 mb-1">Activities</div>
                        <div className="flex flex-wrap gap-1">
                          {checkIn.activities.map((activity, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {activity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {checkIn.notes && (
                      <div className="mt-2">
                        <div className="text-xs text-slate-500 mb-1">Notes</div>
                        <p className="text-sm text-slate-700">{checkIn.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
