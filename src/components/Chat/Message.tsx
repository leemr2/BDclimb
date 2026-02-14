"use client";

import { Message as MessageType, formatMessageTime } from "@/lib/firebase/messages";
import { deleteMessage } from "@/lib/firebase/messages";

interface MessageProps {
  message: MessageType;
  currentUserId: string;
}

export const Message = ({ message, currentUserId }: MessageProps) => {
  const isOwnMessage = message.userId === currentUserId;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this message?")) {
      return;
    }

    try {
      await deleteMessage(message.id);
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Failed to delete message. Please try again.");
    }
  };

  return (
    <div className={`message ${isOwnMessage ? "own-message" : ""}`}>
      <div className="message-header">
        <span className="message-author">{message.displayName}</span>
        <span className="message-time">
          {formatMessageTime(message.createdAt)}
        </span>
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
