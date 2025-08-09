import { verifyToken } from "@/lib/firebaseAdmin";
import { getUserProfile, createUserProfile } from "@/lib/db";
import { json, err } from "@/lib/apiUtil";
import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

export async function GET(req) {
  try {
    const authUser = await verifyToken(req);
    let profile = await getUserProfile(authUser.uid);
    if (!profile) {
      await createUserProfile(authUser);
      profile = await getUserProfile(authUser.uid);
    }
    // Ensure baseline 1000 coins each login if user has less (top-up model)
    if (profile && (profile.balance == null || profile.balance < 1000)) {
      await updateDoc(doc(db, "users", authUser.uid), {
        balance: 1000,
        baselineToppedAt: serverTimestamp(),
      });
      profile = await getUserProfile(authUser.uid);
    }
    return json(profile);
  } catch (e) {
    return err(e.message, 401);
  }
}
