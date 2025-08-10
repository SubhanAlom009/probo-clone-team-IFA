"use client";
import React from "react";

const categories = [
  "All events",
  "Cricket",
  "Crypto",
  "Current Affairs",
  "Football",
  "Youtube",
  "Motorsports",
  "Stocks",
  "Gaming",
  "Basketball",
  "Chess",
  "Tennis",
];

export default function CategoryTabs({ selectedCategory, onCategoryChange }) {
  return (
    <div className="bg-white max-w-full border-b overflow-hidden">
      <div className="max-w-full mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-8 overflow-x-auto py-3 no-scrollbar ">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => onCategoryChange(c)}
              className={`flex-shrink-0 px-3 py-2 rounded-md text-sm transition cursor-pointer ${
                selectedCategory === c
                  ? "font-semibold border-b-2 text-black border-gray-800"
                  : "text-gray-900 hover:text-black"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
