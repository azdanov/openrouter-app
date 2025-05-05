import { getCompletion } from "@/app/server-actions/getCompletion";
import ChatDB from "@/db";
import { timeout } from "@/lib/utils";
import type { Message } from "@/types";
import { useState, useCallback, useEffect, useRef } from "react";

export function useChatMessages(chatId: number | null) {
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isUserMessageSent, setIsUserMessageSent] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async (id: number) => {
    setIsLoadingMessages(true);
    setCurrentMessages([]);
    try {
      const messages = await ChatDB.getMessages(id);
      await timeout();
      setCurrentMessages(messages);
    } catch (error) {
      console.error(`Failed to load messages for chat ${id}:`, error);
      setCurrentMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (chatId !== null) {
      loadMessages(chatId);
    } else {
      setCurrentMessages([]);
    }
  }, [chatId, loadMessages]);

  useEffect(() => {
    if (isUserMessageSent) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setIsUserMessageSent(false);
    }
  }, [isUserMessageSent]);

  const handleSendMessage = useCallback(async () => {
    if (!chatId || !inputMessage.trim() || isSending) {
      return;
    }

    const userMessageContent = inputMessage;
    setInputMessage("");
    setIsSending(true);
    setIsUserMessageSent(true);

    const userMsgData: Omit<Message, "id" | "chat_id"> = {
      role: "user",
      content: userMessageContent,
    };
    const tempUserMsg: Message = {
      ...userMsgData,
      chat_id: chatId,
      id: Date.now(),
    };
    setCurrentMessages((prev) => [...prev, tempUserMsg]);

    try {
      const savedUserMsg = await ChatDB.addMessage(chatId, userMsgData);
      setCurrentMessages((prev) =>
        prev.map((m) => (m.id === tempUserMsg.id ? (savedUserMsg ?? m) : m)),
      );

      const messagesForApi = [
        ...currentMessages.filter((m) => m.id !== tempUserMsg.id),
        savedUserMsg,
      ].filter((m): m is Message => m !== null);

      const assistantResponse = await getCompletion(messagesForApi);

      if (assistantResponse) {
        const tempAssistantMsg: Message = {
          ...assistantResponse,
          chat_id: chatId,
          id: Date.now(),
        };
        setCurrentMessages((prev) => [...prev, tempAssistantMsg]);

        const savedAssistantMsg = await ChatDB.addMessage(
          chatId,
          assistantResponse,
        );
        setCurrentMessages((prev) =>
          prev.map((m) =>
            m.id === tempAssistantMsg.id ? (savedAssistantMsg ?? m) : m,
          ),
        );
      } else {
        console.warn("API did not return a response.");
        setCurrentMessages((prev) =>
          prev.filter((m) => m.id !== tempUserMsg.id),
        );
      }
    } catch (error) {
      console.error("Failed to send message or get completion:", error);
      const errorMsg: Message = {
        role: "assistant",
        content: `Error: Could not get response. ${error instanceof Error ? error.message : "Unknown error"}`,
        chat_id: chatId,
        id: Date.now(),
      };
      setCurrentMessages((prev) => [...prev, errorMsg]);
      setCurrentMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setIsSending(false);
      setIsUserMessageSent(true);
    }
  }, [chatId, inputMessage, isSending, currentMessages]);

  return {
    currentMessages,
    isLoadingMessages,
    isSending,
    inputMessage,
    setInputMessage,
    handleSendMessage,
    messagesEndRef,
  };
}
