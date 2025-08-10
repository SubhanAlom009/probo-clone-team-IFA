import { verifyToken } from "@/lib/firebaseAdmin";
import { db } from "@/lib/firebase";
import { doc, increment, updateDoc, serverTimestamp } from "firebase/firestore";
import { json, err } from "@/lib/apiUtil";

export async function POST(req) {
  try {
    const authUser = await verifyToken(req);
    const { amount } = await req.json();
    if (!amount || amount <= 0) return err("Invalid amount", 400);
    const userRef = doc(db, "users", authUser.uid);
    await updateDoc(userRef, {
      balance: increment(amount),
      updatedAt: serverTimestamp(),
    });
    return json({ ok: true });
  } catch (e) {
    return err(e.message, 400);
  }
}
