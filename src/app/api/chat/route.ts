import { type NextRequest, NextResponse } from "next/server";
import { veniceApi } from "@/lib/veniceApi";

export async function POST(request: NextRequest) {
  try {
    const { messages, character } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    try {
      // Try to use Venice API for character responses
      const response = await veniceApi.generateResponse(
        messages,
        `You are ${character || "an AI assistant"}. Respond in character consistently.`
      );

      return NextResponse.json({ message: response });
    } catch (veniceError) {
      console.error("Venice API error:", veniceError);

      // Fallback to local character response generation
      const userMessage = messages[messages.length - 1]?.content || "";
      const fallbackResponse = generateFallbackResponse(userMessage, character);

      return NextResponse.json({ message: fallbackResponse });
    }
  } catch (error) {
    console.error("Character chat API error:", error);

    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}

function generateFallbackResponse(userMessage: string, character?: string): string {
  const responses = [
    `As ${character || "your AI companion"}, I find that really interesting! Let me share my thoughts on that.`,
    `That's a great question! From my perspective as ${character || "an AI assistant"}, I'd suggest considering a few different angles.`,
    `I appreciate you sharing that with me. As ${character || "your companion"}, I'm here to help you explore this further.`,
    `That resonates with me! In my experience as ${character || "an AI"}, situations like this often have multiple layers to consider.`,
    `Thank you for bringing this up. I'd love to dive deeper into this topic with you.`,
    `That's fascinating! Let me offer my perspective on this, and I'm curious to hear more of your thoughts too.`,
  ];

  const randomResponse = responses[Math.floor(Math.random() * responses.length)];

  // Add some context-aware elements
  if (userMessage.toLowerCase().includes("help")) {
    return `${randomResponse} I'm here to help you work through this step by step.`;
  } else if (userMessage.toLowerCase().includes("think")) {
    return `${randomResponse} I'd love to hear more about your thought process on this.`;
  } else if (userMessage.toLowerCase().includes("feel")) {
    return `${randomResponse} Your feelings about this are really important and valid.`;
  }

  return randomResponse;
}
