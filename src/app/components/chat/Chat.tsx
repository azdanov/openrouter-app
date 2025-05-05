"use client";

import { ChatList } from "@/app/components/chat/ChatList";
import { ChatMessageList } from "@/app/components/chat/ChatMessageList";
import { useChatList } from "@/app/hooks/useChatList";

interface ChatProps {
  userEmail: string;
  initialChatId?: number | null;
}

export default function Chat({ userEmail, initialChatId = null }: ChatProps) {
  const {
    chats,
    isLoadingChats,
    currentChatId,
    handleCreateChat,
    handleDeleteChat,
    handleSelectChat,
  } = useChatList(userEmail, initialChatId);

  return (
    <div className="flex flex-1 border rounded-md">
      <ChatList
        chats={chats}
        isLoadingChats={isLoadingChats}
        currentChatId={currentChatId}
        handleCreateChat={handleCreateChat}
        handleDeleteChat={handleDeleteChat}
        handleSelectChat={handleSelectChat}
      />
      <ChatMessageList currentChatId={currentChatId} />
    </div>
  );
}
