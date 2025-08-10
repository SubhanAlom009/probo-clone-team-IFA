"use client";
import React from "react";

const topics = [
  { title: "WEFvLNS", badge: "LIVE", img: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=200&q=80" },
  { title: "Bitcoin", badge: "LIVE", img: "https://images.unsplash.com/photo-1548576093-ec0b7f84a5dd?w=200&q=80" },
  { title: "Youtube", badge: "LIVE", img: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=200&q=80" },
  { title: "EDRvSDS", img: "https://images.unsplash.com/photo-1549880338-65ddcdfd017b?w=200&q=80" },
  { title: "Breaking News", img: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=200&q=80" },
  { title: "BGMI IBS-Grand Finals", img: "https://images.unsplash.com/photo-1608495401626-8f7a0ddcd1b5?w=200&q=80" },
  { title: "FFM India Cup", img: "https://images.unsplash.com/photo-1532634896-26909d0d5c02?w=200&q=80" },
];

export default function EventSlider() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 my-5">
      <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
        {topics.map((t, idx) => (
          <div
            key={idx}
            className="bg-white rounded-lg shadow px-4 py-2 flex items-center gap-3 min-w-[220px] flex-shrink-0"
          >
            <div className="w-10 h-10 rounded-md overflow-hidden">
              <img
                src={t.img}
                alt={t.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-sm text-black font-medium whitespace-nowrap">{t.title}</div>
            {t.badge && (
              <div className="ml-auto text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded whitespace-nowrap">
                LIVE
              </div>
            )}
          </div>
        ))}
      </div>
      <style jsx>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .no-scrollbar {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
      `}</style>
    </div>
  );
}
