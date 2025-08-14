import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { verifyToken } from "@/lib/firebaseAdmin";
import { json, err } from "@/lib/apiUtil";

export async function GET(req, { params }) {
  try {
    await verifyToken(req);
    const userRef = doc(db, "users", params.id);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return err("User not found", 404);
    const data = snap.data();
    // Return minimal safe profile info
    return json({
      user: {
        id: snap.id,
        displayName: data.displayName || "User",
        avatar: data.avatar || null,
        isOnline: !!data.isOnline,
        lastSeen: data.lastSeen || null,
      },
    });
  } catch (e) {
    console.error("GET /api/users/[id] error:", e);
    return err("Failed to fetch user", 500);
  }
}
