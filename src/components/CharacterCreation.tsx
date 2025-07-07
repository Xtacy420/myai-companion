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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus,
  Users,
  Bot,
  Star,
  MessageCircle,
  Sparkles,
  Edit3,
  Trash2,
  Play,
  PlusCircle
} from "lucide-react";
import { localDB } from "@/lib/database/database";
import { useLocalUser } from "@/hooks/useLocalUser";
import type { Character } from "@/lib/database/schema";

interface CharacterCreationProps {
  onCharacterSelect?: (characterId: string | null) => void;
  selectedCharacterId?: string | null;
}

const PERSONALITY_TONES = [
  { value: "friendly", label: "Friendly", description: "Warm and approachable" },
  { value: "professional", label: "Professional", description: "Formal and business-like" },
  { value: "casual", label: "Casual", description: "Relaxed and informal" },
  { value: "enthusiastic", label: "Enthusiastic", description: "Energetic and excited" },
  { value: "analytical", label: "Analytical", description: "Logical and detail-oriented" },
  { value: "empathetic", label: "Empathetic", description: "Understanding and supportive" },
  { value: "witty", label: "Witty", description: "Clever and humorous" },
  { value: "wise", label: "Wise", description: "Thoughtful and experienced" }
];

const RESPONSE_STYLES = [
  { value: "conversational", label: "Conversational", description: "Natural dialogue" },
  { value: "detailed", label: "Detailed", description: "Comprehensive responses" },
  { value: "concise", label: "Concise", description: "Brief and to the point" },
  { value: "creative", label: "Creative", description: "Imaginative and original" },
  { value: "supportive", label: "Supportive", description: "Encouraging and helpful" },
  { value: "inquisitive", label: "Inquisitive", description: "Asks thoughtful questions" }
];

const COMMON_TRAITS = [
  "Intelligent", "Curious", "Patient", "Creative", "Logical", "Intuitive",
  "Optimistic", "Realistic", "Adventurous", "Cautious", "Independent", "Collaborative",
  "Analytical", "Emotional", "Practical", "Idealistic", "Confident", "Humble"
];

const EXPERTISE_AREAS = [
  "Psychology", "Philosophy", "Science", "Technology", "Art", "Literature",
  "History", "Business", "Health", "Fitness", "Cooking", "Music",
  "Education", "Relationships", "Career", "Finance", "Travel", "Gaming"
];

const CHARACTER_AVATARS = ["🤖", "👨‍💼", "👩‍🔬", "👨‍🎨", "👩‍💻", "👨‍🏫", "👩‍⚕️", "🧙‍♂️", "🧙‍♀️", "👨‍🍳", "👩‍🎤", "🦸‍♂️", "🦸‍♀️", "👨‍🚀", "👩‍🚀"];

export default function CharacterCreation({ onCharacterSelect, selectedCharacterId }: CharacterCreationProps) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewCharacter, setShowNewCharacter] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const { userId } = useLocalUser();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    personality: {
      traits: [] as string[],
      tone: "friendly",
      expertise: [] as string[],
      responseStyle: "conversational"
    },
    avatar: "🤖",
    backstory: ""
  });

  // Temporary input states
  const [newTrait, setNewTrait] = useState("");
  const [newExpertise, setNewExpertise] = useState("");

  useEffect(() => {
    if (userId) {
      loadCharacters();
    }
  }, [userId]);

  const loadCharacters = async () => {
    if (!userId) return;

    try {
      const userCharacters = await localDB.getCharactersByUser(userId);
      setCharacters(userCharacters);
    } catch (error) {
      console.error("Failed to load characters:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      personality: {
        traits: [],
        tone: "friendly",
        expertise: [],
        responseStyle: "conversational"
      },
      avatar: "🤖",
      backstory: ""
    });
    setNewTrait("");
    setNewExpertise("");
  };

  const startEdit = (character: Character) => {
    setEditingCharacter(character);
    setFormData({
      name: character.name,
      description: character.description,
      personality: { ...character.personality },
      avatar: character.avatar || "🤖",
      backstory: character.backstory || ""
    });
    setShowNewCharacter(true);
  };

  const handleSaveCharacter = async () => {
    if (!userId || !formData.name.trim()) return;

    try {
      const characterData = {
        id: editingCharacter?.id || localDB.generateId(),
        userId,
        name: formData.name.trim(),
        description: formData.description.trim(),
        personality: formData.personality,
        avatar: formData.avatar,
        backstory: formData.backstory.trim() || undefined,
        conversationCount: editingCharacter?.conversationCount || 0,
        isActive: true,
        createdAt: editingCharacter?.createdAt || Date.now(),
        updatedAt: Date.now()
      };

      if (editingCharacter) {
        await localDB.updateCharacter(editingCharacter.id, characterData);
      } else {
        await localDB.createCharacter(characterData);
      }

      await loadCharacters();
      setShowNewCharacter(false);
      setEditingCharacter(null);
      resetForm();
    } catch (error) {
      console.error("Failed to save character:", error);
    }
  };

  const handleDeleteCharacter = async (characterId: string) => {
    if (!confirm("Are you sure you want to delete this character? This will also delete all conversations with this character.")) return;

    try {
      await localDB.deleteCharacter(characterId);
      await loadCharacters();

      // If the deleted character was selected, deselect it
      if (selectedCharacterId === characterId) {
        onCharacterSelect?.(null);
      }
    } catch (error) {
      console.error("Failed to delete character:", error);
    }
  };

  const addToList = (listName: "traits" | "expertise", value: string, setValue: (value: string) => void) => {
    if (!value.trim()) return;

    const currentList = formData.personality[listName];
    if (!currentList.includes(value.trim())) {
      setFormData(prev => ({
        ...prev,
        personality: {
          ...prev.personality,
          [listName]: [...currentList, value.trim()]
        }
      }));
    }
    setValue("");
  };

  const removeFromList = (listName: "traits" | "expertise", index: number) => {
    const currentList = formData.personality[listName];
    setFormData(prev => ({
      ...prev,
      personality: {
        ...prev.personality,
        [listName]: currentList.filter((_, i) => i !== index)
      }
    }));
  };

  const togglePresetItem = (listName: "traits" | "expertise", item: string) => {
    const currentList = formData.personality[listName];
    if (currentList.includes(item)) {
      setFormData(prev => ({
        ...prev,
        personality: {
          ...prev.personality,
          [listName]: currentList.filter(i => i !== item)
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        personality: {
          ...prev.personality,
          [listName]: [...currentList, item]
        }
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="text-center">
          <Bot className="w-6 h-6 mx-auto mb-2 text-slate-400 animate-pulse" />
          <p className="text-xs text-slate-500">Loading characters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Create New Character Button */}
      <Dialog open={showNewCharacter} onOpenChange={setShowNewCharacter}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full gap-2" onClick={() => {
            setEditingCharacter(null);
            resetForm();
          }}>
            <Plus className="w-3 h-3" />
            Create Character
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCharacter ? "Edit Character" : "Create New Character"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="name">Character Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Dr. Sarah, Coach Mike, Zen Master..."
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief description of the character..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div>
                <Label>Avatar</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {CHARACTER_AVATARS.map(avatar => (
                    <Button
                      key={avatar}
                      variant={formData.avatar === avatar ? "default" : "outline"}
                      className="w-10 h-10 p-0 text-lg"
                      onClick={() => setFormData(prev => ({ ...prev, avatar }))}
                    >
                      {avatar}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Personality */}
            <div className="space-y-4">
              <h3 className="font-semibold">Personality</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tone</Label>
                  <Select
                    value={formData.personality.tone}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      personality: { ...prev.personality, tone: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERSONALITY_TONES.map(tone => (
                        <SelectItem key={tone.value} value={tone.value}>
                          <div>
                            <div className="font-medium">{tone.label}</div>
                            <div className="text-xs text-slate-500">{tone.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Response Style</Label>
                  <Select
                    value={formData.personality.responseStyle}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      personality: { ...prev.personality, responseStyle: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESPONSE_STYLES.map(style => (
                        <SelectItem key={style.value} value={style.value}>
                          <div>
                            <div className="font-medium">{style.label}</div>
                            <div className="text-xs text-slate-500">{style.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Traits */}
              <div>
                <Label>Personality Traits</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Add a trait..."
                    value={newTrait}
                    onChange={(e) => setNewTrait(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addToList('traits', newTrait, setNewTrait)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addToList('traits', newTrait, setNewTrait)}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {COMMON_TRAITS.map(trait => (
                    <Badge
                      key={trait}
                      variant={formData.personality.traits.includes(trait) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => togglePresetItem('traits', trait)}
                    >
                      {trait}
                    </Badge>
                  ))}
                </div>
                {formData.personality.traits.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.personality.traits.map((trait, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {trait}
                        <button onClick={() => removeFromList('traits', index)}>×</button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Expertise */}
              <div>
                <Label>Areas of Expertise</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Add expertise area..."
                    value={newExpertise}
                    onChange={(e) => setNewExpertise(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addToList('expertise', newExpertise, setNewExpertise)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addToList('expertise', newExpertise, setNewExpertise)}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {EXPERTISE_AREAS.map(area => (
                    <Badge
                      key={area}
                      variant={formData.personality.expertise.includes(area) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => togglePresetItem('expertise', area)}
                    >
                      {area}
                    </Badge>
                  ))}
                </div>
                {formData.personality.expertise.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.personality.expertise.map((expertise, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {expertise}
                        <button onClick={() => removeFromList('expertise', index)}>×</button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Backstory */}
            <div>
              <Label htmlFor="backstory">Backstory (Optional)</Label>
              <Textarea
                id="backstory"
                placeholder="Give your character a background story, context, or specific role..."
                value={formData.backstory}
                onChange={(e) => setFormData(prev => ({ ...prev, backstory: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={handleSaveCharacter} className="flex-1" disabled={!formData.name.trim()}>
                {editingCharacter ? "Update Character" : "Create Character"}
              </Button>
              <Button variant="outline" onClick={() => {
                setShowNewCharacter(false);
                setEditingCharacter(null);
                resetForm();
              }}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Characters List */}
      <div className="space-y-2">
        {characters.length === 0 ? (
          <div className="text-center py-6">
            <Bot className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs text-slate-500 mb-2">No characters yet</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNewCharacter(true)}
              className="gap-1 text-xs"
            >
              <PlusCircle className="w-3 h-3" />
              Create your first character
            </Button>
          </div>
        ) : (
          <ScrollArea className="max-h-64">
            <div className="space-y-2">
              {characters.map((character) => (
                <Card
                  key={character.id}
                  className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                    selectedCharacterId === character.id ? "ring-2 ring-blue-500 bg-blue-50" : ""
                  }`}
                  onClick={() => onCharacterSelect?.(character.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-lg">{character.avatar}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{character.name}</div>
                          <div className="text-xs text-slate-500 truncate">{character.description}</div>
                          <div className="flex items-center gap-1 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {character.personality.tone}
                            </Badge>
                            {character.conversationCount > 0 && (
                              <Badge variant="secondary" className="text-xs gap-1">
                                <MessageCircle className="w-2 h-2" />
                                {character.conversationCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(character);
                          }}
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCharacter(character.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {selectedCharacterId && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCharacterSelect?.(null)}
          className="w-full gap-2 text-slate-500"
        >
          <Bot className="w-3 h-3" />
          Switch to MyAi Assistant
        </Button>
      )}
    </div>
  );
}
