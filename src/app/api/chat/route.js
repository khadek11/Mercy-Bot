import { GoogleGenerativeAI } from "@google/generative-ai";
import protectApiRoute from "@/utils/protectApiRoute";
import { NextResponse } from 'next/server'; // Import NextResponse
import prisma from '@/utils/connectDB'; // Import prisma client

// GET: Fetch all chat sessions for a given userId.
async function getChats(request) {
  try {
    // The user is already authenticated by protectApiRoute, use request.user.id
    const userId = request.user.id;

    const chats = await prisma.chat.findMany({
      where: {
        userId: userId,
      },
      include: {
        messages: {
          orderBy: {
            timestamp: 'asc', // Order messages by timestamp
          },
        },
      },
    });

    return new Response(JSON.stringify(chats), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Check if error is null or undefined before logging and accessing message
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error("Error fetching chats:", error); // Keep this line for original error logging
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// POST: Process a new message for a specific chat session.
async function postMessage(request) {
  try {
    // The user is already authenticated by protectApiRoute, use request.user.id
    const userId = request.user.id;
    const { chatId, question, language, pdfText } = await request.json();

    if (!chatId || !question) {
      return new Response(
        JSON.stringify({ error: "Missing chatId or question" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const systemMessage = `You are a knowledgeable AI fluent in ${language}. Respond clearly and naturally in ${language}. You are a professional AI assistant designed to provide accurate, unbiased, and fact-based information. Your responses should be clear, concise, and grounded in verified knowledge, including up-to-date insights from credible sources across the internet. Maintain a neutral tone, avoid personal opinions or speculation, and always aim to provide balanced viewpoints where applicable. If a topic has multiple perspectives, present them objectively without favoring any side. Prioritize reliability, transparency, and user clarity in every response.`;

    console.log(`Processing message for userId: ${userId}, chatId: ${chatId}`);

    // Retrieve or create the chat session.
    // Use the incoming chatId (string) for the composite unique constraint
    let chat = await prisma.chat.findUnique({
      where: {
        userId_chatId: { // Use the composite unique constraint
          userId: userId,
          chatId: chatId, // Use the incoming chatId string
        },
      },
      include: {
        messages: {
          orderBy: {
            timestamp: 'asc', // Order messages by timestamp
          },
        },
      },
    });

    if (!chat) {
      console.log(`Chat not found for userId: ${userId}, chatId: ${chatId}. Creating new chat.`);
      // Create new chat session
      chat = await prisma.chat.create({
        data: {
          userId,
          chatId, // Use the incoming chatId string
          messages: { // Create the initial user message with the chat
            create: {
              role: "user",
              type: "text",
              text: question,
            },
          },
        },
        include: {
          messages: {
            orderBy: {
              timestamp: 'asc',
            },
          },
        },
      });
      console.log(`New chat created with internal id: ${chat.id}`);
    } else {
      console.log(`Chat found with internal id: ${chat.id}. Appending message.`);
      // Append the user's message to the existing chat.
      await prisma.message.create({
        data: {
          chatId: chat.id, // Use the internal chat id
          role: "user",
          type: "text",
          text: question,
        },
      });
      // Re-fetch the chat to get the updated messages
      chat = await prisma.chat.findUnique({
        where: {
          id: chat.id, // Use the internal chat id
        },
        include: {
          messages: {
            orderBy: {
              timestamp: 'asc',
            },
          },
        },
      });
    }

    // Build conversation context from stored messages.
    // For document messages, include the textPreview from the meta field.
    const conversationContext = chat.messages
      .map((msg) => {
        if (msg.type === "document" && msg.meta && msg.meta.textPreview) {
          return `Document Info: ${msg.meta.textPreview}`;
        }
        return msg.role === "user" ? `User: ${msg.text}` : `AI: ${msg.text}`;
      })
      .join("\n");

    // Include PDF text in the prompt if available
    const pdfContext = pdfText ? `\n\nDocument Content:\n${pdfText}` : '';

    // Build the full prompt.
    const prompt = `${systemMessage}\n${conversationContext}${pdfContext}\nUser: ${question}\nAI:`;

    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (!googleApiKey) {
      console.error("GOOGLE_API_KEY environment variable is not set.");
      return new Response(JSON.stringify({ error: "Server configuration error: Google API key missing." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const genAI = new GoogleGenerativeAI(googleApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    console.log("Sending prompt to Google Generative AI...");
    const chatResponse = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });
    console.log("Received response from Google Generative AI.");

    const responseText =
      chatResponse.response.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I'm sorry, I couldn't generate a response.";

    // Append the AI's response message.
    await prisma.message.create({
      data: {
        chatId: chat.id, // Use the internal chat id
        role: "ai",
        type: "text",
        text: responseText,
      },
    });

    return new Response(JSON.stringify({ text: responseText }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Check if error is null or undefined before logging
    if (error) {
      console.error("Error processing chat:", error instanceof Error ? error.message : error);
    } else {
      console.error("Error processing chat: Caught null or undefined error.");
    }

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const GET = protectApiRoute(getChats);
export const POST = protectApiRoute(postMessage);
