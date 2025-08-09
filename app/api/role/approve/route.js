import { verifyToken } from "@/lib/firebaseAdmin";
import { getUserProfile, approveRoleUpgrade } from "@/lib/db";
import { json, err } from "@/lib/apiUtil";

export async function POST(req) {
  try {
    const authUser = await verifyToken(req);
    const adminProfile = await getUserProfile(authUser.uid);
    if (!adminProfile || adminProfile.role !== "admin")
      return err("Forbidden", 403);
    const { userId } = await req.json();
    if (!userId) return err("userId required");
    await approveRoleUpgrade(userId);
    return json({ ok: true });
  } catch (e) {
    return err(e.message, 400);
  }
}
