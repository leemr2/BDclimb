"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/firebase/auth";
import { getUserProfile } from "@/lib/firebase/users";
import {
  subscribeToMessages,
  sendMessage,
  type Message as MessageType,
} from "@/lib/firebase/messages";
import { Message } from "./Message";

export const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const [displayName, setDisplayName] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get user's display name
  useEffect(() => {
    const fetchDisplayName = async () => {
      if (!user) return;

      try {
        const profile = await getUserProfile(user.uid);
        if (profile) {
          setDisplayName(profile.displayName);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchDisplayName();
  }, [user]);

  // Subscribe to messages
  useEffect(() => {
    const unsubscribe = subscribeToMessages((newMessages) => {
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !displayName || !messageInput.trim() || sending) {
      return;
    }

    setSending(true);
    try {
      await sendMessage(user.uid, displayName, messageInput);
      setMessageInput("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Community Chat</h2>
      </div>
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((message) => (
            <Message
              key={message.id}
              message={message}
              currentUserId={user?.uid || ""}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type a message..."
          disabled={sending || !displayName}
          className="chat-input"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={sending || !messageInput.trim() || !displayName}
          className="chat-send-button"
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
};
