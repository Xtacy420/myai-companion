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
import { useLocalUser } from "@/hooks/useLocalUser";
import { localDB } from "@/lib/database/database";
import type { FamilyMember } from "@/lib/database/schema";
import {
  Users,
  Plus,
  Gift,
  Heart,
  Edit,
  Trash2,
  UserPlus,
  PartyPopper
} from "lucide-react";

interface FamilyViewProps {
  userId: string;
}

export default function FamilyView({ userId }: FamilyViewProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [birthday, setBirthday] = useState("");
  const [characteristics, setCharacteristics] = useState<string[]>([""]);
  const [notes, setNotes] = useState("");
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<FamilyMember[]>([]);

  useEffect(() => {
    if (userId) {
      loadFamilyData();
    }
  }, [userId]);

  const loadFamilyData = async () => {
    if (!userId) return;

    const members = await localDB.getFamilyMembersByUser(userId);
    setFamilyMembers(members);

    // Calculate upcoming birthdays locally
    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);

    const upcoming = members
      .filter(member => {
        if (!member.birthday) return false;
        const birthday = new Date(member.birthday);
        const birthdayThisYear = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
        return birthdayThisYear >= today && birthdayThisYear <= next30Days;
      })
      .sort((a, b) => new Date(a.birthday!).getTime() - new Date(b.birthday!).getTime());

    setUpcomingBirthdays(upcoming);
  };

  const relationshipTypes = [
    "Parent", "Child", "Sibling", "Spouse", "Partner", "Grandparent", "Grandchild",
    "Aunt", "Uncle", "Cousin", "Friend", "Colleague", "Mentor", "Other"
  ];

  const resetForm = () => {
    setName("");
    setRelationship("");
    setBirthday("");
    setCharacteristics([""]);
    setNotes("");
    setEditingMember(null);
  };

  const handleOpenDialog = (member?: FamilyMember) => {
    if (member) {
      setEditingMember(member);
      setName(member.name);
      setRelationship(member.relationship);
      setBirthday(member.birthday || "");
      setCharacteristics(member.characteristics?.length ? member.characteristics : [""]);
      setNotes(member.notes || "");
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!userId) return;
    try {
      const memberData = {
        name: name.trim(),
        relationship: relationship.trim(),
        birthday: birthday || undefined,
        characteristics: characteristics.filter(c => c.trim()),
        notes: notes.trim() || undefined,
        updatedAt: Date.now(),
      };

      if (editingMember) {
        await localDB.updateFamilyMember(editingMember.id, memberData);
      } else {
        const newMember: FamilyMember = {
          id: localDB.generateId(),
          userId,
          name: name.trim(),
          relationship: relationship.trim(),
          birthday: birthday || undefined,
          characteristics: characteristics.filter(c => c.trim()),
          notes: notes.trim() || undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await localDB.createFamilyMember(newMember);
      }

      await loadFamilyData();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to save family member:", error);
    }
  };

  const handleDelete = async (memberId: string) => {
    if (confirm("Are you sure you want to remove this family member?")) {
      try {
        await localDB.deleteFamilyMember(memberId);
        await loadFamilyData();
      } catch (error) {
        console.error("Failed to delete family member:", error);
      }
    }
  };

  const addCharacteristic = () => {
    setCharacteristics([...characteristics, ""]);
  };

  const updateCharacteristic = (index: number, value: string) => {
    const updated = [...characteristics];
    updated[index] = value;
    setCharacteristics(updated);
  };

  const removeCharacteristic = (index: number) => {
    if (characteristics.length > 1) {
      setCharacteristics(characteristics.filter((_, i) => i !== index));
    }
  };

  const formatBirthday = (birthday: string) => {
    return new Date(birthday).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    });
  };

  const getRelationshipColor = (relationship: string) => {
    const colors: { [key: string]: string } = {
      "Parent": "bg-blue-100 text-blue-800",
      "Child": "bg-green-100 text-green-800",
      "Sibling": "bg-purple-100 text-purple-800",
      "Spouse": "bg-red-100 text-red-800",
      "Partner": "bg-pink-100 text-pink-800",
      "Grandparent": "bg-indigo-100 text-indigo-800",
      "Grandchild": "bg-yellow-100 text-yellow-800",
      "Friend": "bg-orange-100 text-orange-800",
    };
    return colors[relationship] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Family & Friends</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Keep track of the important people in your life
            </p>
          </div>
          <div className="flex items-center gap-4">
            {familyMembers && (
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {familyMembers.length}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  People
                </div>
              </div>
            )}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4" />
                  Add Person
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingMember ? "Edit Person" : "Add New Person"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label className="text-base font-medium">Name</Label>
                    <Input
                      placeholder="Enter name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-base font-medium">Relationship</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {relationshipTypes.map((type) => (
                        <Button
                          key={type}
                          variant={relationship === type ? "default" : "outline"}
                          size="sm"
                          onClick={() => setRelationship(type)}
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Birthday (Optional)</Label>
                    <Input
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-base font-medium">Characteristics</Label>
                    {characteristics.map((characteristic, index) => (
                      <div key={`characteristic-${index}`} className="mt-2 flex gap-2">
                        <Input
                          placeholder="e.g., loves cooking, plays guitar"
                          value={characteristic}
                          onChange={(e) => updateCharacteristic(index, e.target.value)}
                        />
                        {characteristics.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeCharacteristic(index)}
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={addCharacteristic}
                      className="mt-2"
                    >
                      + Add characteristic
                    </Button>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Notes</Label>
                    <Textarea
                      placeholder="Any additional information or memories..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!name.trim() || !relationship.trim()}>
                      {editingMember ? "Update" : "Add"} Person
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Upcoming Birthdays */}
        {upcomingBirthdays && upcomingBirthdays.length > 0 && (
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border border-pink-200 dark:border-pink-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <PartyPopper className="w-5 h-5 text-pink-600" />
              <span className="font-medium text-pink-800 dark:text-pink-200">
                Upcoming Birthdays
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {upcomingBirthdays.slice(0, 3).map((member: FamilyMember) => {
                const daysUntil = Math.ceil((new Date(member.birthday!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <Badge key={member.id} variant="secondary" className="bg-pink-100 text-pink-800">
                    {member.name} - {daysUntil === 0 ? "Today!" : `${daysUntil} days`}
                  </Badge>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Family Members List */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-4 max-w-4xl mx-auto">
          {!familyMembers ? (
            <div className="text-center py-8">
              <div className="animate-pulse">Loading family members...</div>
            </div>
          ) : familyMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">
                No family members added yet
              </h3>
              <p className="text-slate-500 dark:text-slate-500 mb-4">
                Start building your personal network by adding family and friends
              </p>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <UserPlus className="w-4 h-4" />
                Add First Person
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {familyMembers.map((member) => (
                <Card key={member.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg text-slate-800 dark:text-slate-200">
                          {member.name}
                        </CardTitle>
                        <Badge
                          variant="secondary"
                          className={`mt-1 ${getRelationshipColor(member.relationship)}`}
                        >
                          {member.relationship}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(member)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(member.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Birthday */}
                    {member.birthday && (
                      <div className="flex items-center gap-2 text-sm">
                        <Gift className="w-4 h-4 text-pink-600" />
                        <span className="text-slate-600 dark:text-slate-400">
                          Birthday: {formatBirthday(member.birthday)}
                        </span>
                      </div>
                    )}

                    {/* Characteristics */}
                    {member.characteristics && member.characteristics.length > 0 && (
                      <div>
                        <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2 text-sm flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          Characteristics
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {member.characteristics.map((char: string, index: number) => (
                            <Badge key={`char-${member.id}-${index}`} variant="outline" className="text-xs">
                              {char}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {member.notes && (
                      <div>
                        <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-1 text-sm">
                          Notes
                        </h4>
                        <p className="text-slate-600 dark:text-slate-400 text-sm italic">
                          "{member.notes}"
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
