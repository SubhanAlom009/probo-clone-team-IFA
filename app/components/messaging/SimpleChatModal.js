"use client";
import { useState as __us, useEffect as __ue, useCallback } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ConversationsList from "./ConversationsList";
import UserSearch from "./UserSearch";
import { MessageCircle, Search, X } from "lucide-react";

export default function SimpleChatModal({ isOpen, onClose, otherUser = null }) {
  const [user] = useAuthState(auth);
  const [activeView, setActiveView] = __us("conversations");
  const [conversations, setConversations] = __us([]);
  const [activeConversation, setActiveConversation] = __us(null);
  const [messages, setMessages] = __us([]);
  const [loading, setLoading] = __us(true);

  // If otherUser is provided, try to find existing conversation or start new one
  __ue(() => {
    if (otherUser && user && isOpen) {
      findOrCreateConversation(otherUser);
    }
  }, [otherUser, user, isOpen]);

  // Subscribe to conversations
  __ue(() => {
    if (!user?.uid || !isOpen) return;

    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", user.uid),
      orderBy("lastActivity", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const conversationsData = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const otherUserId = data.participants.find((id) => id !== user.uid);

        try {
          const token = await user.getIdToken();
          const response = await fetch(`/api/users/${otherUserId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const { user: otherUserData } = await response.json();

          conversationsData.push({
            id: docSnap.id,
            ...data,
            otherUser: otherUserData,
            unreadCount: data.unreadCount?.[user.uid] || 0,
            lastActivity: data.lastActivity?.toDate?.() || new Date(),
          });
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }

      setConversations(conversationsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, isOpen, user]);

  // Subscribe to messages for active conversation
  __ue(() => {
    if (!activeConversation?.id || !user?.uid) return;

    const q = query(
      collection(db, "conversations", activeConversation.id, "messages"),
      where("isDeleted", "==", false),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date(),
      }));

      setMessages(messagesData);

      // Mark messages as read
      markMessagesAsRead(activeConversation.id, messagesData);
    });

    return () => unsubscribe();
  }, [activeConversation?.id, user?.uid, markMessagesAsRead]);

  const findOrCreateConversation = async (targetUser) => {
    // Check if conversation already exists
    const existingConv = conversations.find(
      (conv) => conv.otherUser?.id === targetUser.id
    );

    if (existingConv) {
      setActiveConversation(existingConv);
      setActiveView("chat");
    } else {
      // Set up for new conversation
      setActiveConversation({
        id: null,
        otherUser: targetUser,
        participants: [user.uid, targetUser.id].sort(),
      });
      setActiveView("chat");
    }
  };

  const markMessagesAsRead = useCallback(
    async (conversationId, messages) => {
      if (!user?.uid) return;

      const unreadMessages = messages.filter(
        (msg) => msg.senderId !== user.uid && !msg.readBy?.[user.uid]
      );

      if (unreadMessages.length > 0) {
        try {
          await updateDoc(doc(db, "conversations", conversationId), {
            [`unreadCount.${user.uid}`]: 0,
          });

          unreadMessages.forEach(async (msg) => {
            await updateDoc(
              doc(db, "conversations", conversationId, "messages", msg.id),
              {
                [`readBy.${user.uid}`]: serverTimestamp(),
              }
            );
          });
        } catch (error) {
          console.error("Error marking messages as read:", error);
        }
      }
    },
    [user?.uid]
  );

  const handleStartConversation = async (targetUser, initialMessage) => {
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          otherUserId: targetUser.id,
          initialMessage,
        }),
      });

      const { conversationId } = await response.json();

      // Find and set active conversation
      const conversation = conversations.find(
        (c) => c.id === conversationId
      ) || {
        id: conversationId,
        otherUser: targetUser,
        participants: [user.uid, targetUser.id].sort(),
      };

      setActiveConversation(conversation);
      setActiveView("chat");
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  };

  const handleSendMessage = async (messageData) => {
    let conversationId = activeConversation?.id;

    // If no conversation exists, create it first
    if (!conversationId) {
      try {
        const response = await fetch("/api/messages/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            otherUserId: activeConversation.otherUser.id,
            initialMessage: messageData.text,
          }),
        });

        const result = await response.json();
        conversationId = result.conversationId;

        // Update active conversation with the ID
        setActiveConversation((prev) => ({ ...prev, id: conversationId }));
        return;
      } catch (error) {
        console.error("Error creating conversation:", error);
        return;
      }
    }

    // Send message to existing conversation
    try {
      const token = await user.getIdToken();
      await fetch(`/api/messages/conversations/${conversationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(messageData),
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-neutral-900 rounded-lg w-full max-w-4xl h-[600px] flex">
        {/* Sidebar */}
        <div className="w-80 border-r border-neutral-700 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-neutral-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                Messages
              </h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-neutral-800 rounded transition-colors"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <div className="flex space-x-1">
              <button
                onClick={() => setActiveView("conversations")}
                className={`px-3 py-2 text-sm rounded transition-colors ${
                  activeView === "conversations"
                    ? "bg-cyan-600 text-white"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                }`}
              >
                Chats
              </button>
              <button
                onClick={() => setActiveView("search")}
                className={`px-3 py-2 text-sm rounded transition-colors ${
                  activeView === "search"
                    ? "bg-cyan-600 text-white"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                }`}
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {activeView === "conversations" && (
              <ConversationsList
                conversations={conversations}
                onSelectConversation={(conv) => {
                  setActiveConversation(conv);
                  setActiveView("chat");
                }}
                loading={loading}
              />
            )}
            {activeView === "search" && (
              <UserSearch
                onStartConversation={handleStartConversation}
                currentUserId={user?.uid}
              />
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-neutral-700 bg-neutral-800">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {activeConversation.otherUser?.displayName?.[0]?.toUpperCase() ||
                        "U"}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      {activeConversation.otherUser?.displayName ||
                        "Unknown User"}
                    </h3>
                    <p className="text-xs text-neutral-400">
                      {activeConversation.otherUser?.isOnline
                        ? "Online"
                        : "Offline"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4">
                <MessageList
                  messages={messages}
                  currentUserId={user?.uid}
                  otherUser={activeConversation.otherUser}
                />
              </div>

              {/* Message Input */}
              <div className="border-t border-neutral-700 p-4">
                <MessageInput onSendMessage={handleSendMessage} />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Select a conversation
                </h3>
                <p className="text-neutral-400">
                  Choose a chat or start a new conversation
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
