"use client";

import { getCompletion } from "@/app/server-actions/getCompletion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import * as ChatDB from "@/db";
import { cn } from "@/lib/utils";
import type { Chat, Message } from "@/types";
import { Trash2, Send, Plus } from "lucide-react";
import React, { useState, useEffect, useCallback, useRef } from "react";

interface ChatClientComponentProps {
  userEmail: string;
}

export default function Chat({ userEmail }: ChatClientComponentProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadChats = useCallback(async () => {
    setIsLoadingChats(true);
    try {
      const userChats = await ChatDB.getChats(userEmail);
      userChats.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      setChats(userChats);
    } catch (error) {
      console.error("Failed to load chats:", error);
    } finally {
      setIsLoadingChats(false);
    }
  }, [userEmail]);

  const loadMessages = useCallback(async (chatId: number) => {
    setIsLoadingMessages(true);
    try {
      const messages = await ChatDB.getMessages(chatId);
      setCurrentMessages(messages);
    } catch (error) {
      console.error(`Failed to load messages for chat ${chatId}:`, error);
      setCurrentMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  useEffect(() => {
    if (currentChatId === null) {
      setCurrentMessages([]);
      return;
    }

    loadMessages(currentChatId);
  }, [currentChatId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  const handleSelectChat = (chatId: number | undefined) => {
    if (chatId !== undefined) {
      setCurrentChatId(chatId);
    }
  };

  const handleCreateChat = async () => {
    const newChatName = prompt(
      "Enter a name for the new chat:",
      `Chat ${new Date().toLocaleTimeString()}`,
    );
    if (!newChatName) return;

    setIsLoadingChats(true);
    try {
      const newId = await ChatDB.createChat(userEmail, newChatName, []);
      await loadChats();
      setCurrentChatId(newId);
    } catch (error) {
      console.error("Failed to create chat:", error);
    } finally {
      setIsLoadingChats(false);
    }
  };

  const handleDeleteChat = async (chatIdToDelete: number | undefined) => {
    if (chatIdToDelete === undefined) return;

    const chatToDelete = chats.find((c) => c.id === chatIdToDelete);
    if (!chatToDelete) return;

    if (
      confirm(
        `Are you sure you want to delete chat "${chatToDelete.name}"? This cannot be undone.`,
      )
    ) {
      setIsLoadingChats(true);
      try {
        await ChatDB.deleteChat(chatIdToDelete);
        if (currentChatId === chatIdToDelete) {
          setCurrentChatId(null);
        }
        await loadChats();
      } catch (error) {
        console.error("Failed to delete chat:", error);
      } finally {
        setIsLoadingChats(false);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!currentChatId || !inputMessage.trim() || isSending) {
      return;
    }

    setIsSending(true);
    const userMessageContent = inputMessage;
    setInputMessage("");

    try {
      const userMsgData: Omit<Message, "id" | "chat_id"> = {
        role: "user",
        content: userMessageContent,
      };
      const tempUserMsg: Message = {
        ...userMsgData,
        chat_id: currentChatId,
        id: Date.now(),
      };
      setCurrentMessages((prev) => [...prev, tempUserMsg]);

      const savedUserMsg = await ChatDB.addMessage(currentChatId, userMsgData);
      setCurrentMessages((prev) =>
        prev.map((m) => (m.id === tempUserMsg.id ? (savedUserMsg ?? m) : m)),
      );

      const messagesForApi = [
        ...currentMessages.filter((m) => m.id !== tempUserMsg.id),
        savedUserMsg,
      ].filter((m) => m !== null) as Message[];

      const assistantResponse = await getCompletion(messagesForApi);

      if (assistantResponse) {
        const tempAssistantMsg: Message = {
          ...assistantResponse,
          chat_id: currentChatId,
          id: Date.now() + 1,
        };
        setCurrentMessages((prev) => [...prev, tempAssistantMsg]);

        const savedAssistantMsg = await ChatDB.addMessage(
          currentChatId,
          assistantResponse,
        );
        setCurrentMessages((prev) =>
          prev.map((m) =>
            m.id === tempAssistantMsg.id ? (savedAssistantMsg ?? m) : m,
          ),
        );
      } else {
        console.warn("API did not return a response.");
      }
    } catch (error) {
      console.error("Failed to send message or get completion:", error);
      const errorMsg: Message = {
        role: "assistant",
        content: `Error: Could not get response. ${error instanceof Error ? error.message : "Unknown error"}`,
        chat_id: currentChatId,
        id: Date.now() + 2,
      };
      setCurrentMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
      await loadMessages(currentChatId);
    }
  };

  return (
    <div className="flex flex-1 border rounded-md">
      <div className="w-1/4 border-r flex flex-col">
        <div className="p-2 border-b">
          <Button
            onClick={handleCreateChat}
            className="w-full"
            disabled={isLoadingChats}
          >
            {isLoadingChats ? (
              "Loading..."
            ) : (
              <span className="flex items-center gap-2">
                <Plus size={16} /> New Chat
              </span>
            )}
          </Button>
        </div>
        <ScrollArea className="flex-grow p-2">
          {isLoadingChats && (
            <p className="text-center text-sm text-neutral-500">
              Loading chats...
            </p>
          )}
          {!isLoadingChats && chats.length === 0 && (
            <p className="text-center text-sm text-neutral-500">
              No chats yet.
            </p>
          )}
          <ul>
            {chats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === currentChatId}
                onSelect={() => handleSelectChat(chat.id)}
                onDelete={() => handleDeleteChat(chat.id)}
                isLoading={isLoadingChats}
              />
            ))}
          </ul>
        </ScrollArea>
      </div>
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
                    <ChatMessage
                      key={message.id ?? `msg-${i}`}
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
                  isLoadingMessages ? "Loading..." : "Ask something..."
                }
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyUp={(e) => {
                  if (e.key === "Enter" && !isSending) {
                    handleSendMessage();
                  }
                }}
                disabled={isSending || isLoadingMessages}
              />
              <Button
                onClick={handleSendMessage}
                disabled={
                  isSending || isLoadingMessages || !inputMessage.trim()
                }
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
    </div>
  );
}

const ChatMessage = ({ message }: { message: Message }) => (
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

const ChatListItem = ({
  chat,
  isActive,
  onSelect,
  onDelete,
  isLoading,
}: {
  chat: Chat;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  isLoading: boolean;
}) => (
  <li
    className={cn(
      "p-2 mb-1 rounded cursor-pointer hover:bg-gray-100 flex justify-between items-center",
      { "bg-indigo-100": isActive },
    )}
    onClick={onSelect}
  >
    <span className="truncate flex-grow mr-2">{chat.name}</span>
    <Button
      variant="ghost"
      size="sm"
      className="text-red-500 hover:text-red-700 hover:bg-red-100 p-1 h-auto"
      onClick={(e) => {
        e.stopPropagation();
        onDelete();
      }}
      disabled={isLoading}
      title="Delete chat"
    >
      <Trash2 size={16} />
    </Button>
  </li>
);
