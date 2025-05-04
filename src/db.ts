import type { Chat, ChatWithMessages, Message } from "@/types";
import { openDB, DBSchema, IDBPDatabase } from "idb";

const DB_VERSION = 1; // Increment if you change the schema
const DB_NAME = "OpenRouterChatDB";
const CHATS_STORE_NAME = "chats";
const MESSAGES_STORE_NAME = "messages";

interface ChatAppDBSchema extends DBSchema {
  [CHATS_STORE_NAME]: {
    key: number;
    value: Chat;
    indexes: { by_user_email: string; by_timestamp: string };
  };
  [MESSAGES_STORE_NAME]: {
    key: number;
    value: Message;
    indexes: { by_chat_id: number };
  };
}

let dbPromise: Promise<IDBPDatabase<ChatAppDBSchema>> | null = null;

function getDb(): Promise<IDBPDatabase<ChatAppDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<ChatAppDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`Upgrading DB from version ${oldVersion} to ${newVersion}`);

        if (!db.objectStoreNames.contains(CHATS_STORE_NAME)) {
          const chatStore = db.createObjectStore(CHATS_STORE_NAME, {
            keyPath: "id",
            autoIncrement: true,
          });
          chatStore.createIndex("by_user_email", "user_email");
          chatStore.createIndex("by_timestamp", "timestamp");
        } else {
          const chatStore = transaction.objectStore(CHATS_STORE_NAME);
          if (!chatStore.indexNames.contains("by_user_email")) {
            chatStore.createIndex("by_user_email", "user_email");
          }
          if (!chatStore.indexNames.contains("by_timestamp")) {
            chatStore.createIndex("by_timestamp", "timestamp");
          }
        }

        if (!db.objectStoreNames.contains(MESSAGES_STORE_NAME)) {
          const messageStore = db.createObjectStore(MESSAGES_STORE_NAME, {
            keyPath: "id",
            autoIncrement: true,
          });
          messageStore.createIndex("by_chat_id", "chat_id");
        } else {
          const messageStore = transaction.objectStore(MESSAGES_STORE_NAME);
          if (!messageStore.indexNames.contains("by_chat_id")) {
            messageStore.createIndex("by_chat_id", "chat_id");
          }
        }
      },
    });
  }
  return dbPromise;
}

export async function getChat(
  chatId: number,
): Promise<ChatWithMessages | null> {
  const db = await getDb();
  const tx = db.transaction(
    [CHATS_STORE_NAME, MESSAGES_STORE_NAME],
    "readonly",
  );
  const chatStore = tx.objectStore(CHATS_STORE_NAME);
  const messageStore = tx.objectStore(MESSAGES_STORE_NAME);
  const messageIndex = messageStore.index("by_chat_id");

  const chat = await chatStore.get(chatId);
  if (!chat || chat.id === undefined) {
    await tx.done;
    return null;
  }

  const messages = await messageIndex.getAll(chatId);
  await tx.done;

  return {
    ...chat,
    id: chat.id,
    messages: messages,
  };
}

export async function getChats(userEmail: string): Promise<Chat[]> {
  const db = await getDb();
  const tx = db.transaction(CHATS_STORE_NAME, "readonly");
  const store = tx.objectStore(CHATS_STORE_NAME);
  const index = store.index("by_user_email");
  const chats = await index.getAll(userEmail);
  await tx.done;
  return chats.filter((chat) => chat.id !== undefined) as Required<Chat>[];
}

export async function createChat(
  userEmail: string,
  name: string,
  initialMsgs: Omit<Message, "id" | "chat_id">[],
): Promise<number> {
  const db = await getDb();
  const tx = db.transaction(
    [CHATS_STORE_NAME, MESSAGES_STORE_NAME],
    "readwrite",
  );
  const chatStore = tx.objectStore(CHATS_STORE_NAME);
  const messageStore = tx.objectStore(MESSAGES_STORE_NAME);

  const timestamp = new Date().toISOString();
  const newChatData: Omit<Chat, "id"> = {
    user_email: userEmail,
    name: name,
    timestamp: timestamp,
  };

  const newChatId = await chatStore.add(newChatData as Chat);

  const messagePromises = initialMsgs.map((msg) => {
    const messageData: Message = {
      ...msg,
      chat_id: newChatId,
    };
    return messageStore.add(messageData);
  });

  await Promise.all(messagePromises);
  await tx.done;

  return newChatId;
}

export async function getChatsWithMessages(
  userEmail: string,
): Promise<ChatWithMessages[]> {
  const db = await getDb();
  const tx = db.transaction(
    [CHATS_STORE_NAME, MESSAGES_STORE_NAME],
    "readonly",
  );
  const chatStore = tx.objectStore(CHATS_STORE_NAME);
  const messageStore = tx.objectStore(MESSAGES_STORE_NAME);
  const chatIndex = chatStore.index("by_user_email");
  const messageIndex = messageStore.index("by_chat_id");

  const userChats = await chatIndex.getAll(userEmail);

  userChats.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  const recentChats = userChats.slice(0, 3);

  const chatsWithMessagesPromises = recentChats.map(async (chat) => {
    if (chat.id === undefined) return null;
    const messages = await messageIndex.getAll(chat.id);
    return {
      ...chat,
      id: chat.id,
      messages: messages,
    };
  });

  const results = await Promise.all(chatsWithMessagesPromises);
  await tx.done;

  return results.filter((c) => c !== null) as ChatWithMessages[];
}

export async function getMessages(chatId: number): Promise<Message[]> {
  const db = await getDb();
  const tx = db.transaction(MESSAGES_STORE_NAME, "readonly");
  const store = tx.objectStore(MESSAGES_STORE_NAME);
  const index = store.index("by_chat_id");
  const messages = await index.getAll(chatId);
  await tx.done;
  return messages;
}

export async function addMessage(
  chatId: number,
  newMessage: Omit<Message, "id" | "chat_id">,
): Promise<Message | null> {
  const db = await getDb();
  const tx = db.transaction(
    [CHATS_STORE_NAME, MESSAGES_STORE_NAME],
    "readwrite",
  );
  const chatStore = tx.objectStore(CHATS_STORE_NAME);
  const messageStore = tx.objectStore(MESSAGES_STORE_NAME);

  const chat = await chatStore.get(chatId);
  if (!chat) {
    console.error(`Chat with id ${chatId} not found.`);
    tx.abort();
    return null;
  }

  const messageData: Message = {
    ...newMessage,
    chat_id: chatId,
  };
  const messageId = await messageStore.add(messageData);

  const updatedChat: Chat = {
    ...chat,
    timestamp: new Date().toISOString(),
  };
  await chatStore.put(updatedChat);

  await tx.done;

  return { ...messageData, id: messageId };
}

export async function updateChatMessages(
  chatId: number,
  newMsgs: Omit<Message, "id" | "chat_id">[],
): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(
    [CHATS_STORE_NAME, MESSAGES_STORE_NAME],
    "readwrite",
  );
  const chatStore = tx.objectStore(CHATS_STORE_NAME);
  const messageStore = tx.objectStore(MESSAGES_STORE_NAME);
  const messageIndex = messageStore.index("by_chat_id");

  const chat = await chatStore.get(chatId);
  if (!chat) {
    console.warn(
      `Attempted to update messages for non-existent chat ID: ${chatId}`,
    );
    tx.abort();
    return;
  }

  let cursor = await messageIndex.openCursor(chatId);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }

  const addPromises = newMsgs.map((msg) => {
    const messageData: Message = {
      ...msg,
      chat_id: chatId,
    };
    return messageStore.add(messageData);
  });
  await Promise.all(addPromises);

  const updatedChat: Chat = {
    ...chat,
    timestamp: new Date().toISOString(),
  };
  await chatStore.put(updatedChat);

  await tx.done;
}

export async function deleteChat(chatId: number): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(
    [CHATS_STORE_NAME, MESSAGES_STORE_NAME],
    "readwrite",
  );
  const chatStore = tx.objectStore(CHATS_STORE_NAME);
  const messageStore = tx.objectStore(MESSAGES_STORE_NAME);
  const messageIndex = messageStore.index("by_chat_id");

  let cursor = await messageIndex.openCursor(chatId);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }

  await chatStore.delete(chatId);

  await tx.done;
}
