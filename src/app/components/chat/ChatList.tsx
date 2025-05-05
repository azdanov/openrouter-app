import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Chat } from "@/types";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Plus, Trash2 } from "lucide-react";

interface ChatListProps {
  chats: Chat[];
  isLoadingChats: boolean;
  currentChatId: number | null;
  handleCreateChat: () => Promise<number | undefined>;
  handleDeleteChat: (chatId?: number) => void;
  handleSelectChat: (chatId?: number) => void;
}

export const ChatList = ({
  chats,
  isLoadingChats,
  currentChatId,
  handleCreateChat,
  handleDeleteChat,
  handleSelectChat,
}: ChatListProps) => {
  return (
    <div className="w-1/4 border-r flex flex-col">
      <div className="p-2 border-b">
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
      <ScrollArea className="flex-grow p-2">
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
      </ScrollArea>
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
