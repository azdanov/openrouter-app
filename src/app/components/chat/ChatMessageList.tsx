"use client";

import { useChatContext } from "@/app/context/ChatContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Message } from "@/types";
import { Send } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

export const ChatMessageList = () => {
  const {
    currentChatId,
    currentMessages,
    isLoadingMessages,
    isSending,
    inputMessage,
    setInputMessage,
    handleSendMessage,
  } = useChatContext();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isUserMessageSent, setIsUserMessageSent] = useState(false);

  useLayoutEffect(() => {
    if (isUserMessageSent && !isSending) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setIsUserMessageSent(false);
    }
  }, [isSending, isUserMessageSent]);

  return (
    <div className="flex flex-col">
      {currentChatId === null ? (
        <div className="flex flex-grow items-center justify-center text-neutral-500">
          Select a chat or create a new one to start messaging.
        </div>
      ) : (
        <>
          <div className="flex-grow space-y-4 p-4">
            {isLoadingMessages ? (
              <p className="text-center text-sm text-neutral-500">
                Loading messages...
              </p>
            ) : (
              <>
                {currentMessages.map((message) => (
                  <ChatMessageItem
                    key={`${currentChatId}-${message.id}`}
                    message={message}
                  />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
          <Separator className="my-0" />
          <div className="flex items-center p-4">
            <Input
              className="mr-3 flex-grow text-base"
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
                  setIsUserMessageSent(true);
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
      className={cn("max-w-[75%] rounded-lg px-4 py-2 whitespace-pre-wrap", {
        "bg-indigo-600 text-white": message.role === "user",
        "bg-neutral-200 text-neutral-900": message.role === "assistant",
      })}
    >
      {message.content}
    </div>
  </div>
);
