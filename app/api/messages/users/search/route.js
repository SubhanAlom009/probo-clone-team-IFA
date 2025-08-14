import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { verifyToken } from "@/lib/firebaseAdmin";
import { json, err } from "@/lib/apiUtil";

// Search users for messaging
export async function GET(req) {
  try {
    const authUser = await verifyToken(req);
    const url = new URL(req.url);
    const searchQuery = url.searchParams.get("q");

    if (!searchQuery || searchQuery.length < 2) {
      return err("Search query must be at least 2 characters", 400);
    }

    // Search users by display name
    const q = query(collection(db, "users"), orderBy("displayName"), limit(20));

    const snapshot = await getDocs(q);
    const users = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        displayName: doc.data().displayName,
        avatar: doc.data().avatar,
        totalTrades: doc.data().totalTrades || 0,
        winRate: doc.data().winRate || 0,
        isOnline: doc.data().isOnline || false,
        lastSeen: doc.data().lastSeen,
      }))
      .filter(
        (user) =>
          user.id !== authUser.uid && // Exclude current user
          user.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
      );

    return json({ users });
  } catch (error) {
    console.error("Error searching users:", error);
    return err("Failed to search users", 500);
  }
}
