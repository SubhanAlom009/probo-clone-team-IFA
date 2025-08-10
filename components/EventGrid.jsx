"use client";
import React from "react";
import EventCard from "./EventCard";

export default function EventGrid({ events }) {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 my-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {events.map((ev) => (
          <EventCard key={ev.id} event={ev} />
        ))}
      </div>
    </div>
  );
}
