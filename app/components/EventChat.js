"use client";
import { useState, useEffect, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { MessageCircle, Send, Users } from "lucide-react";

export default function EventChat({ eventId }) {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!eventId) return;

    // Use a simpler query to avoid index requirements
    const messagesQuery = query(
      collection(db, "eventMessages"),
      where("eventId", "==", eventId)
      // Removed orderBy to avoid composite index requirement
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort messages on the client side instead
      messagesList.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeA - timeB;
      });

      setMessages(messagesList);
    });

    return unsubscribe;
  }, [eventId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);
    try {
      await addDoc(collection(db, "eventMessages"), {
        eventId,
        userId: user.uid,
        userEmail: user.email,
        message: newMessage.trim(),
        createdAt: serverTimestamp(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <MessageCircle className="w-5 h-5 text-cyan-400 mr-2" />
          <h3 className="text-lg font-semibold text-white">Event Chat</h3>
        </div>
        <div className="text-center text-neutral-400">Loading chat...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <MessageCircle className="w-5 h-5 text-cyan-400 mr-2" />
          <h3 className="text-lg font-semibold text-white">Event Chat</h3>
        </div>
        <div className="text-center text-neutral-400">
          Sign in to join the discussion
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <MessageCircle className="w-5 h-5 text-cyan-400 mr-2" />
          <h3 className="text-lg font-semibold text-white">Event Chat</h3>
        </div>
        <div className="flex items-center text-sm text-neutral-400">
          <Users className="w-4 h-4 mr-1" />
          {new Set(messages.map((m) => m.userId)).size} traders
        </div>
      </div>

      {/* Messages Container */}
      <div className="h-64 overflow-y-auto mb-4 space-y-2 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-900">
        {messages.length === 0 ? (
          <div className="text-center text-neutral-500 py-8">
            No messages yet. Start the discussion!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-lg ${
                message.userId === user.uid
                  ? "bg-cyan-900/30 border border-cyan-800/50 ml-8"
                  : "bg-neutral-800 border border-neutral-700 mr-8"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-sm font-medium ${
                    message.userId === user.uid
                      ? "text-cyan-300"
                      : "text-neutral-300"
                  }`}
                >
                  {message.userId === user.uid
                    ? "You"
                    : message.userEmail?.split("@")[0] || "Anonymous"}
                </span>
                <span className="text-xs text-neutral-500">
                  {formatTime(message.createdAt)}
                </span>
              </div>
              <p className="text-white text-sm leading-relaxed">
                {message.message}
              </p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Share your thoughts on this market..."
          className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          disabled={sending}
          maxLength={500}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center"
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>

      {/* Character limit indicator */}
      <div className="text-xs text-neutral-500 mt-1 text-right">
        {newMessage.length}/500
      </div>
    </div>
  );
}
