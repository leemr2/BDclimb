"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/firebase/auth";
import { getUserProfile } from "@/lib/firebase/users";
import {
  subscribeToConversations,
  subscribeToConversationMessages,
  createConversation,
  sendReply,
  formatMessageTime,
  type Conversation,
  type ConversationMessage,
} from "@/lib/firebase/conversations";
import { Message } from "./Message";

export const Chat = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [replyInput, setReplyInput] = useState("");
  const [sending, setSending] = useState(false);
  const [displayName, setDisplayName] = useState<string>("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newFirstMessage, setNewFirstMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get user's display name
  useEffect(() => {
    const fetchDisplayName = async () => {
      if (!user) return;
      try {
        const profile = await getUserProfile(user.uid);
        if (profile) setDisplayName(profile.displayName);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };
    fetchDisplayName();
  }, [user]);

  // Subscribe to conversation list (most recent first)
  useEffect(() => {
    const unsubscribe = subscribeToConversations(setConversations);
    return () => unsubscribe();
  }, []);

  // Subscribe to messages for selected conversation
  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    const unsubscribe = subscribeToConversationMessages(selectedId, setMessages);
    return () => unsubscribe();
  }, [selectedId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  const handleStartNewConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !displayName || !newTitle.trim() || creating) return;
    setCreating(true);
    try {
      const id = await createConversation(
        user.uid,
        displayName,
        newTitle.trim(),
        newFirstMessage.trim() || undefined
      );
      setNewTitle("");
      setNewFirstMessage("");
      setShowNewForm(false);
      setSelectedId(id);
    } catch (error) {
      console.error("Error creating conversation:", error);
      alert("Failed to start conversation. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !displayName || !selectedId || !replyInput.trim() || sending) return;
    setSending(true);
    try {
      await sendReply(selectedId, user.uid, displayName, replyInput);
      setReplyInput("");
    } catch (error) {
      console.error("Error sending reply:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const formatConversationTime = (timestamp: { toDate: () => Date }) => {
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Community Chat</h2>
      </div>
      <div className="chat-layout">
        <aside className="chat-conversations-list">
          <button
            type="button"
            className="chat-new-conversation-btn"
            onClick={() => setShowNewForm((v) => !v)}
            aria-pressed={showNewForm}
          >
            + New conversation
          </button>
          {showNewForm && (
            <form
              onSubmit={handleStartNewConversation}
              className="chat-new-conversation-form"
            >
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Topic or title..."
                required
                maxLength={120}
                className="chat-new-title-input"
                autoFocus
              />
              <textarea
                value={newFirstMessage}
                onChange={(e) => setNewFirstMessage(e.target.value)}
                placeholder="First message (optional)"
                maxLength={500}
                rows={2}
                className="chat-new-message-input"
              />
              <div className="chat-new-form-actions">
                <button
                  type="button"
                  className="chat-new-cancel"
                  onClick={() => {
                    setShowNewForm(false);
                    setNewTitle("");
                    setNewFirstMessage("");
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTitle.trim()}
                  className="chat-new-submit"
                >
                  {creating ? "Starting…" : "Start conversation"}
                </button>
              </div>
            </form>
          )}
          <ul className="chat-conversations" aria-label="Conversations">
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={`chat-conversation-item ${selectedId === c.id ? "selected" : ""}`}
                  onClick={() => setSelectedId(c.id)}
                >
                  <span className="chat-conversation-title">{c.title}</span>
                  <span className="chat-conversation-meta">
                    {c.createdByName} · {formatConversationTime(c.updatedAt)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {conversations.length === 0 && !showNewForm && (
            <p className="chat-conversations-empty">No conversations yet.</p>
          )}
        </aside>
        <div className="chat-thread-panel">
          {!selectedId ? (
            <div className="chat-thread-empty">
              <p>Select a conversation or start a new one.</p>
            </div>
          ) : (
            <>
              <div className="chat-thread-header">
                <h3 className="chat-thread-title">
                  {selectedConversation?.title ?? "Conversation"}
                </h3>
                <span className="chat-thread-meta">
                  Started by {selectedConversation?.createdByName ?? "—"}
                </span>
              </div>
              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div className="chat-empty">
                    No messages yet. Be the first to reply!
                  </div>
                ) : (
                  messages.map((message) => (
                    <Message
                      key={message.id}
                      message={message}
                      conversationId={selectedId}
                      currentUserId={user?.uid ?? ""}
                      formatTime={formatMessageTime}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendReply} className="chat-input-form">
                <input
                  type="text"
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  placeholder="Reply..."
                  disabled={sending || !displayName}
                  className="chat-input"
                  maxLength={500}
                />
                <button
                  type="submit"
                  disabled={sending || !replyInput.trim() || !displayName}
                  className="chat-send-button"
                >
                  {sending ? "Sending…" : "Send"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
