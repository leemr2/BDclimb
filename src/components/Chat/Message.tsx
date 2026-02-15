"use client";

import type { Timestamp } from "firebase/firestore";
import { deleteConversationMessage } from "@/lib/firebase/conversations";
import type { ConversationMessage } from "@/lib/firebase/conversations";

interface MessageProps {
  message: ConversationMessage;
  conversationId: string;
  currentUserId: string;
  formatTime: (createdAt: Timestamp) => string;
}

export const Message = ({
  message,
  conversationId,
  currentUserId,
  formatTime,
}: MessageProps) => {
  const isOwnMessage = message.userId === currentUserId;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    try {
      await deleteConversationMessage(conversationId, message.id);
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Failed to delete message. Please try again.");
    }
  };

  return (
    <div className={`message ${isOwnMessage ? "own-message" : ""}`}>
      <div className="message-header">
        <span className="message-author">{message.displayName}</span>
        <span className="message-time">{formatTime(message.createdAt)}</span>
        {isOwnMessage && (
          <button
            onClick={handleDelete}
            className="message-delete"
            aria-label="Delete message"
          >
            ×
          </button>
        )}
      </div>
      <div className="message-content">{message.message}</div>
    </div>
  );
};
