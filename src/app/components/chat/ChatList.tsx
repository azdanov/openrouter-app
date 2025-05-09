"use client";

import { useChatContext } from "@/app/context/ChatContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Chat } from "@/types";
import { Plus, Trash2 } from "lucide-react";

export const ChatList = () => {
  const {
    chats,
    isLoadingChats,
    currentChatId,
    handleSelectChat,
    handleCreateChat,
    handleDeleteChat,
  } = useChatContext();

  return (
    <div className="flex flex-col">
      <div className="border-b p-2">
        <Button
          onClick={async () => {
            const newId = await handleCreateChat();
            if (newId) {
              window.history.replaceState(null, "", `/chats/${newId}`);
            }
          }}
          className="w-full"
          disabled={isLoadingChats}
        >
          {isLoadingChats && !chats.length ? (
            "Loading..."
          ) : (
            <span className="flex items-center gap-2">
              <Plus size={16} /> New Chat
            </span>
          )}
        </Button>
      </div>
      <div className="flex-grow p-2">
        {isLoadingChats && chats.length === 0 && (
          <p className="text-center text-sm text-neutral-500">
            Loading chats...
          </p>
        )}
        {!isLoadingChats && chats.length === 0 && (
          <p className="text-center text-sm text-neutral-500">
            No chats yet. Create one!
          </p>
        )}
        <ul>
          {chats.map((chat) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              isActive={chat.id === currentChatId}
              onSelect={() => {
                handleSelectChat(chat.id);
                window.history.replaceState(null, "", `/chats/${chat.id}`);
              }}
              onDelete={() => {
                handleDeleteChat(chat.id);
                if (currentChatId === chat.id) {
                  handleSelectChat();
                  window.history.replaceState(null, "", "/");
                }
              }}
              isLoading={isLoadingChats}
            />
          ))}
        </ul>
      </div>
    </div>
  );
};

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
      "mb-1 flex cursor-pointer items-center justify-between rounded p-2 hover:bg-gray-100",
      { "bg-indigo-100": isActive },
    )}
    onClick={onSelect}
  >
    <span className="mr-2 flex-grow truncate">{chat.name}</span>
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-1 text-red-500 hover:bg-red-100 hover:text-red-700"
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
