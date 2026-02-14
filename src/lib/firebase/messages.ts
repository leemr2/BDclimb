"use client";

import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  limit,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./client";

export interface Message {
  id: string;
  userId: string;
  displayName: string;
  message: string;
  createdAt: Timestamp;
}

/**
 * Send a message to the chat
 */
export const sendMessage = async (
  userId: string,
  displayName: string,
  message: string
): Promise<void> => {
  if (!message.trim()) {
    throw new Error("Message cannot be empty");
  }

  const messagesRef = collection(db, "messages");
  await addDoc(messagesRef, {
    userId,
    displayName,
    message: message.trim(),
    createdAt: Timestamp.now(),
  });
};

/**
 * Delete a message (only the author can delete their own messages)
 */
export const deleteMessage = async (messageId: string): Promise<void> => {
  const messageRef = doc(db, "messages", messageId);
  await deleteDoc(messageRef);
};

/**
 * Subscribe to messages with real-time updates
 */
export const subscribeToMessages = (
  callback: (messages: Message[]) => void,
  messageLimit: number = 100
): Unsubscribe => {
  const messagesRef = collection(db, "messages");
  const q = query(messagesRef, orderBy("createdAt", "desc"), limit(messageLimit));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages: Message[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      // Reverse to show oldest first (for chat display)
      callback(messages.reverse());
    },
    (error) => {
      console.error("Error subscribing to messages:", error);
    }
  );
};

/**
 * Format timestamp for display
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
