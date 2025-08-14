"use client";
import { format, isToday, isYesterday } from "date-fns";

export default function MessageList({ messages, currentUserId, otherUser }) {
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);

    if (isToday(date)) {
      return format(date, "HH:mm");
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, "HH:mm")}`;
    } else {
      return format(date, "MMM dd, HH:mm");
    }
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-400 text-sm mb-2">No messages yet</p>
          <p className="text-neutral-500 text-xs">
            Send a message to start the conversation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((message) => {
        const isOwnMessage = message.senderId === currentUserId;

        return (
          <div
            key={message.id}
            className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
          >
            <div className="flex items-end space-x-2 max-w-xs">
              {/* Avatar for other user's messages */}
              {!isOwnMessage && (
                <div className="w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-semibold">
                    {otherUser?.displayName?.[0]?.toUpperCase() || "U"}
                  </span>
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`px-3 py-2 rounded-lg max-w-full ${
                  isOwnMessage
                    ? "bg-cyan-600 text-white rounded-br-sm"
                    : "bg-neutral-800 text-white rounded-bl-sm"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.text}
                </p>

                <div className="flex items-center justify-end mt-1">
                  <span className="text-xs opacity-75">
                    {formatMessageTime(message.timestamp)}
                  </span>
                  {isOwnMessage && message.readBy?.[otherUser?.id] && (
                    <span className="ml-1 text-xs opacity-75">✓</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
