"use client";

import { getCompletion } from "../server-actions/getCompletion";
import ChatDB from "@/db";
import { timeout } from "@/lib/utils";
import type { Chat, Message } from "@/types";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";

interface ChatContextType {
  // Chat list state
  chats: Chat[];
  isLoadingChats: boolean;
  currentChatId: number | null;

  // Messages state
  currentMessages: Message[];
  isLoadingMessages: boolean;
  isSending: boolean;
  inputMessage: string;

  // Actions
  setInputMessage: (message: string) => void;
  handleSendMessage: () => Promise<void>;
  handleCreateChat: () => Promise<number | undefined>;
  handleDeleteChat: (chatId?: number) => Promise<void>;
  handleSelectChat: (chatId?: number) => void;
  loadChats: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({
  children,
  userEmail,
}: {
  children: ReactNode;
  userEmail: string;
}) {
  // Chat list state
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [isLoadingChats, setIsLoadingChats] = useState(true);

  // Messages state
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [inputMessage, setInputMessage] = useState("");

  const loadChats = useCallback(async () => {
    setIsLoadingChats(true);
    try {
      const userChats = await ChatDB.getChats(userEmail);
      userChats.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      await timeout();
      setChats(userChats);
    } catch (error) {
      console.error("Failed to load chats:", error);
      setChats([]);
    } finally {
      setIsLoadingChats(false);
    }
  }, [userEmail]);

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
    loadChats();
  }, [loadChats]);

  useEffect(() => {
    if (currentChatId !== null) {
      loadMessages(currentChatId);
    } else {
      setCurrentMessages([]);
    }
  }, [currentChatId, loadMessages]);

  const handleSelectChat = useCallback(
    (chatId?: number) => {
      setCurrentMessages([]);
      if (chatId !== undefined && chatId !== currentChatId) {
        setCurrentChatId(chatId);
      } else if (chatId === undefined) {
        setCurrentChatId(null);
      }
    },
    [currentChatId],
  );

  const handleCreateChat = useCallback(async () => {
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
      return newId;
    } catch (error) {
      console.error("Failed to create chat:", error);
      setIsLoadingChats(false);
    }
  }, [userEmail, loadChats]);

  const handleDeleteChat = useCallback(
    async (chatIdToDelete?: number) => {
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
          setIsLoadingChats(false);
        }
      }
    },
    [chats, currentChatId, loadChats],
  );

  const handleSendMessage = useCallback(async () => {
    if (!currentChatId || !inputMessage.trim() || isSending) {
      return;
    }

    const userMessageContent = inputMessage;
    setInputMessage("");
    setIsSending(true);

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

    try {
      const savedUserMsg = await ChatDB.addMessage(currentChatId, userMsgData);
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
          chat_id: currentChatId,
          id: Date.now(),
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
        setCurrentMessages((prev) =>
          prev.filter((m) => m.id !== tempUserMsg.id),
        );
      }
    } catch (error) {
      console.error("Failed to send message or get completion:", error);
      const errorMsg: Message = {
        role: "assistant",
        content: `Error: Could not get response. ${error instanceof Error ? error.message : "Unknown error"}`,
        chat_id: currentChatId,
        id: Date.now(),
      };
      setCurrentMessages((prev) => [...prev, errorMsg]);
      setCurrentMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setIsSending(false);
    }
  }, [currentChatId, inputMessage, isSending, currentMessages]);

  return (
    <ChatContext.Provider
      value={{
        // Chat list state
        chats,
        isLoadingChats,
        currentChatId,

        // Messages state
        currentMessages,
        isLoadingMessages,
        isSending,
        inputMessage,

        // Actions
        setInputMessage,
        handleSendMessage,
        handleCreateChat,
        handleDeleteChat,
        handleSelectChat,
        loadChats,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}
