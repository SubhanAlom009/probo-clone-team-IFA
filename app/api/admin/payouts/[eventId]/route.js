import { verifyToken } from "@/lib/firebaseAdmin";
import { getUserProfile } from "@/lib/db";
import { json, err } from "@/lib/apiUtil";

// Stub payout trigger - implement later
export async function POST(req, { params }) {
  try {
    const authUser = await verifyToken(req);
    const profile = await getUserProfile(authUser.uid);
    if (!profile || profile.role !== "admin") return err("Forbidden", 403);
    return json({
      ok: true,
      eventId: params.eventId,
      note: "Payout logic not yet implemented",
    });
  } catch (e) {
    return err(e.message, 400);
  }
}
