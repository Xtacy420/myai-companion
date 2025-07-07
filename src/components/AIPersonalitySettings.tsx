"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocalUser } from "@/hooks/useLocalUser";
import { localDB } from "@/lib/database/database";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Settings,
  Brain,
  Heart,
  Lightbulb,
  MessageSquare,
  Palette,
  Save,
  RotateCcw
} from "lucide-react";

interface AIPersonalitySettingsProps {
  userId: string;
}

export default function AIPersonalitySettings({ userId }: AIPersonalitySettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, updateUser } = useLocalUser();

  // Form state
  const [tone, setTone] = useState("empathetic");
  const [style, setStyle] = useState("conversational");
  const [traits, setTraits] = useState<string[]>([]);
  const [responseLength, setResponseLength] = useState("moderate");
  const [emotionalDepth, setEmotionalDepth] = useState(7);
  const [memoryFocus, setMemoryFocus] = useState("patterns");
  const [isLoading, setIsLoading] = useState(false);

  // Load current personality settings
  useEffect(() => {
    if (user?.aiPersonality) {
      const personality = user.aiPersonality;
      setTone(personality.tone || "empathetic");
      setStyle(personality.style || "conversational");
      setTraits(personality.traits || []);
      setResponseLength(personality.responseLength || "moderate");
      setEmotionalDepth(personality.emotionalDepth || 7);
      setMemoryFocus(personality.memoryFocus || "patterns");
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const personalitySettings = {
        tone,
        style,
        traits,
        responseLength,
        emotionalDepth,
        memoryFocus,
      };

      await updateUser({
        aiPersonality: personalitySettings,
      });

      setIsOpen(false);
    } catch (error) {
      console.error("Failed to update AI personality:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setTone("empathetic");
    setStyle("conversational");
    setTraits([]);
    setResponseLength("moderate");
    setEmotionalDepth(7);
    setMemoryFocus("patterns");
  };

  const addTrait = () => {
    setTraits([...traits, ""]);
  };

  const updateTrait = (index: number, value: string) => {
    const newTraits = [...traits];
    newTraits[index] = value;
    setTraits(newTraits);
  };

  const removeTrait = (index: number) => {
    setTraits(traits.filter((_, i) => i !== index));
  };

  const toneOptions = [
    { value: "empathetic", label: "Empathetic", description: "Warm and understanding" },
    { value: "analytical", label: "Analytical", description: "Logical and structured" },
    { value: "encouraging", label: "Encouraging", description: "Supportive and motivating" },
    { value: "casual", label: "Casual", description: "Relaxed and friendly" },
    { value: "professional", label: "Professional", description: "Formal and businesslike" },
    { value: "wise", label: "Wise", description: "Thoughtful and insightful" },
  ];

  const styleOptions = [
    { value: "conversational", label: "Conversational", description: "Natural dialogue flow" },
    { value: "structured", label: "Structured", description: "Organized responses" },
    { value: "creative", label: "Creative", description: "Imaginative and expressive" },
    { value: "direct", label: "Direct", description: "Straightforward and concise" },
    { value: "storytelling", label: "Storytelling", description: "Narrative approach" },
  ];

  const lengthOptions = [
    { value: "brief", label: "Brief", description: "Short and to the point" },
    { value: "moderate", label: "Moderate", description: "Balanced responses" },
    { value: "detailed", label: "Detailed", description: "Comprehensive explanations" },
  ];

  const memoryFocusOptions = [
    { value: "detailed", label: "Detailed Facts", description: "Remember specific details" },
    { value: "highlights", label: "Key Highlights", description: "Focus on important moments" },
    { value: "patterns", label: "Patterns & Trends", description: "Identify connections" },
    { value: "emotions", label: "Emotional Context", description: "Remember feelings" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Brain className="w-4 h-4" />
          AI Personality
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Customize AI Personality
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Tone Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Tone & Emotional Style
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  {toneOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-slate-500">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Communication Style */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Communication Style
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  {styleOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-slate-500">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Response Length */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Response Length
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={responseLength} onValueChange={setResponseLength}>
                <SelectTrigger>
                  <SelectValue placeholder="Select length" />
                </SelectTrigger>
                <SelectContent>
                  {lengthOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-slate-500">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Emotional Depth */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Emotional Depth (1-10)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={emotionalDepth}
                  onChange={(e) => setEmotionalDepth(Number(e.target.value))}
                  className="flex-1"
                />
                <div className="w-8 text-center font-medium">{emotionalDepth}</div>
              </div>
              <div className="text-xs text-slate-500 mt-2">
                {emotionalDepth <= 3 ? "Logical and analytical" :
                 emotionalDepth <= 7 ? "Balanced logic and emotion" :
                 "Highly empathetic and emotional"}
              </div>
            </CardContent>
          </Card>

          {/* Memory Focus */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Memory Focus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={memoryFocus} onValueChange={setMemoryFocus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select memory focus" />
                </SelectTrigger>
                <SelectContent>
                  {memoryFocusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-slate-500">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Personality Traits */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Personality Traits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {traits.map((trait, index) => (
                <div key={`trait-${index}`} className="flex gap-2">
                  <Input
                    placeholder="e.g., curious, patient, creative"
                    value={trait}
                    onChange={(e) => updateTrait(index, e.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeTrait(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={addTrait}
                className="w-full"
              >
                + Add trait
              </Button>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset to Default
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading} className="gap-2">
                <Save className="w-4 h-4" />
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
