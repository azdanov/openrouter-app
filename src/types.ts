export interface Message {
  id?: number;
  chat_id: number;
  role: "user" | "assistant";
  content: string;
}

export type CompletionMessage = Omit<Message, "id" | "chat_id">;

export interface Chat {
  id?: number;
  user_email: string;
  name: string;
  timestamp: string;
}

export interface ChatWithMessages extends Chat {
  id: number;
  messages: Message[];
}
