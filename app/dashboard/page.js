// "use client";
// import React, { useState, useEffect } from "react";
// import Link from "next/link";

// // Probo-style User Dashboard (fixed)
// // - Single-file React component preview for Next.js (App Router)
// // - Tailwind CSS assumed
// // - Dummy data used for placeholders; replace with real APIs as needed
// //
// // Fixes applied:
// // 1. Removed reliance on next/navigation's useRouter to avoid runtime issues when router is not available during certain dev builds.
// // 2. Made string/number operations defensive (guarded toFixed calls) to avoid "reading '_'" or other null property errors.
// // 3. Replaced programmatic pushes with state updates and Link components so navigation is explicit.
// // 4. Added small confirmation state after placing an order instead of navigating (dashboard already displays orders).

// export default function ProboUserDashboard() {
//   // --- State ---
//   const [user, setUser] = useState({
//     name: "Surya Pratap",
//     balance: 150.0,
//     avatar: "https://i.pravatar.cc/100?img=3",
//     id: "USR-1001",
//   });

//   const [orders, setOrders] = useState(() => generateDummyOrders(8));
//   const [transactions, setTransactions] = useState(() => generateDummyTxns(6));
//   const [filters, setFilters] = useState({ status: "all", side: "all" });
//   const [search, setSearch] = useState("");

//   // for small interactive widgets
//   const [selectedTab, setSelectedTab] = useState("overview");
//   const [showOrderModal, setShowOrderModal] = useState(false);
//   const [lastPlacedOrderId, setLastPlacedOrderId] = useState(null);

//   useEffect(() => {
//     // Simulate fetching updated data from API
//     // In real app, fetch user's profile, balance, orders, and txn history
//   }, []);

//   // computed values (safe guards)
//   const totalYes = orders.filter((o) => o?.side === "yes").length;
//   const totalNo = orders.filter((o) => o?.side === "no").length;
//   const availableBalance = Number(user?.balance || 0);

//   const filteredOrders = orders.filter((o) => {
//     if (!o) return false;
//     if (filters.status !== "all" && o.status !== filters.status) return false;
//     if (filters.side !== "all" && o.side !== filters.side) return false;
//     if (search) {
//       const idMatch = String(o.id || "").includes(search);
//       const eventMatch = String(o.event || "").toLowerCase().includes(search.toLowerCase());
//       if (!idMatch && !eventMatch) return false;
//     }
//     return true;
//   });

//   const handleRecharge = () => {
//     // placeholder: open recharge modal / external payment flow
//     setUser((u) => ({ ...u, balance: Number(u.balance || 0) + 500 }));
//   };

//   const handlePlaceOrder = (order) => {
//     // add order locally and switch to orders tab (dashboard view)
//     setOrders((prev) => [order, ...prev]);
//     setSelectedTab("orders");
//     setLastPlacedOrderId(order.id);
//   };

//   const handleCancelOrder = (id) => {
//     setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: "cancelled" } : o)));
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 text-gray-900">
//       <div className="max-w-7xl mx-auto px-4 py-6">
//         <div className="flex flex-col lg:flex-row gap-6">
//           {/* --- Sidebar --- */}
//           <aside className="w-full lg:w-72 sticky top-6">
//             <div className="bg-white rounded-lg shadow p-4 space-y-4">
//               <div className="flex items-center space-x-3">
//                 <img src={user.avatar} alt="avatar" className="w-12 h-12 rounded-full" />
//                 <div>
//                   <div className="text-sm font-semibold">{user.name}</div>
//                   <div className="text-xs text-gray-500">{user.id}</div>
//                 </div>
//               </div>

//               <div className="bg-gray-50 p-3 rounded">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <div className="text-xs text-gray-500">Balance</div>
//                     <div className="text-lg font-semibold">₹{(availableBalance || 0).toFixed(2)}</div>
//                   </div>
//                   <button onClick={handleRecharge} className="text-xs px-3 py-1 rounded bg-gray-900 text-white">Recharge</button>
//                 </div>
//               </div>

//               <nav className="grid gap-1">
//                 <button
//                   onClick={() => setSelectedTab("overview")}
//                   className={`text-left px-3 py-2 rounded ${selectedTab === "overview" ? "bg-blue-50 text-blue-600 font-semibold" : "hover:bg-gray-100"}`}>
//                   Overview
//                 </button>
//                 <button
//                   onClick={() => setSelectedTab("orders")}
//                   className={`text-left px-3 py-2 rounded ${selectedTab === "orders" ? "bg-blue-50 text-blue-600 font-semibold" : "hover:bg-gray-100"}`}>
//                   Orders
//                 </button>
//                 <button
//                   onClick={() => setSelectedTab("transactions")}
//                   className={`text-left px-3 py-2 rounded ${selectedTab === "transactions" ? "bg-blue-50 text-blue-600 font-semibold" : "hover:bg-gray-100"}`}>
//                   Transactions
//                 </button>
//                 {/* Use Link for full navigation */}
//                 <Link href="/settings"><a className="text-left px-3 py-2 rounded hover:bg-gray-100 inline-block">Settings</a></Link>
//               </nav>

//               <div className="pt-2 border-t">
//                 <div className="text-xs text-gray-500">Need help?</div>
//                 <a href="mailto:support@probo.example" className="text-sm text-blue-600 underline">Contact Support</a>
//               </div>
//             </div>

//             <div className="mt-4">
//               <div className="bg-white rounded-lg shadow p-4">
//                 <div className="text-xs text-gray-500">Quick stats</div>
//                 <div className="mt-2 grid grid-cols-2 gap-2">
//                   <StatCard label="Open Orders" value={orders.filter(o => o?.status === 'open').length} />
//                   <StatCard label="Settled" value={orders.filter(o => o?.status === 'settled').length} />
//                 </div>
//               </div>
//             </div>
//           </aside>

//           {/* --- Main content --- */}
//           <main className="flex-1">
//             <div className="flex flex-col gap-6">
//               {/* Header */}
//               <div className="flex items-center justify-between">
//                 <div>
//                   <h1 className="text-2xl font-semibold">Dashboard</h1>
//                   <div className="text-sm text-gray-500">Welcome back, {user.name} 👋</div>
//                 </div>
//                 <div className="flex items-center space-x-3">
//                   <div className="text-right">
//                     <div className="text-xs text-gray-500">Account</div>
//                     <div className="text-sm font-medium">Verified</div>
//                   </div>
//                   <button className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200">Logout</button>
//                 </div>
//               </div>

//               {/* Overview tiles */}
//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//                 <AnalyticsCard title="Total Balance" value={`₹${(Number(user.balance) || 0).toFixed(2)}`} />
//                 <AnalyticsCard title="Open Orders" value={orders.filter(o => o?.status === 'open').length} />
//                 <AnalyticsCard title="Yes Orders" value={totalYes} />
//                 <AnalyticsCard title="No Orders" value={totalNo} />
//               </div>

//               {/* Orders + Chart row */}
//               <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
//                 <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
//                   <div className="flex items-center justify-between mb-3">
//                     <h2 className="text-lg font-semibold">Orders</h2>
//                     <div className="flex items-center space-x-2">
//                       <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders or event" className="px-3 py-2 border rounded text-sm" />
//                       <select className="px-2 py-2 border rounded text-sm" value={filters.status} onChange={(e) => setFilters(f => ({...f, status: e.target.value}))}>
//                         <option value="all">All</option>
//                         <option value="open">Open</option>
//                         <option value="settled">Settled</option>
//                         <option value="cancelled">Cancelled</option>
//                       </select>
//                       <select className="px-2 py-2 border rounded text-sm" value={filters.side} onChange={(e) => setFilters(f => ({...f, side: e.target.value}))}>
//                         <option value="all">Side</option>
//                         <option value="yes">Yes</option>
//                         <option value="no">No</option>
//                       </select>
//                     </div>
//                   </div>

//                   <div className="overflow-x-auto">
//                     <table className="w-full text-left text-sm">
//                       <thead className="text-xs text-gray-500 uppercase">
//                         <tr>
//                           <th className="px-3 py-2">Order ID</th>
//                           <th className="px-3 py-2">Event</th>
//                           <th className="px-3 py-2">Side</th>
//                           <th className="px-3 py-2">Price</th>
//                           <th className="px-3 py-2">Qty</th>
//                           <th className="px-3 py-2">Status</th>
//                           <th className="px-3 py-2">Actions</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {filteredOrders.map((o) => (
//                           <tr key={o.id} className="border-t border-gray-100">
//                             <td className="px-3 py-2">{o.id}</td>
//                             <td className="px-3 py-2">{o.event}</td>
//                             <td className={`px-3 py-2 font-semibold ${o.side === 'yes' ? 'text-blue-600' : 'text-red-600'}`}>{String(o.side || "").toUpperCase()}</td>
//                             <td className="px-3 py-2">₹{Number(o.price || 0).toFixed(1)}</td>
//                             <td className="px-3 py-2">{o.qty}</td>
//                             <td className="px-3 py-2">{o.status}</td>
//                             <td className="px-3 py-2">
//                               <div className="flex items-center space-x-2">
//                                 <Link href={`/orders/${o.id}`}><a className="text-xs px-2 py-1 rounded bg-gray-100">View</a></Link>
//                                 {o.status === 'open' && <button onClick={() => handleCancelOrder(o.id)} className="text-xs px-2 py-1 rounded bg-red-50 text-red-600">Cancel</button>}
//                               </div>
//                             </td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 </div>

//                 {/* Chart / Market snapshot */}
//                 <div className="bg-white rounded-lg shadow p-4">
//                   <div className="flex items-center justify-between mb-3">
//                     <h3 className="text-lg font-semibold">Market Snapshot</h3>
//                     <div className="text-xs text-gray-400">Live</div>
//                   </div>
//                   <div className="h-48 bg-gradient-to-b from-blue-100 to-white rounded mb-3 flex items-center justify-center">
//                     <div className="text-sm text-gray-500">(interactive chart placeholder)</div>
//                   </div>
//                   <div className="space-y-2 text-sm">
//                     <div className="flex items-center justify-between">
//                       <div className="text-xs text-gray-500">Yes</div>
//                       <div className="font-semibold">55%</div>
//                     </div>
//                     <div className="flex items-center justify-between">
//                       <div className="text-xs text-gray-500">No</div>
//                       <div className="font-semibold">45%</div>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Transactions + Activity */}
//               <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
//                 <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
//                   <div className="flex items-center justify-between mb-3">
//                     <h3 className="text-lg font-semibold">Transactions</h3>
//                     <Link href="/transactions"><a className="text-xs text-blue-600 underline">See all</a></Link>
//                   </div>
//                   <ul className="space-y-2 text-sm">
//                     {transactions.map((t) => (
//                       <li key={t.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
//                         <div>
//                           <div className="font-medium">{t.title}</div>
//                           <div className="text-xs text-gray-500">{t.date}</div>
//                         </div>
//                         <div className={`font-semibold ${t.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>{t.amount < 0 ? '-' : '+'}₹{Math.abs(t.amount).toFixed(2)}</div>
//                       </li>
//                     ))}
//                   </ul>
//                 </div>

//                 {/* Order panel (small) */}
//                 <div className="bg-white rounded-lg shadow p-4">
//                   <OrderPanel
//                     defaultPrice={7.0}
//                     availableQty={15}
//                     balance={user.balance}
//                     onPlace={(order) => handlePlaceOrder(order)}
//                   />
//                 </div>
//               </div>

//               {/* Footer area with helpful links */}
//               <div className="bg-white rounded-lg shadow p-4 text-sm text-gray-600">
//                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
//                   <div>
//                     <div className="font-semibold">Probo — Trade responsibly</div>
//                     <div className="text-xs text-gray-500">Settlement based on Source of Truth as per rules.</div>
//                   </div>
//                   <div className="mt-3 sm:mt-0">
//                     <Link href="/rules"><a className="text-xs text-blue-600 underline mr-4">Rules</a></Link>
//                     <Link href="/faq"><a className="text-xs text-blue-600 underline">FAQ</a></Link>
//                   </div>
//                 </div>

//                 {lastPlacedOrderId && (
//                   <div className="mt-3 text-sm text-green-700">Order <strong>{lastPlacedOrderId}</strong> placed successfully. See it in the Orders tab.</div>
//                 )}

//               </div>
//             </div>
//           </main>
//         </div>
//       </div>
//     </div>
//   );
// }


// // -------------------------
// // Subcomponents + helpers
// // -------------------------

// // function AnalyticsCard({ title, value }) {
// //   return (
// //     <div className="bg-white rounded-lg shadow p-4 flex flex-col">
// //       <div className="text-xs text-gray-500">{title}</div>
// //       <div className="mt-2 text-xl font-semibold">{value}</div>
// //     </div>
// //   );
// // }

// // function StatCard({ label, value }) {
// //   return (
// //     <div className="bg-white p-3 rounded text-center">
// //       <div className="text-sm font-semibold">{value}</div>
// //       <div className="text-xs text-gray-500">{label}</div>
// //     </div>
// //   );
// // }

// // function OrderPanel({ defaultPrice = 7, availableQty = 15, balance = 0, onPlace }) {
// //   const [side, setSide] = useState("yes");
// //   const [price, setPrice] = useState(Number(defaultPrice) || 7);
// //   const [qty, setQty] = useState(1);
// //   const [placed, setPlaced] = useState(false);

// //   useEffect(() => {
// //     setPrice(Number(defaultPrice) || 7);
// //   }, [defaultPrice]);

// //   const totalPut = Number((price || 0) * (qty || 0));
// //   const totalGet = Number(((10 - (price || 0)) * (qty || 0)) + 3); // fake calc to show diff
// //   const hasBalance = Number(balance || 0) >= totalPut;

// //   const changePrice = (delta) => {
// //     setPrice((p) => {
// //       const next = Math.max(1, Math.min(10, +(Number(p || 0) + delta).toFixed(1)));
// //       return next;
// //     });
// //   };
// //   const changeQty = (delta) => {
// //     setQty((q) => Math.max(1, Math.min(availableQty, (q || 0) + delta)));
// //   };

// //   const placeOrder = () => {
// //     if (!hasBalance) return;
// //     const order = {
// //       id: `ORD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
// //       event: "West Delhi Lions vs East Delhi Riders",
// //       side,
// //       price,
// //       qty,
// //       status: "open",
// //       createdAt: new Date().toISOString(),
// //     };
// //     if (onPlace) onPlace(order);
// //     setPlaced(true);
// //     // keep user on dashboard; parent will show confirmation
// //     setTimeout(() => setPlaced(false), 3500);
// //   };

// //   return (
// //     <div>
// //       <div className="flex">
// //         <button onClick={() => setSide('yes')} className={`flex-1 py-2 font-semibold text-center ${side === 'yes' ? 'bg-green-50 text-green-700 border-b-2 border-green-500' : 'bg-gray-100'}`}>Yes ₹{Number(price || 0).toFixed(1)}</button>
// //         <button onClick={() => setSide('no')} className={`flex-1 py-2 font-semibold text-center ${side === 'no' ? 'bg-red-50 text-red-700 border-b-2 border-red-500' : 'bg_gray-100'}`}>No ₹{Number(10 - (price || 0)).toFixed(1)}</button>
// //       </div>

// //       <div className="mt-3">
// //         <div className="text-xs text-gray-500 mb-1">Price</div>
// //         <div className="flex items-center justify-center space-x-3">
// //           <button onClick={() => changePrice(-0.5)} className="p-2 rounded bg-gray-100"><MinusIcon/></button>
// //           <div className="text-lg font-semibold">₹{Number(price || 0).toFixed(1)}</div>
// //           <button onClick={() => changePrice(0.5)} className="p-2 rounded bg-gray-100"><PlusIcon/></button>
// //         </div>
// //         <div className="text-xs text-gray-400 mt-1">{availableQty} qty available</div>
// //       </div>

// //       <div className="mt-3">
// //         <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
// //           <div>Quantity</div>
// //           <div className="text-xs text-gray-400">Limit</div>
// //         </div>
// //         <div className="flex items-center justify-center space-x-3">
// //           <button onClick={() => changeQty(-1)} className={`p-2 rounded bg-gray-100 ${qty === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}> <MinusIconGray/></button>
// //           <div className="text-lg font-semibold">{qty}</div>
// //           <button onClick={() => changeQty(1)} className="p-2 rounded bg-gray-100"><PlusIcon/></button>
// //         </div>
// //       </div>

// //       <div className="flex justify-between items-center mt-4 border-t pt-3">
// //         <div>
// //           <div className="text-xs text-gray-500">You put</div>
// //           <div className="font-semibold">₹{Number(totalPut || 0).toFixed(2)}</div>
// //         </div>
// //         <div>
// //           <div className="text-xs text-gray-500">You get</div>
// //           <div className="font-semibold text-green-600">₹{Number(totalGet || 0).toFixed(2)}</div>
// //         </div>
// //       </div>

// //       {!hasBalance && (
// //         <div className="mt-3 p-3 bg-yellow-50 rounded flex items-center justify-between">
// //           <div>
// //             <div className="text-sm font-medium">Insufficient balance</div>
// //             <div className="text-xs text-gray-500">Add funds to place order</div>
// //           </div>
// //           <Link href="/wallet"><a className="px-3 py-1 bg-gray-900 text-white rounded text-xs">Recharge</a></Link>
// //         </div>
// //       )}

// //       <div className="mt-4">
// //         <button disabled={!hasBalance} onClick={placeOrder} className={`w-full py-2 rounded font-semibold text-white ${hasBalance ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-400 cursor-not-allowed'}`}>
// //           {placed ? 'Placing...' : 'Place order'}
// //         </button>
// //       </div>
// //     </div>
// //   );
// // }

// // // ---------- Icons ----------
// // function MinusIcon() {
// //   return (
// //     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
// //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
// //     </svg>
// //   );
// // }
// // function PlusIcon() {
// //   return (
// //     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
// //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
// //     </svg>
// //   );
// // }
// // function MinusIconGray() {
// //   return (
// //     <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
// //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
// //     </svg>
// //   );
// // }

// // // ---------- DUMMY DATA ----------
// // function generateDummyOrders(n = 6) {
// //   const sides = ["yes", "no"];
// //   const statuses = ["open", "settled", "cancelled"];
// //   const events = [
// //     "West Delhi Lions vs East Delhi Riders",
// //     "City Derby: A vs B",
// //     "Champions Trophy Final",
// //   ];
// //   const arr = [];
// //   for (let i = 0; i < n; i++) {
// //     arr.push({
// //       id: `ORD-${1000 + i}`,
// //       event: events[i % events.length],
// //       side: sides[i % 2],
// //       price: 5.5 + (i % 6) * 0.5,
// //       qty: 1 + (i % 5),
// //       status: statuses[i % statuses.length],
// //       createdAt: new Date(Date.now() - i * 3600 * 1000).toISOString(),
// //     });
// //   }
// //   return arr;
// // }

// // function generateDummyTxns(n = 5) {
// //   const arr = [];
// //   for (let i = 0; i < n; i++) {
// //     arr.push({
// //       id: `TXN-${2000 + i}`,
// //       title: i % 2 === 0 ? "Recharge" : "Order Execution",
// //       date: new Date(Date.now() - i * 86400 * 1000).toLocaleDateString(),
// //       amount: i % 2 === 0 ? 1000 : -((i + 1) * 50),
// //     });
// //   }
// //   return arr;
// // }
