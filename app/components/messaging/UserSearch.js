"use client";
import { useState } from "react";
import { Search } from "lucide-react";

export default function UserSearch({ onStartConversation, currentUserId }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const searchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/messages/users/search?q=${encodeURIComponent(query)}`
      );
      const { users } = await response.json();
      setSearchResults(users || []);
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchUsers(query);
  };

  const handleStartConversation = async (user) => {
    if (!message.trim()) {
      alert("Please enter a message");
      return;
    }

    await onStartConversation(user, message.trim());
    setMessage("");
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          placeholder="Search traders..."
          value={searchQuery}
          onChange={handleSearch}
          className="w-full pl-9 pr-4 py-2 bg-neutral-800 border border-neutral-600 rounded text-white placeholder-neutral-400 focus:outline-none focus:border-cyan-500 text-sm"
        />
      </div>

      {/* Message Input */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-neutral-300 mb-2">
          First Message
        </label>
        <textarea
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded text-white placeholder-neutral-400 focus:outline-none focus:border-cyan-500 resize-none text-sm"
        />
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500"></div>
          </div>
        )}

        {!loading && searchQuery.length >= 2 && searchResults.length === 0 && (
          <div className="text-center py-4">
            <p className="text-neutral-400 text-sm">No traders found</p>
          </div>
        )}

        {searchResults.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-3 hover:bg-neutral-800 rounded transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user.displayName?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-white text-sm">
                  {user.displayName}
                </h4>
                <p className="text-xs text-neutral-400">
                  {user.totalTrades || 0} trades •{" "}
                  {((user.winRate || 0) * 100).toFixed(0)}% win rate
                </p>
              </div>
            </div>
            <button
              onClick={() => handleStartConversation(user)}
              disabled={!message.trim()}
              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white text-xs rounded transition-colors"
            >
              Send
            </button>
          </div>
        ))}
      </div>

      {searchQuery.length < 2 && (
        <div className="text-center py-4">
          <p className="text-neutral-400 text-xs">
            Start typing to search for traders
          </p>
        </div>
      )}
    </div>
  );
}
