import { verifyToken } from "@/lib/firebaseAdmin";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { json, err } from "@/lib/apiUtil";
import { getUserProfile } from "@/lib/db";

export async function GET(req) {
  try {
    const authUser = await verifyToken(req);
    const profile = await getUserProfile(authUser.uid);
    if (!profile || profile.role !== "admin") return err("Forbidden", 403);
    const qRef = query(
      collection(db, "users"),
      where("upgradeRequested", "==", true)
    );
    const snap = await getDocs(qRef);
    return json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (e) {
    return err(e.message, 400);
  }
}
