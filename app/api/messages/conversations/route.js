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

// Get all conversations for a user
export async function GET(req) {
  try {
    const authUser = await verifyToken(req);

    // Primary query: requires a composite index (array-contains + orderBy)
    let docsToUse = [];
    try {
      const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", authUser.uid),
        orderBy("lastActivity", "desc"),
        limit(20)
      );
      const snapshot = await getDocs(q);
      docsToUse = snapshot.docs;
    } catch (e) {
      // Graceful fallback when composite index is missing
      if (e?.code === "failed-precondition") {
        console.warn(
          "Conversations index missing; falling back to in-memory sort. Create the composite index for better performance.",
          e?.message || e
        );
        const fallbackQ = query(
          collection(db, "conversations"),
          where("participants", "array-contains", authUser.uid),
          limit(100)
        );
        const fallbackSnap = await getDocs(fallbackQ);
        const tsToMs = (t) =>
          t?.toDate?.()?.getTime?.() ??
          (typeof t === "number" ? t : t ? new Date(t).getTime() : 0);
        docsToUse = fallbackSnap.docs
          .slice()
          .sort(
            (a, b) =>
              tsToMs(b.data()?.lastActivity) - tsToMs(a.data()?.lastActivity)
          )
          .slice(0, 20);
      } else {
        throw e;
      }
    }

    const conversations = [];
    for (const docSnap of docsToUse) {
      const data = docSnap.data();
      const otherUserId = data.participants.find((id) => id !== authUser.uid);

      // Get other user's info
      const otherUserDoc = await getDoc(doc(db, "users", otherUserId));
      const otherUser = otherUserDoc.exists() ? otherUserDoc.data() : null;

      conversations.push({
        id: docSnap.id,
        ...data,
        otherUser: otherUser
          ? {
              id: otherUserId,
              displayName: otherUser.displayName,
              avatar: otherUser.photoURL || otherUser.avatar,
              isOnline: otherUser.isOnline,
              lastSeen: otherUser.lastSeen,
            }
          : null,
        unreadCount: data.unreadCount?.[authUser.uid] || 0,
        lastActivity:
          data.lastActivity?.toDate?.()?.toISOString() || data.lastActivity,
      });
    }

    return json({ conversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return err("Failed to fetch conversations", 500);
  }
}

// Start a new conversation
export async function POST(req) {
  try {
    const authUser = await verifyToken(req);
    const { otherUserId, initialMessage } = await req.json();

    if (!otherUserId || !initialMessage?.trim()) {
      return err("Missing required fields", 400);
    }

    if (otherUserId === authUser.uid) {
      return err("Cannot message yourself", 400);
    }

    // Check if conversation already exists
    const participants = [authUser.uid, otherUserId].sort();
    const existingQuery = query(
      collection(db, "conversations"),
      where("participants", "==", participants)
    );
    const existingSnapshot = await getDocs(existingQuery);

    let conversationId;

    if (!existingSnapshot.empty) {
      // Use existing conversation
      conversationId = existingSnapshot.docs[0].id;

      // Update last activity
      await updateDoc(doc(db, "conversations", conversationId), {
        lastMessage: {
          text: initialMessage.trim(),
          senderId: authUser.uid,
          timestamp: serverTimestamp(),
          type: "text",
        },
        lastActivity: serverTimestamp(),
        [`unreadCount.${otherUserId}`]:
          (existingSnapshot.docs[0].data().unreadCount?.[otherUserId] || 0) + 1,
      });
    } else {
      // Create new conversation
      const conversationRef = await addDoc(collection(db, "conversations"), {
        participants,
        lastMessage: {
          text: initialMessage.trim(),
          senderId: authUser.uid,
          timestamp: serverTimestamp(),
          type: "text",
        },
        lastActivity: serverTimestamp(),
        createdAt: serverTimestamp(),
        unreadCount: {
          [authUser.uid]: 0,
          [otherUserId]: 1,
        },
        isActive: true,
      });
      conversationId = conversationRef.id;
    }

    // Add the message
    await addDoc(collection(db, "conversations", conversationId, "messages"), {
      senderId: authUser.uid,
      receiverId: otherUserId,
      conversationId,
      text: initialMessage.trim(),
      timestamp: serverTimestamp(),
      readBy: {
        [authUser.uid]: serverTimestamp(),
        [otherUserId]: null,
      },
      isDeleted: false,
    });

    return json({ conversationId, success: true });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return err("Failed to create conversation", 500);
  }
}
