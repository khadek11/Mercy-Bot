import { NextResponse } from 'next/server';
import prisma from '@/utils/connectDB';
import protectApiRoute from '@/utils/protectApiRoute';

async function getHandler(request, { params }) {
  try {
    const userId = request.user.id;
    const awaitedParams = await params;
    const chatId = awaitedParams.chatId;
    
    // Find the chat
    const chat = await prisma.chat.findUnique({
      where: {
        userId_chatId: {
          userId: userId,
          chatId: chatId,
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
    
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }
    
    return NextResponse.json(chat);
  } catch (error) {
    console.error('Error fetching chat:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const GET = protectApiRoute(getHandler);
