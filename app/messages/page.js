"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

import ConversationsList from "@/app/components/messaging/ConversationsList";
import MessageList from "@/app/components/messaging/MessageList";
import MessageInput from "@/app/components/messaging/MessageInput";

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // Load conversations
  useEffect(() => {
    if (!user || authLoading) return;
    (async () => {
      setLoadingConvos(true);
      const token = await user.getIdToken();
      const res = await fetch("/api/messages/conversations", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await res.json();
      setConversations(data.conversations || []);
      setLoadingConvos(false);
    })();
  }, [user, authLoading]);

  // Open conversation by user id if provided
  useEffect(() => {
    if (!user || authLoading) return;
    const otherUserId = searchParams.get("u");
    if (!otherUserId) return;

    const openOrCreate = async () => {
      // If conversation exists in list, use it; else create
      const existing = conversations.find((c) =>
        Array.isArray(c.participants)
          ? c.participants.includes(otherUserId)
          : c.otherUser?.id === otherUserId
      );
      if (existing) {
        setActiveConversation(existing);
        return;
      }
      const token = await user.getIdToken();
      const res = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ otherUserId, initialMessage: "👋 Hi!" }),
      });
      const data = await res.json();
      if (data.conversationId) {
        // refresh conversations
        const res2 = await fetch("/api/messages/conversations", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data2 = await res2.json();
        setConversations(data2.conversations || []);
        const found = (data2.conversations || []).find(
          (c) => c.id === data.conversationId
        );
        if (found) setActiveConversation(found);
      }
    };
    openOrCreate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user, authLoading, conversations.length]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!user || !activeConversation) return;
    (async () => {
      setLoadingMessages(true);
      const token = await user.getIdToken();
      const res = await fetch(
        `/api/messages/conversations/${activeConversation.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );
      const data = await res.json();
      setMessages(data.messages || []);
      setLoadingMessages(false);
    })();
  }, [user, activeConversation]);

  const handleSelectConversation = (c) => setActiveConversation(c);

  const handleSendMessage = async ({ text }) => {
    if (!user || !activeConversation) return;
    const token = await user.getIdToken();
    const res = await fetch(
      `/api/messages/conversations/${activeConversation.id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      }
    );
    const data = await res.json();
    if (data.success) {
      // refresh messages
      const res2 = await fetch(
        `/api/messages/conversations/${activeConversation.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );
      const data2 = await res2.json();
      setMessages(data2.messages || []);
    }
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1 bg-neutral-900 border border-neutral-800 rounded-lg p-3 h-[70vh] flex flex-col">
          <div className="text-sm font-semibold text-white mb-2">
            Conversations
          </div>
          <ConversationsList
            conversations={conversations}
            onSelectConversation={handleSelectConversation}
            loading={loadingConvos}
          />
        </div>
        <div className="md:col-span-2 bg-neutral-900 border border-neutral-800 rounded-lg p-3 h-[70vh] flex flex-col">
          {activeConversation ? (
            <>
              <div className="pb-2 border-b border-neutral-800 mb-2 flex items-center justify-between">
                <div className="text-sm text-white font-semibold">
                  {activeConversation.otherUser?.displayName || "Chat"}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                  </div>
                ) : (
                  <MessageList
                    messages={messages}
                    currentUserId={user?.uid}
                    otherUser={activeConversation.otherUser}
                  />
                )}
              </div>
              <div className="pt-2 border-t border-neutral-800">
                <MessageInput onSendMessage={handleSendMessage} />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-neutral-400 text-sm mb-2">
                  Select a conversation
                </p>
                <p className="text-neutral-500 text-xs">
                  Or start a new one from Active Traders
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
