"use client";
import { formatDistanceToNow } from "date-fns";

export default function ConversationsList({
  conversations,
  onSelectConversation,
  loading,
}) {
  const toDateSafe = (t) => {
    if (!t) return new Date(0);
    if (typeof t === "number") return new Date(t);
    if (typeof t === "string") return new Date(t);
    if (typeof t === "object" && typeof t.toDate === "function")
      return t.toDate();
    return new Date(t);
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-6 px-4">
        <p className="text-neutral-400 text-sm">No conversations yet</p>
        <p className="text-neutral-500 text-xs mt-1">
          Start a new conversation to get chatting!
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          onClick={() => onSelectConversation(conversation)}
          className="p-3 hover:bg-neutral-800 cursor-pointer border-b border-neutral-700 transition-colors"
        >
          <div className="flex items-start space-x-3">
            {/* Avatar */}
            <div className="relative">
              <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-xs">
                  {conversation.otherUser?.displayName?.[0]?.toUpperCase() ||
                    "U"}
                </span>
              </div>
              {conversation.otherUser?.isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border border-neutral-900 rounded-full"></div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-white truncate text-sm">
                  {conversation.otherUser?.displayName || "Unknown User"}
                </h3>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  {conversation.unreadCount > 0 && (
                    <span className="bg-cyan-600 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {conversation.unreadCount > 9
                        ? "9+"
                        : conversation.unreadCount}
                    </span>
                  )}
                  <span className="text-xs text-neutral-500">
                    {formatDistanceToNow(
                      toDateSafe(conversation.lastActivity),
                      {
                        addSuffix: true,
                      }
                    )}
                  </span>
                </div>
              </div>

              {/* Last Message Preview */}
              <p
                className={`text-xs truncate ${
                  conversation.unreadCount > 0
                    ? "text-white font-medium"
                    : "text-neutral-400"
                }`}
              >
                {conversation.lastMessage?.senderId ===
                conversation.otherUser?.id
                  ? ""
                  : "You: "}
                {conversation.lastMessage?.text || "No messages yet"}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
