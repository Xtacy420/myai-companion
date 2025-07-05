import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { veniceApi } from "@/lib/veniceApi";

// Maximum messages before suggesting a new chat
const MAX_MESSAGES_PER_CHAT = 50;
// Critical length where we force a new chat
const CRITICAL_MESSAGE_LENGTH = 75;

export function useChat(userId: Id<"users"> | null) {
  const [currentConversationId, setCurrentConversationId] = useState<Id<"conversations"> | null>(null);
  const [showChatTooLongWarning, setShowChatTooLongWarning] = useState(false);
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false);

  const conversations = useQuery(
    api.conversations.getConversationsByUser,
    userId ? {} : "skip"
  );

  const currentConversation = useQuery(
    api.conversations.getConversation,
    currentConversationId ? { conversationId: currentConversationId } : "skip"
  );

  const createConversation = useMutation(api.conversations.createConversation);
  const addMessage = useMutation(api.conversations.addMessage);
  const createMemory = useMutation(api.memory.createMemory);
  const updateConversationTitle = useMutation(api.conversations.updateConversationTitle);

  // Check if current conversation is too long
  const isConversationTooLong = (currentConversation?.messages?.length || 0) >= MAX_MESSAGES_PER_CHAT;
  const isConversationCritical = (currentConversation?.messages?.length || 0) >= CRITICAL_MESSAGE_LENGTH;

  useEffect(() => {
    if (userId && conversations && conversations.length === 0) {
      // Create first conversation if none exists
      createConversation({
        title: "Welcome Chat",
      }).then((convId) => {
        setCurrentConversationId(convId);
        // Add welcome message
        addMessage({
          conversationId: convId,
          role: "assistant",
          content: "Hello! I'm MyAi, your personal memory companion. I'm here to remember the important details of your life and help you reflect on your experiences. What would you like to talk about today?",
        });
      });
    } else if (conversations && conversations.length > 0 && !currentConversationId) {
      // Use the most recent conversation
      setCurrentConversationId(conversations[0]._id);
    }
  }, [userId, conversations, currentConversationId, createConversation, addMessage]);

  // Check for chat length warnings
  useEffect(() => {
    if (isConversationTooLong && !isConversationCritical) {
      setShowChatTooLongWarning(true);
    } else {
      setShowChatTooLongWarning(false);
    }
  }, [isConversationTooLong, isConversationCritical]);

  const generateConversationSummary = async (messages: any[]): Promise<string> => {
    try {
      // Use Venice API to generate a conversation summary
      const conversationText = messages
        .slice(-20) // Get last 20 messages for summary
        .map(msg => `${msg.role === 'user' ? 'You' : 'MyAi'}: ${msg.content}`)
        .join('\n');

      const summaryPrompt = `Please create a brief summary of this conversation between a user and MyAi. Focus on key topics, important information, and the overall context that should be remembered for future conversations:\n\n${conversationText}`;

      const summary = await veniceApi.generateResponse([{
        role: "user",
        content: summaryPrompt
      }], "You are a helpful assistant that creates concise conversation summaries. Focus on key points, topics discussed, and important context.");

      return summary;
    } catch (error) {
      console.error("Failed to generate summary:", error);
      // Fallback summary
      const recentTopics = messages
        .slice(-10)
        .filter(msg => msg.role === 'user')
        .map(msg => msg.content.substring(0, 50))
        .join(', ');

      return `Previous conversation covered: ${recentTopics || 'various topics'}. This chat was continued from an earlier conversation.`;
    }
  };

  const createNewChatWithSummary = async (forceCreate = false): Promise<void> => {
    if (!currentConversation || !userId || isCreatingNewChat) return;

    setIsCreatingNewChat(true);

    try {
      // Generate summary of current conversation
      const summary = await generateConversationSummary(currentConversation.messages);

      // Update title of current conversation based on content
      const conversationTitle = `Chat ${new Date().toLocaleDateString()} (${currentConversation.messages.length} messages)`;
      await updateConversationTitle({
        conversationId: currentConversationId!,
        title: conversationTitle,
      });

      // Create new conversation
      const newConversationId = await createConversation({
        title: "New Chat",
      });

      // Add summary message to new conversation
      await addMessage({
        conversationId: newConversationId,
        role: "assistant",
        content: `Hello! I've started a new chat to keep our conversation manageable. Here's a summary of what we discussed previously:\n\n${summary}\n\nWhat would you like to talk about now?`,
      });

      // Switch to new conversation
      setCurrentConversationId(newConversationId);
      setShowChatTooLongWarning(false);

      // Store the summary as a memory
      await createMemory({
        type: "conversation",
        content: `Conversation summary: ${summary}`,
        summary: "Chat summary from previous conversation",
        importance: 7,
        tags: ["conversation-summary", "chat-history"],
        metadata: {
          context: "chat-transition",
        },
      });

    } catch (error) {
      console.error("Failed to create new chat:", error);
    } finally {
      setIsCreatingNewChat(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!currentConversationId || !userId) return;

    // Force create new chat if at critical length
    if (isConversationCritical) {
      await createNewChatWithSummary(true);
      return;
    }

    // Add user message
    await addMessage({
      conversationId: currentConversationId,
      role: "user",
      content,
    });

    // Analyze user message for intelligent memory storage
    try {
      const userInsights = await veniceApi.extractMemoryInsights([{
        role: "user",
        content,
      }]);

      // Store user message as memory with intelligent insights
      await createMemory({
        type: "conversation",
        content: `User said: ${content}`,
        summary: userInsights.summary,
        importance: userInsights.importance,
        tags: [...userInsights.tags, "user-input"],
        metadata: {
          context: "chat",
          emotion: userInsights.emotionalContext,
        },
      });
    } catch (error) {
      console.error("Error analyzing user message:", error);
      // Fallback to simple memory storage
      await createMemory({
        type: "conversation",
        content: `User said: ${content}`,
        summary: content.length > 100 ? `${content.substring(0, 100)}...` : content,
        importance: 5,
        tags: ["conversation", "user-input"],
        metadata: {
          context: "chat",
        },
      });
    }

    // Generate AI response using Venice API
    setTimeout(async () => {
      try {
        // Prepare conversation history for Venice API
        const conversationHistory = currentConversation?.messages?.map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })) || [];

        // Add the current user message
        conversationHistory.push({
          role: "user",
          content,
        });

        // Generate response using Venice API
        const aiResponse = await veniceApi.generateResponse(conversationHistory);

        // Add AI response to conversation
        await addMessage({
          conversationId: currentConversationId,
          role: "assistant",
          content: aiResponse,
        });

        // Extract insights for memory storage
        const insights = await veniceApi.extractMemoryInsights(conversationHistory);

        // Store AI response as memory with intelligent insights
        await createMemory({
          type: "conversation",
          content: `AI responded: ${aiResponse}`,
          summary: insights.summary,
          importance: insights.importance,
          tags: [...insights.tags, "ai-response"],
          metadata: {
            context: "chat",
            emotion: insights.emotionalContext,
          },
        });
      } catch (error) {
        console.error("Error generating AI response:", error);
        // Fallback to simple response
        const fallbackResponse = generateAIResponse(content);
        await addMessage({
          conversationId: currentConversationId,
          role: "assistant",
          content: fallbackResponse,
        });
      }
    }, 1000);
  };

  const generateAIResponse = (userMessage: string): string => {
    const responses = [
      "That's really interesting! I'll remember this conversation. How does that make you feel?",
      "I understand. This seems important to you. Can you tell me more about why this matters?",
      "Thank you for sharing that with me. I'll keep this in mind for our future conversations.",
      "That sounds significant. I'm storing this memory so I can reference it later. What would you like to explore next?",
      "I appreciate you opening up about this. How would you like me to remember this for the future?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  return {
    conversations: conversations || [],
    currentConversation,
    currentConversationId,
    sendMessage,
    isLoading: !userId || conversations === undefined,
    setCurrentConversationId,
    // New chat length management
    isConversationTooLong,
    isConversationCritical,
    showChatTooLongWarning,
    createNewChatWithSummary,
    isCreatingNewChat,
    messageCount: currentConversation?.messages?.length || 0,
    maxMessages: MAX_MESSAGES_PER_CHAT,
  };
}
