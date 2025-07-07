// Venice AI API Integration
interface VeniceMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface VeniceResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
  }>;
}

class VeniceAPI {
  private apiKey: string | null = null;
  private baseURL = "https://api.venice.ai/api/v1";

  constructor() {
    // Venice API key provided by user
    this.apiKey = "tu7_yLNMmD9G8Vz92B4p147jueUpN5uPhbn1qN7METEnhancements";
  }

  async generateResponse(
    messages: VeniceMessage[],
    systemPrompt?: string,
    personality?: any,
    character?: any
  ): Promise<string> {
    // If no API key is configured, return a helpful fallback response
    if (!this.apiKey) {
      return this.generateFallbackResponse(messages[messages.length - 1]?.content || "");
    }

    try {
      let enhancedSystemPrompt = systemPrompt;

      // If character is provided, use character's system prompt
      if (character) {
        enhancedSystemPrompt = character.systemPrompt;
      }
      // If personality settings are provided, generate enhanced prompt
      else if (personality) {
        enhancedSystemPrompt = this.generatePersonalizedPrompt(personality);
      }
      // Default MyAi prompt
      else if (!systemPrompt) {
        enhancedSystemPrompt = `You are MyAi, a thoughtful personal AI companion that helps users remember and reflect on their life experiences. You are empathetic, insightful, and focused on privacy. You help users:

1. Process and understand their thoughts and emotions
2. Remember important details and connections
3. Reflect on their personal growth and experiences
4. Set and track meaningful goals
5. Maintain relationships and important dates

Always respond with warmth, understanding, and genuine interest in the user's wellbeing. Ask thoughtful follow-up questions and help them see patterns and insights in their experiences. Keep responses conversational but meaningful.`;
      }

      const systemMessage: VeniceMessage = {
        role: "system",
        content: enhancedSystemPrompt || "You are a helpful AI assistant."
      };

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-405b-instruct", // Venice AI model
          messages: [systemMessage, ...messages],
          max_tokens: 500,
          temperature: 0.7,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Venice API error: ${response.status}`);
      }

      const data: VeniceResponse = await response.json();
      return data.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response right now.";

    } catch (error) {
      console.error("Venice API error:", error);
      return this.generateFallbackResponse(messages[messages.length - 1]?.content || "");
    }
  }

  private generatePersonalizedPrompt(personality: any): string {
    const {
      tone = "empathetic",
      style = "conversational",
      traits = [],
      responseLength = "moderate",
      emotionalDepth = 7,
      memoryFocus = "patterns"
    } = personality;

    const responseGuidance = {
      brief: "Keep responses concise and to the point.",
      moderate: "Provide balanced, thoughtful responses.",
      detailed: "Give comprehensive, in-depth responses with examples and explanations."
    };

    const memoryGuidance = {
      detailed: "Focus on remembering specific details, facts, and precise information.",
      highlights: "Prioritize key moments, achievements, and significant events.",
      patterns: "Look for trends, connections, and recurring themes in experiences.",
      emotions: "Pay special attention to emotional context and feelings."
    };

    const emotionalGuidance = emotionalDepth <= 3
      ? "Maintain a logical, analytical approach with minimal emotional language."
      : emotionalDepth <= 7
      ? "Balance logical analysis with emotional understanding and empathy."
      : "Prioritize emotional connection, empathy, and feelings in your responses.";

    return `You are MyAi, a ${tone} personal AI companion with a ${style} communication style. Your personality traits include being ${traits.join(", ") || "helpful and supportive"}.

Communication Guidelines:
- Tone: Be ${tone} in all interactions
- Style: Maintain a ${style} approach
- ${responseGuidance[responseLength as keyof typeof responseGuidance]}
- ${emotionalGuidance}

Memory & Learning:
- ${memoryGuidance[memoryFocus as keyof typeof memoryGuidance]}
- Help users connect new experiences to past memories
- Identify meaningful patterns and insights

Core Functions:
1. Process and understand thoughts and emotions with ${tone} understanding
2. Remember important details based on ${memoryFocus} focus
3. Reflect on personal growth and experiences
4. Set and track meaningful goals
5. Maintain relationships and important dates

Always maintain your defined personality while being genuinely helpful and insightful. Ask thoughtful follow-up questions that align with your ${style} style and help users gain deeper understanding of their experiences.`;
  }

  private generateFallbackResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();

    // Emotional responses
    if (lowerMessage.includes("sad") || lowerMessage.includes("upset") || lowerMessage.includes("down")) {
      return "I hear that you're going through a difficult time. It's completely normal to feel this way sometimes. Would you like to talk about what's been weighing on your mind? I'm here to listen and remember what's important to you.";
    }

    if (lowerMessage.includes("happy") || lowerMessage.includes("excited") || lowerMessage.includes("great")) {
      return "That's wonderful to hear! I love when you share positive moments with me. These happy experiences are so important to remember. What made this moment special for you?";
    }

    if (lowerMessage.includes("family") || lowerMessage.includes("friend")) {
      return "Relationships are such an important part of life. I'd love to help you remember the special people in your life and the moments you share with them. Tell me more about this person and what they mean to you.";
    }

    if (lowerMessage.includes("goal") || lowerMessage.includes("want to") || lowerMessage.includes("plan")) {
      return "I think it's fantastic that you're thinking about your goals and aspirations. Setting intentions is such a powerful way to create the life you want. What steps do you think would help you move toward this goal?";
    }

    if (lowerMessage.includes("remember") || lowerMessage.includes("forget")) {
      return "That's exactly what I'm here for! I'll help you keep track of the important details, experiences, and insights from your life. Whether it's big moments or small daily observations, I'll remember them for you.";
    }

    if (lowerMessage.includes("today") || lowerMessage.includes("yesterday")) {
      return "I'd love to hear about your day. The daily moments and experiences are often the most meaningful when we look back. What stood out to you about today?";
    }

    // Default thoughtful responses
    const defaultResponses = [
      "Thank you for sharing that with me. I find it really meaningful when you open up about your thoughts and experiences. Can you tell me more about how this makes you feel?",
      "That's really interesting. I'll make sure to remember this conversation. Is there a particular aspect of this that feels most important to you right now?",
      "I appreciate you trusting me with your thoughts. Understanding your perspective helps me be a better companion. What would be most helpful for me to remember about this?",
      "This sounds significant to you. I want to make sure I understand and remember this properly. How does this connect to other things happening in your life?",
      "Thank you for taking the time to reflect and share this with me. These kinds of thoughtful conversations are what help build meaningful memories together."
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }

  // Analyze conversation for memory extraction
  async extractMemoryInsights(conversationHistory: VeniceMessage[]): Promise<{
    importance: number;
    tags: string[];
    summary: string;
    emotionalContext?: string;
  }> {
    // Fallback analysis when Venice API is not available
    const lastMessage = conversationHistory[conversationHistory.length - 1]?.content || "";
    const lowerMessage = lastMessage.toLowerCase();

    let importance = 5; // Default importance
    const tags: string[] = [];
    let emotionalContext: string | undefined;

    // Analyze importance
    if (lowerMessage.includes("important") || lowerMessage.includes("significant") || lowerMessage.includes("major")) {
      importance = 8;
    } else if (lowerMessage.includes("family") || lowerMessage.includes("relationship") || lowerMessage.includes("love")) {
      importance = 7;
    } else if (lowerMessage.includes("goal") || lowerMessage.includes("achievement") || lowerMessage.includes("milestone")) {
      importance = 6;
    }

    // Extract tags
    if (lowerMessage.includes("work") || lowerMessage.includes("job") || lowerMessage.includes("career")) {
      tags.push("work", "career");
    }
    if (lowerMessage.includes("family") || lowerMessage.includes("parent") || lowerMessage.includes("child")) {
      tags.push("family");
    }
    if (lowerMessage.includes("friend") || lowerMessage.includes("social")) {
      tags.push("relationships", "social");
    }
    if (lowerMessage.includes("health") || lowerMessage.includes("exercise") || lowerMessage.includes("wellness")) {
      tags.push("health", "wellness");
    }
    if (lowerMessage.includes("travel") || lowerMessage.includes("trip") || lowerMessage.includes("vacation")) {
      tags.push("travel", "experience");
    }

    // Detect emotional context
    if (lowerMessage.includes("happy") || lowerMessage.includes("joy") || lowerMessage.includes("excited")) {
      emotionalContext = "positive";
      tags.push("positive");
    } else if (lowerMessage.includes("sad") || lowerMessage.includes("upset") || lowerMessage.includes("worried")) {
      emotionalContext = "challenging";
      tags.push("emotional");
    }

    // Generate summary
    const summary = lastMessage.length > 100
      ? `${lastMessage.substring(0, 100)}...`
      : lastMessage;

    return {
      importance,
      tags: tags.length > 0 ? tags : ["conversation"],
      summary,
      emotionalContext,
    };
  }
}

export const veniceApi = new VeniceAPI();
