"use client";
import React from "react";
import Link from "next/link";

export default function EventCard({ event }) {
  return (
    <Link href={`/event-page/${event.id}`} className="block">
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-5 flex flex-col h-full">
        <div className="flex gap-4 items-start">
          <div className="w-24 h-24 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
            <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800">{event.title}</h3>
            <p className="text-sm text-gray-500 mt-3">{event.description}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <button className="py-3 bg-blue-50 text-blue-700 rounded-md font-semibold">Yes ₹{event.yes}</button>
          <button className="py-3 bg-red-50 text-red-700 rounded-md font-semibold">No ₹{event.no}</button>
        </div>
      </div>
    </Link>
  );
}
