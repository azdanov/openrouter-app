"use client";

import { useChatMessages } from "@/app/hooks/useChatMessages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Message } from "@/types";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Send } from "lucide-react";

export const ChatMessageList = ({
  currentChatId,
}: {
  currentChatId: number | null;
}) => {
  const {
    currentMessages,
    isLoadingMessages,
    isSending,
    inputMessage,
    setInputMessage,
    handleSendMessage,
    messagesEndRef,
  } = useChatMessages(currentChatId);

  return (
    <div className="w-3/4 flex flex-col">
      {currentChatId === null ? (
        <div className="flex-grow flex items-center justify-center text-neutral-500">
          Select a chat or create a new one to start messaging.
        </div>
      ) : (
        <>
          <ScrollArea className="flex-grow p-4 space-y-4">
            {isLoadingMessages ? (
              <p className="text-center text-sm text-neutral-500">
                Loading messages...
              </p>
            ) : (
              <>
                {currentMessages.map((message, i) => (
                  <ChatMessageItem
                    key={message.id ?? `msg-${currentChatId}-${i}`}
                    message={message}
                  />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </ScrollArea>
          <Separator className="my-0" />
          <div className="p-4 flex items-center">
            <Input
              className="flex-grow text-base mr-3"
              placeholder={
                isLoadingMessages
                  ? "Loading..."
                  : isSending
                    ? "Sending..."
                    : "Ask something..."
              }
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyUp={(e) => {
                if (e.key === "Enter" && !isSending && !isLoadingMessages) {
                  handleSendMessage();
                }
              }}
              disabled={isSending || isLoadingMessages}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isSending || isLoadingMessages || !inputMessage.trim()}
            >
              {isSending ? (
                "Sending..."
              ) : (
                <span className="flex items-center gap-2">
                  <Send size={16} /> Send
                </span>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

const ChatMessageItem = ({ message }: { message: Message }) => (
  <div
    className={cn("flex flex-col", {
      "items-end": message.role === "user",
      "items-start": message.role === "assistant",
    })}
  >
    <div
      className={cn("max-w-[75%] rounded-lg py-2 px-4 whitespace-pre-wrap", {
        "bg-indigo-600 text-white": message.role === "user",
        "bg-neutral-200 text-neutral-900": message.role === "assistant",
      })}
    >
      {message.content}
    </div>
  </div>
);
