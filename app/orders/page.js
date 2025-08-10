"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import MyOrders from "@/components/MyOrders";

export default function MyOrdersPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (!u) router.replace("/auth/signin");
    });
    return () => unsub();
  }, [router]);

  if (loading)
    return <div className="p-8 text-center text-neutral-400">Loading...</div>;
  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6 text-white">My Open Orders</h1>
      <MyOrders userId={user.uid} />
    </div>
  );
}
