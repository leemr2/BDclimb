"use client";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  setDoc,
  writeBatch,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./client";

export interface Conversation {
  id: string;
  title: string;
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ConversationMessage {
  id: string;
  userId: string;
  displayName: string;
  message: string;
  createdAt: Timestamp;
}

const CONVERSATIONS_COLLECTION = "conversations";
const MESSAGES_SUBCOLLECTION = "messages";
const CONVERSATIONS_LIMIT = 50;
const MESSAGES_LIMIT = 200;

/**
 * Create a new conversation with an optional first message
 */
export const createConversation = async (
  userId: string,
  displayName: string,
  title: string,
  firstMessage?: string
): Promise<string> => {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    throw new Error("Conversation title cannot be empty");
  }

  const now = Timestamp.now();
  const conversationsRef = collection(db, CONVERSATIONS_COLLECTION);
  const conversationRef = doc(conversationsRef);

  if (firstMessage?.trim()) {
    const batch = writeBatch(db);
    batch.set(conversationRef, {
      title: trimmedTitle,
      createdBy: userId,
      createdByName: displayName,
      createdAt: now,
      updatedAt: now,
    });
    const messagesRef = collection(
      db,
      CONVERSATIONS_COLLECTION,
      conversationRef.id,
      MESSAGES_SUBCOLLECTION
    );
    const firstMsgRef = doc(messagesRef);
    batch.set(firstMsgRef, {
      userId,
      displayName,
      message: firstMessage.trim(),
      createdAt: now,
    });
    await batch.commit();
    return conversationRef.id;
  }

  await setDoc(conversationRef, {
    title: trimmedTitle,
    createdBy: userId,
    createdByName: displayName,
    createdAt: now,
    updatedAt: now,
  });
  return conversationRef.id;
};

/**
 * Subscribe to the list of conversations (most recent first)
 */
export const subscribeToConversations = (
  callback: (conversations: Conversation[]) => void
): Unsubscribe => {
  const conversationsRef = collection(db, CONVERSATIONS_COLLECTION);
  const q = query(
    conversationsRef,
    orderBy("updatedAt", "desc"),
    limit(CONVERSATIONS_LIMIT)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const conversations: Conversation[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Conversation[];
      callback(conversations);
    },
    (error) => {
      console.error("Error subscribing to conversations:", error);
    }
  );
};

/**
 * Get a single conversation by ID
 */
export const getConversation = async (
  conversationId: string
): Promise<Conversation | null> => {
  const ref = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Conversation;
};

/**
 * Subscribe to messages in a conversation (chronological order for display)
 */
export const subscribeToConversationMessages = (
  conversationId: string,
  callback: (messages: ConversationMessage[]) => void
): Unsubscribe => {
  const messagesRef = collection(
    db,
    CONVERSATIONS_COLLECTION,
    conversationId,
    MESSAGES_SUBCOLLECTION
  );
  const q = query(
    messagesRef,
    orderBy("createdAt", "desc"),
    limit(MESSAGES_LIMIT)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const messages: ConversationMessage[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as ConversationMessage[];
      callback(messages.reverse());
    },
    (error) => {
      console.error("Error subscribing to conversation messages:", error);
    }
  );
};

/**
 * Add a reply to a conversation and bump its updatedAt
 */
export const sendReply = async (
  conversationId: string,
  userId: string,
  displayName: string,
  message: string
): Promise<void> => {
  if (!message.trim()) {
    throw new Error("Message cannot be empty");
  }

  const now = Timestamp.now();
  const batch = writeBatch(db);

  const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  batch.update(conversationRef, { updatedAt: now });

  const messagesRef = collection(
    db,
    CONVERSATIONS_COLLECTION,
    conversationId,
    MESSAGES_SUBCOLLECTION
  );
  const messageRef = doc(messagesRef);
  batch.set(messageRef, {
    userId,
    displayName,
    message: message.trim(),
    createdAt: now,
  });

  await batch.commit();
};

/**
 * Delete a message within a conversation (only author can delete)
 */
export const deleteConversationMessage = async (
  conversationId: string,
  messageId: string
): Promise<void> => {
  const messageRef = doc(
    db,
    CONVERSATIONS_COLLECTION,
    conversationId,
    MESSAGES_SUBCOLLECTION,
    messageId
  );
  await deleteDoc(messageRef);
};

/**
 * Format timestamp for display (reuse same logic as flat messages)
 */
export const formatMessageTime = (timestamp: Timestamp): string => {
  const date = timestamp.toDate();
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return "just now";
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return "yesterday";
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
};
