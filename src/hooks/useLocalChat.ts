import { useState, useEffect, useCallback } from 'react';
import { conversationService } from '@/lib/database/services/conversationService';
import type { Conversation } from '@/lib/database/schema';

const MAX_MESSAGES_DEFAULT = 100;
const WARNING_THRESHOLD = 0.8; // 80% of max messages

export function useLocalChat(userId: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false);

  // Chat length management
  const [maxMessages] = useState(MAX_MESSAGES_DEFAULT);
  const messageCount = currentConversation?.messages?.length || 0;
  const isConversationTooLong = messageCount >= Math.floor(maxMessages * WARNING_THRESHOLD);
  const isConversationCritical = messageCount >= maxMessages;
  const showChatTooLongWarning = isConversationTooLong && !isConversationCritical;

  // Load conversations when user changes
  useEffect(() => {
    if (userId) {
      loadConversations();
    } else {
      setConversations([]);
      setCurrentConversation(null);
      setCurrentConversationId(null);
    }
  }, [userId]);

  // Load current conversation when ID changes
  useEffect(() => {
    if (currentConversationId) {
      loadCurrentConversation();
    }
  }, [currentConversationId]);

  const loadConversations = useCallback(async () => {
    if (!userId) return;

    try {
      const userConversations = await conversationService.getConversationsByUser(userId);
      setConversations(userConversations);

      // Auto-select most recent conversation if none selected
      if (!currentConversationId && userConversations.length > 0) {
        setCurrentConversationId(userConversations[0].id);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }, [userId, currentConversationId]);

  const loadCurrentConversation = useCallback(async () => {
    if (!currentConversationId) return;

    try {
      const conversation = await conversationService.getConversationById(currentConversationId);
      setCurrentConversation(conversation);
    } catch (error) {
      console.error('Failed to load current conversation:', error);
    }
  }, [currentConversationId]);

  const sendMessage = useCallback(async (message: string) => {
    if (!userId || !message.trim()) return;

    setIsLoading(true);

    try {
      let conversationId = currentConversationId;

      // Create new conversation if none exists
      if (!conversationId) {
        const newConversation = await conversationService.createConversation(userId);
        conversationId = newConversation.id;
        setCurrentConversationId(conversationId);
        await loadConversations();
      }

      // Add user message
      await conversationService.addMessageToConversation(conversationId, 'user', message);

      // Generate AI response (simplified - you'd integrate with Venice AI here)
      const aiResponse = await generateAIResponse(message);
      await conversationService.addMessageToConversation(conversationId, 'assistant', aiResponse);

      // Reload current conversation to show new messages
      await loadCurrentConversation();
      await loadConversations(); // Refresh list to update last message time
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, currentConversationId, loadConversations, loadCurrentConversation]);

  const createNewChat = useCallback(async () => {
    if (!userId) return;

    setIsCreatingNewChat(true);

    try {
      const newConversation = await conversationService.createConversation(userId);
      setCurrentConversationId(newConversation.id);
      await loadConversations();
    } catch (error) {
      console.error('Failed to create new chat:', error);
    } finally {
      setIsCreatingNewChat(false);
    }
  }, [userId, loadConversations]);

  const createNewChatWithSummary = useCallback(async (forceSummary = false) => {
    if (!userId || !currentConversation) return;

    // If forcing summary or conversation is too long, create summary
    if (forceSummary || isConversationCritical) {
      setIsCreatingNewChat(true);

      try {
        // Generate summary of current conversation
        const summary = generateConversationSummary(currentConversation);

        // Create new conversation with summary
        const newConversation = await conversationService.createSummaryConversation(
          userId,
          currentConversation,
          summary
        );

        setCurrentConversationId(newConversation.id);
        await loadConversations();
      } catch (error) {
        console.error('Failed to create new chat with summary:', error);
      } finally {
        setIsCreatingNewChat(false);
      }
    } else {
      // Just create a new chat normally
      await createNewChat();
    }
  }, [userId, currentConversation, isConversationCritical, createNewChat]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      await conversationService.deleteConversation(conversationId);

      // If we deleted the current conversation, switch to another one
      if (conversationId === currentConversationId) {
        setCurrentConversationId(null);
        setCurrentConversation(null);
      }

      await loadConversations();
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  }, [currentConversationId, loadConversations]);

  const searchConversations = useCallback(async (query: string) => {
    if (!userId) return [];

    try {
      return await conversationService.searchConversations(userId, query);
    } catch (error) {
      console.error('Failed to search conversations:', error);
      return [];
    }
  }, [userId]);

  const exportConversations = useCallback(async () => {
    if (!userId) throw new Error('No user logged in');

    try {
      return await conversationService.exportConversations(userId);
    } catch (error) {
      console.error('Failed to export conversations:', error);
      throw error;
    }
  }, [userId]);

  const importConversations = useCallback(async (data: string) => {
    if (!userId) throw new Error('No user logged in');

    try {
      const importedCount = await conversationService.importConversations(userId, data);
      await loadConversations();
      return importedCount;
    } catch (error) {
      console.error('Failed to import conversations:', error);
      throw error;
    }
  }, [userId, loadConversations]);

  const getConversationStats = useCallback(async () => {
    if (!userId) return null;

    try {
      return await conversationService.getConversationStats(userId);
    } catch (error) {
      console.error('Failed to get conversation stats:', error);
      return null;
    }
  }, [userId]);

  return {
    // Data
    conversations,
    currentConversation,
    currentConversationId,

    // State
    isLoading,
    isCreatingNewChat,

    // Chat length management
    messageCount,
    maxMessages,
    isConversationTooLong,
    isConversationCritical,
    showChatTooLongWarning,

    // Actions
    sendMessage,
    createNewChat,
    createNewChatWithSummary,
    setCurrentConversationId,
    deleteConversation,
    searchConversations,
    exportConversations,
    importConversations,
    getConversationStats,
  };
}

// Helper function to generate AI response (simplified)
async function generateAIResponse(userMessage: string): Promise<string> {
  // In a real implementation, you'd call the Venice AI API here
  // For now, we'll use a simple fallback response

  try {
    // You could integrate Venice AI API here
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.message;
    }
  } catch (error) {
    console.error('AI response generation failed:', error);
  }

  // Fallback responses
  const fallbackResponses = [
    "I understand what you're saying. Could you tell me more about that?",
    "That's interesting! How does that make you feel?",
    "I'm here to help you process your thoughts. What's most important to you about this?",
    "Thank you for sharing that with me. What would you like to explore next?",
    "I appreciate you opening up. How can I support you with this?",
  ];

  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
}

// Helper function to generate conversation summary
function generateConversationSummary(conversation: Conversation): string {
  const messageCount = conversation.messages.length;
  const userMessages = conversation.messages.filter(m => m.role === 'user');
  const lastFewMessages = conversation.messages.slice(-6); // Last 6 messages

  // Extract key topics from user messages
  const topics = userMessages
    .slice(-10) // Last 10 user messages
    .map(m => m.content)
    .join(' ')
    .toLowerCase();

  let summary = `Previous conversation (${messageCount} messages): `;

  if (topics.includes('work') || topics.includes('job')) {
    summary += 'We discussed work and career topics. ';
  }
  if (topics.includes('family') || topics.includes('relationship')) {
    summary += 'We talked about family and relationships. ';
  }
  if (topics.includes('feeling') || topics.includes('emotion')) {
    summary += 'We explored feelings and emotions. ';
  }
  if (topics.includes('goal') || topics.includes('plan')) {
    summary += 'We discussed goals and future plans. ';
  }

  // Add context from recent messages
  const recentContext = lastFewMessages
    .filter(m => m.role === 'user')
    .slice(-2)
    .map(m => m.content.slice(0, 100))
    .join(' | ');

  if (recentContext) {
    summary += `Recent topics: ${recentContext}`;
  }

  return summary.trim();
}
