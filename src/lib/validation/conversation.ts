import type {
  Message,
  MessageRole,
  ConversationStatus,
  CreateConversationInput,
  UpdateConversationInput,
} from "@/types/conversation";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

const VALID_ROLES: MessageRole[] = ["user", "assistant"];
const VALID_STATUSES: ConversationStatus[] = ["active", "flagged", "archived"];

function validateMessages(value: unknown): Message[] {
  if (!Array.isArray(value)) {
    throw new ValidationError("messages must be an array.");
  }
  if (value.length === 0) {
    throw new ValidationError("messages must contain at least one message.");
  }

  return value.map((raw, index) => {
    if (typeof raw !== "object" || raw === null) {
      throw new ValidationError(`messages[${index}] must be an object.`);
    }
    const msg = raw as Record<string, unknown>;

    if (typeof msg.role !== "string" || !VALID_ROLES.includes(msg.role as MessageRole)) {
      throw new ValidationError(
        `messages[${index}].role must be "user" or "assistant".`
      );
    }
    if (typeof msg.content !== "string") {
      throw new ValidationError(`messages[${index}].content must be a string.`);
    }
    if (msg.content.trim().length === 0) {
      throw new ValidationError(`messages[${index}].content must not be empty.`);
    }

    return { role: msg.role as MessageRole, content: msg.content };
  });
}

function validateStatus(value: unknown): ConversationStatus {
  if (typeof value !== "string" || !VALID_STATUSES.includes(value as ConversationStatus)) {
    throw new ValidationError('status must be one of: active, flagged, archived.');
  }
  return value as ConversationStatus;
}

export function validateCreateInput(body: unknown): CreateConversationInput {
  if (typeof body !== "object" || body === null) {
    throw new ValidationError("Request body must be a JSON object.");
  }
  const b = body as Record<string, unknown>;

  const messages = validateMessages(b.messages);
  const status = b.status === undefined ? "active" : validateStatus(b.status);

  return { messages, status };
}

export function validateUpdateInput(body: unknown): UpdateConversationInput {
  if (typeof body !== "object" || body === null) {
    throw new ValidationError("Request body must be a JSON object.");
  }
  const b = body as Record<string, unknown>;

  if (b.createdAt !== undefined) {
    throw new ValidationError("createdAt cannot be modified by the client.");
  }
  if (b.id !== undefined) {
    throw new ValidationError("id cannot be modified.");
  }
  if (b.type !== undefined && b.type !== "conversation") {
    throw new ValidationError('type must be "conversation".');
  }

  const update: UpdateConversationInput = {};
  if (b.messages !== undefined) {
    update.messages = validateMessages(b.messages);
  }
  if (b.status !== undefined) {
    update.status = validateStatus(b.status);
  }

  if (update.messages === undefined && update.status === undefined) {
    throw new ValidationError("Provide at least one of: messages, status.");
  }

  return update;
}
