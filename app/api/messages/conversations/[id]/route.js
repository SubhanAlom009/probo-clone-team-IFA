import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
} from "firebase/firestore";
import { verifyToken } from "@/lib/firebaseAdmin";
import { json, err } from "@/lib/apiUtil";

// Get messages for a conversation
export async function GET(req, context) {
  try {
    const authUser = await verifyToken(req);
    const params = await context.params;
    const conversationId = params.id;

    const url = new URL(req.url);
    const limitCount = parseInt(url.searchParams.get("limit")) || 50;

    // Verify user is participant in this conversation
    const conversationDoc = await getDoc(
      doc(db, "conversations", conversationId)
    );
    if (
      !conversationDoc.exists() ||
      !conversationDoc.data().participants.includes(authUser.uid)
    ) {
      return err("Conversation not found or access denied", 404);
    }

    let docsToUse = [];
    try {
      const q = query(
        collection(db, "conversations", conversationId, "messages"),
        where("isDeleted", "==", false),
        orderBy("timestamp", "desc"),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      docsToUse = snapshot.docs;
    } catch (e) {
      if (e?.code === "failed-precondition") {
        console.warn(
          "Messages index missing; falling back to in-memory sort. Create composite index on isDeleted + timestamp.",
          e?.message || e
        );
        const fbQ = query(
          collection(db, "conversations", conversationId, "messages"),
          where("isDeleted", "==", false),
          limit(Math.max(200, limitCount))
        );
        const fbSnap = await getDocs(fbQ);
        const ts = (t) =>
          t?.toDate?.()?.getTime?.() ??
          (typeof t === "number" ? t : t ? new Date(t).getTime() : 0);
        docsToUse = fbSnap.docs
          .slice()
          .sort((a, b) => ts(b.data()?.timestamp) - ts(a.data()?.timestamp))
          .slice(0, limitCount);
      } else {
        throw e;
      }
    }

    const messages = docsToUse.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp:
        doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp,
    }));

    // Mark unread messages as read
    const unreadMessages = messages.filter(
      (msg) => msg.senderId !== authUser.uid && !msg.readBy[authUser.uid]
    );

    if (unreadMessages.length > 0) {
      // Update read status for unread messages
      const updatePromises = unreadMessages.map((msg) =>
        updateDoc(
          doc(db, "conversations", conversationId, "messages", msg.id),
          {
            [`readBy.${authUser.uid}`]: serverTimestamp(),
          }
        )
      );

      // Update conversation unread count
      updatePromises.push(
        updateDoc(doc(db, "conversations", conversationId), {
          [`unreadCount.${authUser.uid}`]: 0,
        })
      );

      await Promise.all(updatePromises);
    }

    return json({
      messages: messages.reverse(), // Oldest first for display
      hasMore: docsToUse.length === limitCount,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return err("Failed to fetch messages", 500);
  }
}

// Send a new message
export async function POST(req, context) {
  try {
    const authUser = await verifyToken(req);
    const params = await context.params;
    const conversationId = params.id;

    const { text } = await req.json();

    if (!text?.trim()) {
      return err("Message content is required", 400);
    }

    // Verify user is participant in this conversation
    const conversationDoc = await getDoc(
      doc(db, "conversations", conversationId)
    );
    if (!conversationDoc.exists()) {
      return err("Conversation not found", 404);
    }

    const conversationData = conversationDoc.data();
    if (!conversationData.participants.includes(authUser.uid)) {
      return err("Access denied", 403);
    }

    const otherUserId = conversationData.participants.find(
      (id) => id !== authUser.uid
    );

    // Add message to subcollection
    const messageRef = await addDoc(
      collection(db, "conversations", conversationId, "messages"),
      {
        senderId: authUser.uid,
        receiverId: otherUserId,
        conversationId,
        text: text.trim(),
        timestamp: serverTimestamp(),
        readBy: {
          [authUser.uid]: serverTimestamp(),
          [otherUserId]: null,
        },
        isDeleted: false,
      }
    );

    // Update conversation with last message and increment unread count
    await updateDoc(doc(db, "conversations", conversationId), {
      lastMessage: {
        text: text.trim(),
        senderId: authUser.uid,
        timestamp: serverTimestamp(),
        type: "text",
      },
      lastActivity: serverTimestamp(),
      [`unreadCount.${otherUserId}`]:
        (conversationData.unreadCount?.[otherUserId] || 0) + 1,
    });

    return json({
      messageId: messageRef.id,
      success: true,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return err("Failed to send message", 500);
  }
}
