"use client";
import { useState } from "react";
import { Send } from "lucide-react";

export default function MessageInput({ onSendMessage, disabled = false }) {
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    if (!message.trim() || disabled) {
      return;
    }

    try {
      await onSendMessage({ text: message.trim() });
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (disabled) {
    return (
      <div className="text-center py-2">
        <p className="text-neutral-400 text-xs">Cannot send messages</p>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type a message..."
        className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded text-white placeholder-neutral-400 focus:outline-none focus:border-cyan-500 text-sm"
      />

      <button
        onClick={handleSend}
        disabled={!message.trim()}
        className="p-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white rounded transition-colors"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}
