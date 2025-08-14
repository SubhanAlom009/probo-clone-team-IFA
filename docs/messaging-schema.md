# Personal Messaging System - Database Schema (Firestore Only)

## Firestore Collections Structure

### 1. conversations

```javascript
{
  id: "conversation_id", // Auto-generated
  participants: ["user1_id", "user2_id"], // Always 2 users for private chat
  lastMessage: {
    text: "Last message preview",
    senderId: "user_id",
    timestamp: "2025-08-14T10:30:00Z",
    type: "text"
  },
  lastActivity: "2025-08-14T10:30:00Z",
  createdAt: "2025-08-14T09:00:00Z",
  unreadCount: {
    "user1_id": 0,
    "user2_id": 3
  },
  isActive: true
}
```

### 2. messages (subcollection of conversations)

```javascript
// Path: conversations/{conversationId}/messages/{messageId}
{
  id: "message_id",
  senderId: "user_id",
  receiverId: "user_id",
  conversationId: "conversation_id",
  text: "Message content",
  timestamp: "2025-08-14T10:30:00Z",
  readBy: {
    "user1_id": "2025-08-14T10:31:00Z",
    "user2_id": null // null means unread
  },
  isDeleted: false
}
```

### 3. Enhanced users collection (add messaging fields)

```javascript
{
  // ... existing user fields
  displayName: "Trader Name",
  avatar: "avatar_url",
  totalTrades: 25,
  winRate: 0.68,
  totalVolume: 15000,
  isOnline: true,
  lastSeen: "2025-08-14T10:30:00Z"
}
```

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Conversations - only participants can read/write
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null &&
        request.auth.uid in resource.data.participants;
      allow create: if request.auth != null &&
        request.auth.uid in request.resource.data.participants;

      // Messages subcollection
      match /messages/{messageId} {
        allow read, write: if request.auth != null &&
          request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
        allow create: if request.auth != null &&
          request.auth.uid == request.resource.data.senderId;
      }
    }
  }
}
```
