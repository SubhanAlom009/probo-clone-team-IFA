import { placeBet } from "@/lib/db";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { verifyToken } from "@/lib/firebaseAdmin";
import { json, err } from "@/lib/apiUtil";

export async function GET(req, context) {
  const params = await context.params;
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  const clauses = [where("eventId", "==", params.id)];
  if (userId) clauses.push(where("userId", "==", userId));
  const q = query(
    collection(db, "bets"),
    ...clauses,
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
}

export async function POST(req, context) {
  const params = await context.params;
  try {
    const authUser = await verifyToken(req);
    const { side, stake } = await req.json();
    await placeBet({
      eventId: params.id,
      userId: authUser.uid,
      side,
      stake: Number(stake),
    });
    return json({ ok: true });
  } catch (e) {
    return err(e.message, 400);
  }
}
