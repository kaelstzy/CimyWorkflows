export type MessageRole = "user" | "assistant";

export interface Message {
  role: MessageRole;
  content: string;
}

export type ConversationStatus = "active" | "flagged" | "archived";

export interface Conversation {
  id: string;
  type: "conversation";
  status: ConversationStatus;
  messages: Message[];
  createdAt: unknown; // Firestore Timestamp on the server, ISO string once serialized to the client
  updatedAt: unknown;
}

export interface CreateConversationInput {
  messages: Message[];
  status?: ConversationStatus;
}

export interface UpdateConversationInput {
  messages?: Message[];
  status?: ConversationStatus;
}
