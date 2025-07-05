"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
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
  userId: Id<"users">;
}

export default function AIPersonalitySettings({ userId }: AIPersonalitySettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const user = useQuery(api.users.getUser, { userId });
  const updateAIPersonality = useMutation(api.users.updateAIPersonality);

  // Form state
  const [tone, setTone] = useState("empathetic");
  const [style, setStyle] = useState("conversational");
  const [traits, setTraits] = useState<string[]>([]);
  const [responseLength, setResponseLength] = useState("moderate");
  const [emotionalDepth, setEmotionalDepth] = useState(7);
  const [memoryFocus, setMemoryFocus] = useState("patterns");
  const [hasChanges, setHasChanges] = useState(false);

  // Load current settings when user data is available
  useEffect(() => {
    if (user?.aiPersonality) {
      const personality = user.aiPersonality;
      setTone(personality.tone || "empathetic");
      setStyle(personality.style || "conversational");
      setTraits(personality.traits || []);
      setResponseLength(personality.responseLength || "moderate");
      setEmotionalDepth(personality.emotionalDepth || 7);
      setMemoryFocus(personality.memoryFocus || "patterns");
      setHasChanges(false);
    }
  }, [user]);

  const toneOptions = [
    { value: "empathetic", label: "Empathetic", desc: "Warm, understanding, and supportive" },
    { value: "analytical", label: "Analytical", desc: "Logical, objective, and precise" },
    { value: "friendly", label: "Friendly", desc: "Casual, approachable, and encouraging" },
    { value: "professional", label: "Professional", desc: "Formal, structured, and reliable" },
    { value: "playful", label: "Playful", desc: "Light-hearted, creative, and fun" },
    { value: "wise", label: "Wise", desc: "Thoughtful, philosophical, and insightful" },
  ];

  const styleOptions = [
    { value: "conversational", label: "Conversational", desc: "Natural, flowing dialogue" },
    { value: "concise", label: "Concise", desc: "Brief, to-the-point responses" },
    { value: "detailed", label: "Detailed", desc: "Comprehensive, thorough explanations" },
    { value: "storytelling", label: "Storytelling", desc: "Narrative, engaging approach" },
    { value: "coaching", label: "Coaching", desc: "Guiding questions and actionable advice" },
    { value: "reflective", label: "Reflective", desc: "Deep, contemplative responses" },
  ];

  const traitOptions = [
    "supportive", "analytical", "creative", "patient", "motivational", "curious",
    "practical", "optimistic", "thoughtful", "humorous", "insightful", "gentle",
    "direct", "encouraging", "wise", "understanding", "inspiring", "reliable"
  ];

  const responseLengthOptions = [
    { value: "brief", label: "Brief", desc: "Short, concise responses" },
    { value: "moderate", label: "Moderate", desc: "Balanced length responses" },
    { value: "detailed", label: "Detailed", desc: "Comprehensive, in-depth responses" },
  ];

  const memoryFocusOptions = [
    { value: "detailed", label: "Detailed", desc: "Remember specific details and facts" },
    { value: "highlights", label: "Highlights", desc: "Focus on key moments and achievements" },
    { value: "patterns", label: "Patterns", desc: "Identify trends and connections" },
    { value: "emotions", label: "Emotions", desc: "Prioritize emotional context and feelings" },
  ];

  const toggleTrait = (trait: string) => {
    const newTraits = traits.includes(trait)
      ? traits.filter(t => t !== trait)
      : [...traits, trait];
    setTraits(newTraits);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateAIPersonality({
        userId,
        tone,
        style,
        traits,
        responseLength,
        emotionalDepth,
        memoryFocus,
      });
      setHasChanges(false);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to update AI personality:", error);
    }
  };

  const handleReset = () => {
    setTone("empathetic");
    setStyle("conversational");
    setTraits(["supportive", "empathetic", "insightful"]);
    setResponseLength("moderate");
    setEmotionalDepth(7);
    setMemoryFocus("patterns");
    setHasChanges(true);
  };

  const getPersonalityPreview = () => {
    const selectedTone = toneOptions.find(t => t.value === tone);
    const selectedStyle = styleOptions.find(s => s.value === style);
    return `Your AI will be ${selectedTone?.label.toLowerCase()} and ${selectedStyle?.label.toLowerCase()}, with ${traits.length} personality traits.`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Brain className="w-4 h-4" />
          AI Personality
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Customize Your AI Personality
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Preview */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800">Personality Preview</span>
              </div>
              <p className="text-blue-700 text-sm">{getPersonalityPreview()}</p>
            </CardContent>
          </Card>

          {/* Tone Settings */}
          <div>
            <Label className="text-base font-medium flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4" />
              Tone & Approach
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {toneOptions.map((option) => (
                <Card
                  key={option.value}
                  className={`cursor-pointer transition-all ${
                    tone === option.value
                      ? "ring-2 ring-blue-500 bg-blue-50"
                      : "hover:bg-slate-50"
                  }`}
                  onClick={() => {
                    setTone(option.value);
                    setHasChanges(true);
                  }}
                >
                  <CardContent className="p-3">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-slate-600 mt-1">{option.desc}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Style Settings */}
          <div>
            <Label className="text-base font-medium flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4" />
              Communication Style
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {styleOptions.map((option) => (
                <Card
                  key={option.value}
                  className={`cursor-pointer transition-all ${
                    style === option.value
                      ? "ring-2 ring-purple-500 bg-purple-50"
                      : "hover:bg-slate-50"
                  }`}
                  onClick={() => {
                    setStyle(option.value);
                    setHasChanges(true);
                  }}
                >
                  <CardContent className="p-3">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-slate-600 mt-1">{option.desc}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Personality Traits */}
          <div>
            <Label className="text-base font-medium flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4" />
              Personality Traits ({traits.length} selected)
            </Label>
            <div className="flex flex-wrap gap-2">
              {traitOptions.map((trait) => (
                <Badge
                  key={trait}
                  variant={traits.includes(trait) ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    traits.includes(trait)
                      ? "bg-green-500 hover:bg-green-600"
                      : "hover:bg-slate-100"
                  }`}
                  onClick={() => toggleTrait(trait)}
                >
                  {trait}
                </Badge>
              ))}
            </div>
          </div>

          {/* Response Length */}
          <div>
            <Label className="text-base font-medium mb-3 block">Response Length</Label>
            <div className="grid grid-cols-3 gap-3">
              {responseLengthOptions.map((option) => (
                <Card
                  key={option.value}
                  className={`cursor-pointer transition-all ${
                    responseLength === option.value
                      ? "ring-2 ring-orange-500 bg-orange-50"
                      : "hover:bg-slate-50"
                  }`}
                  onClick={() => {
                    setResponseLength(option.value);
                    setHasChanges(true);
                  }}
                >
                  <CardContent className="p-3 text-center">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-slate-600 mt-1">{option.desc}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Emotional Depth */}
          <div>
            <Label className="text-base font-medium mb-3 block">
              Emotional Depth: {emotionalDepth}/10
            </Label>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">Logical</span>
              <input
                type="range"
                min="1"
                max="10"
                value={emotionalDepth}
                onChange={(e) => {
                  setEmotionalDepth(Number(e.target.value));
                  setHasChanges(true);
                }}
                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm text-slate-600">Emotional</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {emotionalDepth <= 3 && "Focus on facts and logical analysis"}
              {emotionalDepth > 3 && emotionalDepth <= 7 && "Balance logic with emotional understanding"}
              {emotionalDepth > 7 && "Prioritize emotional connection and empathy"}
            </p>
          </div>

          {/* Memory Focus */}
          <div>
            <Label className="text-base font-medium mb-3 block">Memory Focus</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {memoryFocusOptions.map((option) => (
                <Card
                  key={option.value}
                  className={`cursor-pointer transition-all ${
                    memoryFocus === option.value
                      ? "ring-2 ring-indigo-500 bg-indigo-50"
                      : "hover:bg-slate-50"
                  }`}
                  onClick={() => {
                    setMemoryFocus(option.value);
                    setHasChanges(true);
                  }}
                >
                  <CardContent className="p-3 text-center">
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs text-slate-600 mt-1">{option.desc}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleReset}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Default
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
