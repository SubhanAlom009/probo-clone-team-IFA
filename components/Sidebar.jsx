"use client";
import React from "react";

export default function Sidebar() {
  return (
    <aside className="hidden lg:block w-96">
      <div className="p-6 bg-white rounded-xl shadow-sm sticky top-24">
        <h4 className="text-lg text-gray-800 font-bold">DOWNLOAD APP FOR BETTER & FAST EXPERIENCE</h4>
        <p className="text-sm text-gray-500 mt-3">Get the mobile app for faster access and exclusive offers.</p>
        <button className="mt-6 px-6 py-3 bg-black text-white rounded-md">Download Now</button>
      </div>

      <div className="mt-6 p-6 bg-white rounded-xl shadow-sm">
        <h5 className="font-semibold text-gray-800">Watchlist</h5>
        <div className="mt-3 text-sm text-gray-600">You have no saved events yet.</div>
      </div>
    </aside>
  );
}
