"use client";

import { ChatList } from "@/app/components/chat/ChatList";
import { ChatMessageList } from "@/app/components/chat/ChatMessageList";
import { useChatContext } from "@/app/context/ChatContext";
import { Separator } from "@/components/ui/separator";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function Chat() {
  const pathname = usePathname();
  const chatId = pathname.split("/").pop();

  const { handleSelectChat } = useChatContext();

  useEffect(() => {
    if (chatId) {
      handleSelectChat(Number.parseInt(chatId, 10));
    } else {
      handleSelectChat();
    }
  }, [handleSelectChat, chatId]);

  return (
    <div className="grid flex-1 grid-cols-[minmax(min-content,_400px)_min-content_auto] rounded-md border">
      <ChatList />
      <Separator orientation="vertical" />
      <ChatMessageList />
    </div>
  );
}
