import { verifyToken } from "@/lib/firebaseAdmin";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { json, err } from "@/lib/apiUtil";

export async function GET(req) {
  try {
    const authUser = await verifyToken(req);
    const qB = query(
      collection(db, "bets"),
      where("userId", "==", authUser.uid),
      orderBy("createdAt", "desc"),
      limit(100)
    );
    const snap = await getDocs(qB);
    return json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (e) {
    return err(e.message, 401);
  }
}
