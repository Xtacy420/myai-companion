"use client";

import { useState, useEffect } from "react";
import { localDB } from "@/lib/database/database";
import type { Memory } from "@/lib/database/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Brain, Calendar, MapPin, Users, Lightbulb, Edit, Trash2, Save, X } from "lucide-react";

interface MemoriesViewProps {
  userId: string;
}

export default function MemoriesView({ userId }: MemoriesViewProps) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Edit form state
  const [editContent, setEditContent] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editImportance, setEditImportance] = useState(5);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editType, setEditType] = useState("conversation");

  // Load memories on mount
  useEffect(() => {
    if (userId) {
      loadMemories();
    }
  }, [userId]);

  const loadMemories = async () => {
    try {
      setIsLoading(true);
      const userMemories = await localDB.getMemoriesByUser(userId);
      setMemories(userMemories);
    } catch (error) {
      console.error("Failed to load memories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMemory = (memory: Memory) => {
    setEditingMemory(memory);
    setEditContent(memory.content);
    setEditSummary(memory.summary || "");
    setEditImportance(memory.importance);
    setEditTags([...memory.tags]);
    setEditType(memory.type);
    setIsEditDialogOpen(true);
  };

  const handleSaveMemory = async () => {
    if (!editingMemory) return;

    try {
      await localDB.updateMemory(editingMemory.id, {
        content: editContent.trim(),
        summary: editSummary.trim() || undefined,
        importance: editImportance,
        tags: editTags.filter(tag => tag.trim()),
        type: editType,
        updatedAt: Date.now(),
      });

      setIsEditDialogOpen(false);
      setEditingMemory(null);
      await loadMemories(); // Refresh the list
    } catch (error) {
      console.error("Failed to update memory:", error);
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    if (confirm("Are you sure you want to delete this memory? This action cannot be undone.")) {
      try {
        await localDB.deleteMemory(memoryId);
        await loadMemories(); // Refresh the list
      } catch (error) {
        console.error("Failed to delete memory:", error);
      }
    }
  };

  const addTag = () => {
    setEditTags([...editTags, ""]);
  };

  const updateTag = (index: number, value: string) => {
    const newTags = [...editTags];
    newTags[index] = value;
    setEditTags(newTags);
  };

  const removeTag = (index: number) => {
    setEditTags(editTags.filter((_, i) => i !== index));
  };

  // Filter memories based on search and type
  const filteredMemories = memories.filter(memory => {
    const matchesSearch = searchTerm.length === 0 ||
      memory.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memory.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memory.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = !selectedType || memory.type === selectedType;

    return matchesSearch && matchesType;
  });

  const memoryTypes = [
    { id: "conversation", label: "Conversations", icon: Brain, color: "bg-blue-100 text-blue-800" },
    { id: "event", label: "Events", icon: Calendar, color: "bg-green-100 text-green-800" },
    { id: "goal", label: "Goals", icon: Lightbulb, color: "bg-yellow-100 text-yellow-800" },
    { id: "preference", label: "Preferences", icon: Users, color: "bg-purple-100 text-purple-800" },
    { id: "fact", label: "Facts", icon: Brain, color: "bg-indigo-100 text-indigo-800" },
  ];

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getImportanceColor = (importance: number) => {
    if (importance >= 8) return "bg-red-100 text-red-800 border-red-200";
    if (importance >= 6) return "bg-orange-100 text-orange-800 border-orange-200";
    if (importance >= 4) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white/50 backdrop-blur-sm border-b border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Memory Bank</h2>
            <p className="text-slate-600">
              {filteredMemories.length} memories stored
            </p>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Brain className="w-4 h-4 mr-1" />
            Active Learning
          </Badge>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search memories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter by type */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedType === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType(null)}
          >
            All Types
          </Button>
          {memoryTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Button
                key={type.id}
                variant={selectedType === type.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(selectedType === type.id ? null : type.id)}
                className="gap-1"
              >
                <Icon className="w-3 h-3" />
                {type.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Memories List */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-4 max-w-4xl mx-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-pulse">Loading memories...</div>
            </div>
          ) : filteredMemories.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">
                {searchTerm ? "No memories found" : "No memories yet"}
              </h3>
              <p className="text-slate-500">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Start chatting with MyAi to create your first memories"
                }
              </p>
            </div>
          ) : (
            filteredMemories.map((memory) => {
              const memoryType = memoryTypes.find(t => t.id === memory.type);
              const Icon = memoryType?.icon || Brain;

              return (
                <Card key={memory.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5 text-slate-600" />
                        <Badge
                          variant="secondary"
                          className={memoryType?.color || "bg-gray-100 text-gray-800"}
                        >
                          {memoryType?.label || memory.type}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`${getImportanceColor(memory.importance)} border`}
                        >
                          Importance: {memory.importance}/10
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-slate-500">
                          {formatDate(memory.createdAt)}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditMemory(memory)}
                          className="h-6 w-6 p-0 text-slate-500 hover:text-slate-700"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMemory(memory.id)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    {memory.summary && (
                      <CardTitle className="text-lg text-slate-800">
                        {memory.summary}
                      </CardTitle>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 mb-3 leading-relaxed">
                      {memory.content}
                    </p>

                    {/* Tags */}
                    {memory.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {memory.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Edit Memory Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Memory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-base font-medium">Type</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {memoryTypes.map((type) => (
                  <Button
                    key={type.id}
                    variant={editType === type.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditType(type.id)}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Content</Label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="mt-1"
                rows={4}
                placeholder="Describe this memory..."
              />
            </div>

            <div>
              <Label className="text-base font-medium">Summary (Optional)</Label>
              <Input
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
                className="mt-1"
                placeholder="Brief summary of this memory..."
              />
            </div>

            <div>
              <Label className="text-base font-medium">Importance (1-10)</Label>
              <div className="mt-2 flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={editImportance}
                  onChange={(e) => setEditImportance(Number(e.target.value))}
                  className="flex-1"
                />
                <Badge variant="outline" className={getImportanceColor(editImportance)}>
                  {editImportance}/10
                </Badge>
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Tags</Label>
              {editTags.map((tag, index) => (
                <div key={`edit-tag-${index}`} className="mt-2 flex gap-2">
                  <Input
                    value={tag}
                    onChange={(e) => updateTag(index, e.target.value)}
                    placeholder="Add a tag..."
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeTag(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={addTag}
                className="mt-2"
              >
                + Add tag
              </Button>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveMemory} disabled={!editContent.trim()}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
