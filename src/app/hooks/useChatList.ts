import ChatDB from "@/db";
import { timeout } from "@/lib/utils";
import type { Chat } from "@/types";
import { useState, useCallback, useEffect } from "react";

export function useChatList(userEmail: string, initialChatId: number | null) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<number | null>(
    initialChatId,
  );
  const [isLoadingChats, setIsLoadingChats] = useState(true);

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

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  useEffect(() => {
    setCurrentChatId(initialChatId);
  }, [initialChatId]);

  const handleSelectChat = useCallback(
    (chatId?: number) => {
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
    async (chatIdToDelete: number | undefined) => {
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

  return {
    chats,
    isLoadingChats,
    currentChatId,
    handleCreateChat,
    handleDeleteChat,
    handleSelectChat,
    loadChats,
  };
}
