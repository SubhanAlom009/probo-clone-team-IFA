import { verifyToken } from "@/lib/firebaseAdmin";
import { getUserMetrics } from "@/lib/db";
import { json, err } from "@/lib/apiUtil";

export async function GET(req) {
  try {
    const authUser = await verifyToken(req);
    const metrics = await getUserMetrics(authUser.uid);
    return json(metrics);
  } catch (e) {
    return err(e.message, 400);
  }
}
