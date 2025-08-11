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
    // Only top up to 1000 on first creation, not on every login
    // This prevents interfering with legitimate losses from betting
    return json(profile);
  } catch (e) {
    return err(e.message, 401);
  }
}
