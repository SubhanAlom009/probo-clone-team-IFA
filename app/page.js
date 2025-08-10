"use client";
import React, { useState } from "react";
import CategoryTabs from "@/components/CategoryTabs";
import EventSlider from "@/components/EventSlider";
import EventGrid from "@/components/EventGrid";
import Sidebar from "@/components/Sidebar";
import EventInfo from "@/components/EventInfo";
import Footer from "@/components/Footer";
import { events } from "@/lib/events";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("All events");

  const filteredEvents =
    selectedCategory === "All events"
      ? events
      : events.filter((e) => e.category === selectedCategory);

  return (
    <div className="min-h-screen max-w-full bg-gray-50">
      <CategoryTabs
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />
      <EventSlider />

      <div className="mw-full mx-auto px-4 md:px-6 lg:px-8 mt-6 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        <main>
          <h2 className="text-2xl text-gray-800 font-bold mb-4">{selectedCategory}</h2>
          <EventGrid events={filteredEvents} />
        </main>
        <Sidebar />
      </div>
      

      <EventInfo />
      <Footer />
    </div>
  );
}
