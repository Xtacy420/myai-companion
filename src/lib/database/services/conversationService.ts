import { localDB } from '../database';
import { Conversation } from '../schema';

export class ConversationService {
  private static instance: ConversationService;

  private constructor() {}

  static getInstance(): ConversationService {
    if (!ConversationService.instance) {
      ConversationService.instance = new ConversationService();
    }
    return ConversationService.instance;
  }

  async createConversation(
    userId: string,
    title: string = 'New Conversation'
  ): Promise<Conversation> {
    const conversation: Conversation = {
      id: this.generateConversationId(),
      userId,
      title,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await localDB.createConversation(conversation);
    return conversation;
  }

  async getConversationById(id: string): Promise<Conversation | null> {
    const conversation = await localDB.getConversationById(id);
    return conversation || null;
  }

  async getConversationsByUser(userId: string): Promise<Conversation[]> {
    return await localDB.getConversationsByUser(userId);
  }

  async addMessageToConversation(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<void> {
    const conversation = await this.getConversationById(conversationId);
    if (!conversation) throw new Error('Conversation not found');

    const message = {
      role,
      content,
      timestamp: Date.now(),
    };

    conversation.messages.push(message);
    conversation.updatedAt = Date.now();

    // Auto-generate title from first user message
    if (conversation.messages.length === 1 && role === 'user') {
      conversation.title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
    }

    await localDB.updateConversation(conversationId, {
      title: conversation.title,
      messages: conversation.messages,
      updatedAt: conversation.updatedAt,
    });
  }

  async updateConversationTitle(id: string, title: string): Promise<void> {
    await localDB.updateConversation(id, {
      title,
      updatedAt: Date.now(),
    });
  }

  async deleteConversation(id: string): Promise<void> {
    await localDB.deleteConversation(id);
  }

  async searchConversations(userId: string, query: string): Promise<Conversation[]> {
    return await localDB.searchConversations(userId, query);
  }

  async getConversationStats(userId: string): Promise<{
    totalConversations: number;
    totalMessages: number;
    averageMessagesPerConversation: number;
  }> {
    const conversations = await this.getConversationsByUser(userId);
    const totalConversations = conversations.length;
    const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
    const averageMessagesPerConversation = totalConversations > 0 ? totalMessages / totalConversations : 0;

    return {
      totalConversations,
      totalMessages,
      averageMessagesPerConversation: Math.round(averageMessagesPerConversation * 10) / 10,
    };
  }

  async createSummaryConversation(
    userId: string,
    originalConversation: Conversation,
    summary: string
  ): Promise<Conversation> {
    const summaryConversation = await this.createConversation(
      userId,
      `${originalConversation.title} (Continued)`
    );

    // Add summary as first message
    await this.addMessageToConversation(
      summaryConversation.id,
      'assistant',
      `Previous conversation summary: ${summary}`
    );

    return summaryConversation;
  }

  async isConversationTooLong(
    conversationId: string,
    maxMessages: number = 100
  ): Promise<{ isLong: boolean; isCritical: boolean; messageCount: number }> {
    const conversation = await this.getConversationById(conversationId);
    if (!conversation) {
      return { isLong: false, isCritical: false, messageCount: 0 };
    }

    const messageCount = conversation.messages.length;
    const warningThreshold = Math.floor(maxMessages * 0.8); // 80% of max

    return {
      isLong: messageCount >= warningThreshold,
      isCritical: messageCount >= maxMessages,
      messageCount,
    };
  }

  async getRecentConversations(userId: string, limit: number = 10): Promise<Conversation[]> {
    const conversations = await this.getConversationsByUser(userId);
    return conversations.slice(0, limit);
  }

  async exportConversations(userId: string): Promise<string> {
    const conversations = await this.getConversationsByUser(userId);
    return JSON.stringify(conversations, null, 2);
  }

  async importConversations(userId: string, data: string): Promise<number> {
    try {
      const conversations: Conversation[] = JSON.parse(data);
      let importedCount = 0;

      for (const conversation of conversations) {
        // Check if conversation already exists
        const existing = await this.getConversationById(conversation.id);
        if (!existing) {
          const updatedConversation = {
            ...conversation,
            userId, // Override userId to current user
          };
          await localDB.createConversation(updatedConversation);
          importedCount++;
        }
      }

      return importedCount;
    } catch (error) {
      throw new Error('Invalid conversation data format');
    }
  }

  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const conversationService = ConversationService.getInstance();
