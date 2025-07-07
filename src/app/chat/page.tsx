"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  MessageCircle,
  Send,
  Menu,
  Sparkles,
  Loader2,
  Mic,
  MicOff,
  Plus,
  Search,
  Users,
  FileText,
  Home,
  Activity,
  Calendar,
  User,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  Bot,
  UserIcon
} from "lucide-react";
import { useLocalUser } from "@/hooks/useLocalUser";
import { useLocalChat } from "@/hooks/useLocalChat";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { localDB } from "@/lib/database/database";
import type { Character, CharacterConversation } from "@/lib/database/schema";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import CharacterCreation from "@/components/CharacterCreation";

// Using Character type from schema

function ChatPageContent() {
  const [message, setMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentChatType, setCurrentChatType] = useState<"regular" | "character">("regular");
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [characterConversations, setCharacterConversations] = useState<CharacterConversation[]>([]);
  const [isCharacterChatLoading, setIsCharacterChatLoading] = useState(false);

  const { userId, user } = useLocalUser();
  const {
    currentConversation,
    sendMessage,
    isLoading: chatLoading,
    conversations,
    currentConversationId,
    setCurrentConversationId,
    // New chat length management
    isConversationTooLong,
    isConversationCritical,
    showChatTooLongWarning,
    createNewChatWithSummary,
    isCreatingNewChat,
    messageCount,
    maxMessages,
  } = useLocalChat(userId);

  const {
    isListening,
    isSupported: isVoiceSupported,
    interimTranscript,
    toggleListening,
  } = useVoiceInput({
    onResult: (transcript) => {
      const trimmedTranscript = transcript.trim();
      if (trimmedTranscript) {
        setMessage(trimmedTranscript);
      }
    },
    onEnd: () => {
      // Auto-send message after voice input ends if there's content
      setTimeout(() => {
        if (message.trim()) {
          handleSendMessage();
        }
      }, 500);
    },
  });

  // Load characters and character data
  useEffect(() => {
    if (userId) {
      loadCharacters();
    }
  }, [userId]);

  useEffect(() => {
    if (selectedCharacterId) {
      loadSelectedCharacter();
      loadCharacterConversations();
    } else {
      setSelectedCharacter(null);
      setCharacterConversations([]);
    }
  }, [selectedCharacterId]);

  const loadCharacters = async () => {
    if (!userId) return;
    try {
      const userCharacters = await localDB.getCharactersByUser(userId);
      setCharacters(userCharacters);
    } catch (error) {
      console.error("Failed to load characters:", error);
    }
  };

  const loadSelectedCharacter = async () => {
    if (!selectedCharacterId) return;
    try {
      const character = await localDB.getCharacterById(selectedCharacterId);
      setSelectedCharacter(character || null);
    } catch (error) {
      console.error("Failed to load selected character:", error);
    }
  };

  const loadCharacterConversations = async () => {
    if (!selectedCharacterId) return;
    try {
      const conversations = await localDB.getCharacterConversations(selectedCharacterId);
      setCharacterConversations(conversations);
    } catch (error) {
      console.error("Failed to load character conversations:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    if (currentChatType === "regular") {
      // Regular chat functionality
      if (!sendMessage) return;

      // Force create new chat if at critical length
      if (isConversationCritical) {
        await createNewChatWithSummary(true);
        return;
      }

      await sendMessage(message);
      setMessage("");
    } else if (currentChatType === "character" && selectedCharacterId && selectedCharacter) {
      // Character chat functionality
      setIsCharacterChatLoading(true);

      try {
        // Get or create character conversation
        let conversation;
        if (characterConversations && characterConversations.length > 0) {
          conversation = characterConversations[0];
        } else {
          // Create new character conversation
          const newConversation: CharacterConversation = {
            id: localDB.generateId(),
            userId: userId!, // We know userId is not null here due to the condition check
            characterId: selectedCharacterId,
            title: `Chat with ${selectedCharacter.name}`,
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          await localDB.createCharacterConversation(newConversation);
          conversation = newConversation;
        }

        // Add user message
        const userMessage = {
          role: "user" as const,
          content: message,
          timestamp: Date.now(),
        };
        conversation.messages.push(userMessage);

        // Generate AI response based on character personality
        const characterResponse = await generateCharacterResponse(message, selectedCharacter);

        // Add AI response
        const aiMessage = {
          role: "assistant" as const,
          content: characterResponse,
          timestamp: Date.now(),
        };
        conversation.messages.push(aiMessage);

        // Update conversation
        await localDB.updateCharacterConversation(conversation.id, {
          messages: conversation.messages,
          updatedAt: Date.now(),
        });

        // Increment character usage
        await localDB.updateCharacter(selectedCharacterId, {
          conversationCount: selectedCharacter.conversationCount + 1,
          updatedAt: Date.now(),
        });

        // Reload character conversations to show updated messages
        await loadCharacterConversations();
        await loadSelectedCharacter();

        setMessage("");
      } catch (error) {
        console.error("Error in character chat:", error);
      } finally {
        setIsCharacterChatLoading(false);
      }
    }
  };

  const generateCharacterResponse = async (userMessage: string, character: Character | null) => {
    if (!character) return "I'm here to help you!";

    // Create character-specific prompt
    const characterPrompt = `You are ${character.name}, ${character.description}.

Personality:
- Tone: ${character.personality.tone}
- Response Style: ${character.personality.responseStyle}
- Traits: ${character.personality.traits.join(", ")}
- Expertise: ${character.personality.expertise.join(", ")}

${character.backstory ? `Background: ${character.backstory}` : ""}

Respond to the user's message in character, keeping your personality consistent. Be helpful, engaging, and true to your character traits.

User message: ${userMessage}`;

    try {
      // Use Venice API or fallback to simple response
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: characterPrompt }],
          character: character.name,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.message;
      }
    } catch (error) {
      console.error("Character response generation failed:", error);
    }

    // Fallback response based on character personality
    const fallbackResponses = {
      friendly: "That's really interesting! I'd love to help you with that. What specific aspect would you like to explore?",
      professional: "I understand your inquiry. Based on my expertise, I would recommend approaching this systematically.",
      casual: "Hey, that's cool! Let me think about this for a sec... what's your take on it?",
      enthusiastic: "Wow, that's fantastic! I'm excited to dive into this with you. There's so much we can explore here!",
      analytical: "Let me break this down logically. There are several key factors to consider in this situation.",
      empathetic: "I can sense this is important to you. I'm here to listen and support you through this.",
      witty: "Ah, an interesting puzzle! You know what they say about these situations... actually, let me think of something clever first.",
      wise: "In my experience, situations like these often require both patience and perspective. What draws you to this question?"
    };

    return fallbackResponses[character.personality.tone as keyof typeof fallbackResponses] ||
           "I appreciate you sharing that with me. How can I help you explore this further?";
  };

  const getCurrentMessages = () => {
    if (currentChatType === "regular") {
      return currentConversation?.messages || [];
    } else if (currentChatType === "character" && characterConversations && characterConversations.length > 0) {
      return characterConversations[0].messages || [];
    }
    return [];
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const navigationItems = [
    { id: "home", label: "Home", icon: Home, href: "/home" },
    { id: "activity", label: "Activity", icon: Activity, href: "/activity" },
    { id: "chat", label: "Chat", icon: MessageCircle, href: "/chat", active: true },
    { id: "calendar", label: "Calendar", icon: Calendar, href: "/calendar" },
    { id: "profile", label: "Profile", icon: User, href: "/profile" },
  ];

  const sidebarSections = [
    {
      title: "Search",
      icon: Search,
      content: (
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )
    },
    {
      title: "Characters",
      icon: Users,
      content: (
        <div className="p-4">
          <CharacterCreation
            onCharacterSelect={(characterId) => {
              setSelectedCharacterId(characterId);
              setCurrentChatType("character");
            }}
            selectedCharacterId={selectedCharacterId}
          />
        </div>
      )
    },
    {
      title: "Files",
      icon: FileText,
      content: (
        <div className="p-4">
          <div className="text-center text-slate-500 py-8">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <div className="text-sm">No files uploaded</div>
            <Button size="sm" className="mt-2 gap-2">
              <Plus className="w-3 h-3" />
              Upload File
            </Button>
          </div>
        </div>
      )
    },
    {
      title: "Recent Chats",
      icon: MessageCircle,
      content: (
        <div className="p-4">
          <div className="space-y-2 mb-4">
            <Button
              variant={currentChatType === "regular" ? "secondary" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => {
                setCurrentChatType("regular");
                setSelectedCharacterId(null);
              }}
            >
              <Bot className="w-4 h-4" />
              MyAi Assistant
            </Button>
            {currentChatType === "character" && selectedCharacter && (
              <Button
                variant="secondary"
                className="w-full justify-start gap-2"
              >
                <span className="text-sm">{selectedCharacter.avatar || "🤖"}</span>
                {selectedCharacter.name}
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {conversations?.slice(0, 10).map((conversation) => {
              const isActive = conversation.id === currentConversationId;
              const messageCount = conversation.messages?.length || 0;
              const lastMessage = conversation.messages?.[conversation.messages.length - 1];
              const timeAgo = lastMessage ?
                new Date(lastMessage.timestamp).toLocaleDateString() :
                new Date(conversation.createdAt).toLocaleDateString();

              return (
                <Button
                  key={conversation.id}
                  variant={isActive && currentChatType === "regular" ? "secondary" : "ghost"}
                  className={`w-full justify-start text-left p-3 h-auto ${
                    isActive && currentChatType === "regular" ? "bg-blue-50 text-blue-700 border border-blue-200" : ""
                  }`}
                  onClick={() => {
                    setCurrentConversationId(conversation.id);
                    setCurrentChatType("regular");
                    setSelectedCharacterId(null);
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium truncate">
                        {conversation.title || "Untitled Chat"}
                      </div>
                      <div className="text-xs text-slate-500 ml-2 shrink-0">
                        {messageCount}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {timeAgo}
                    </div>
                  </div>
                </Button>
              );
            })}
            {conversations && conversations.length === 0 && (
              <div className="text-center text-slate-500 py-4">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <div className="text-sm">No conversations yet</div>
              </div>
            )}
          </div>
          <div className="pt-4 border-t mt-4">
            <Button
              onClick={() => createNewChatWithSummary()}
              disabled={isCreatingNewChat}
              className="w-full gap-2"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </Button>
          </div>
        </div>
      )
    }
  ];

  const currentMessages = getCurrentMessages();
  const isCurrentChatLoading = currentChatType === "regular" ? chatLoading : isCharacterChatLoading;

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-white/50 backdrop-blur-sm border-r border-slate-200 flex-col overflow-hidden`}>
        {sidebarOpen && (
          <>
            {/* Sidebar Header */}
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Chat
                  </h1>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Sidebar Content */}
            <ScrollArea className="flex-1">
              <div className="space-y-1">
                {sidebarSections.map((section, index) => {
                  const Icon = section.icon;
                  return (
                    <div key={index} className="border-b border-slate-100 last:border-b-0">
                      <div className="p-3 bg-slate-50/50">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <Icon className="w-4 h-4" />
                          {section.title}
                        </div>
                      </div>
                      {section.content}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!sidebarOpen && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  MyAi
                </h1>
                {currentChatType === "character" && selectedCharacter && (
                  <div className="flex items-center gap-2 bg-purple-50 px-3 py-1 rounded-full">
                    <span className="text-sm">{selectedCharacter.avatar || "🤖"}</span>
                    <span className="text-sm font-medium text-purple-700">
                      {selectedCharacter.name}
                    </span>
                  </div>
                )}
              </div>
              <div className="hidden md:flex items-center gap-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.id} href={item.href}>
                      <Button
                        variant={item.active ? "secondary" : "ghost"}
                        className={`gap-2 ${item.active ? "bg-blue-50 text-blue-700" : ""}`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Online
              </Badge>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-slate-600" />
              </div>
            </div>
          </div>
        </nav>

        {/* Chat Too Long Warning - only for regular chat */}
        {currentChatType === "regular" && showChatTooLongWarning && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-800">Chat Too Long</h3>
                    <p className="text-sm text-amber-700">
                      Your chat has {messageCount} messages (max recommended: {maxMessages}).
                      Consider starting a new chat for better performance.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => createNewChatWithSummary()}
                  disabled={isCreatingNewChat}
                  className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                >
                  {isCreatingNewChat ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      New Chat
                    </>
                  )}
                </Button>
              </div>
              <div className="mt-3 text-xs text-amber-600">
                A summary of our progress so far will be added automatically to the new chat.
              </div>
            </div>
          </div>
        )}

        {/* Critical Length Warning - only for regular chat */}
        {currentChatType === "regular" && isConversationCritical && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-800">Chat at Maximum Length</h3>
                  <p className="text-sm text-red-700">
                    This conversation will automatically create a new chat on your next message to maintain performance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-4xl mx-auto">
            {isCurrentChatLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2">Loading...</span>
              </div>
            ) : currentMessages?.map((msg, index) => (
              <div
                key={`${msg.timestamp}-${index}`}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                      {currentChatType === "character" && selectedCharacter ? selectedCharacter.avatar : "AI"}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-white border border-slate-200"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <div className={`text-xs mt-2 ${msg.role === "user" ? "text-blue-100" : "text-slate-500"}`}>
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
                {msg.role === "user" && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-slate-200">
                      <UserIcon className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Chat Input */}
        <div className="bg-white/50 backdrop-blur-sm border-t border-slate-200 p-4">
          <div className="max-w-4xl mx-auto">
            {/* Message Count Progress - only for regular chat */}
            {currentChatType === "regular" && messageCount > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500">Messages in conversation</span>
                  <span className={`font-medium ${
                    isConversationCritical
                      ? "text-red-600"
                      : isConversationTooLong
                      ? "text-amber-600"
                      : "text-slate-600"
                  }`}>
                    {messageCount} / {maxMessages}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isConversationCritical
                        ? "bg-red-500"
                        : isConversationTooLong
                        ? "bg-amber-500"
                        : "bg-blue-500"
                    }`}
                    style={{ width: `${Math.min((messageCount / maxMessages) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <div className="relative flex-1">
                <Textarea
                  placeholder={
                    currentChatType === "character" && selectedCharacter
                      ? `Chat with ${selectedCharacter.name}...`
                      : isConversationCritical
                      ? "Chat is at maximum length. A new chat will be created automatically."
                      : isListening
                      ? "Listening... Speak now"
                      : "Share your thoughts, experiences, or ask me anything..."
                  }
                  value={isListening ? `${message}${interimTranscript}` : message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="min-h-[50px] max-h-[120px] resize-none pr-12"
                  disabled={isListening || (currentChatType === "regular" && (isConversationCritical || isCreatingNewChat))}
                />
                {isVoiceSupported && !(currentChatType === "regular" && isConversationCritical) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={toggleListening}
                    className={`absolute right-2 top-2 h-8 w-8 p-0 ${
                      isListening
                        ? "text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                    title={isListening ? "Stop recording" : "Start voice input"}
                  >
                    {isListening ? (
                      <MicOff className="w-4 h-4 animate-pulse" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
              <Button
                onClick={handleSendMessage}
                className="bg-blue-500 hover:bg-blue-600 text-white"
                size="icon"
                disabled={isListening || (currentChatType === "regular" && (isConversationCritical || isCreatingNewChat)) || !message.trim() || isCharacterChatLoading}
              >
                {isCreatingNewChat || isCharacterChatLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
              <p>
                {currentChatType === "character" && selectedCharacter
                  ? `Chatting with ${selectedCharacter.name} - ${selectedCharacter.personality.tone} personality`
                  : currentChatType === "regular" && isConversationCritical
                  ? "Next message will create a new chat automatically"
                  : currentChatType === "regular" && isConversationTooLong
                  ? "Consider starting a new chat for better performance"
                  : "Press Enter to send, Shift+Enter for new line"
                }
                {isVoiceSupported && !(currentChatType === "regular" && isConversationCritical) && <span className="ml-2">• Click mic for voice input</span>}
              </p>
              <p>
                {currentChatType === "character" ? `AI Character Chat` : `MyAi remembers our conversations`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatPageContent />
    </ProtectedRoute>
  );
}
