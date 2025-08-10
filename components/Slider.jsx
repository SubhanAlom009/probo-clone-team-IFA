import React, { useRef, useState } from "react";

const CategorySlider = ({ categories, onSelect }) => {
  const scrollRef = useRef(null);
  const [active, setActive] = useState(categories[0]?.slug || "");

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = direction === "left" ? -clientWidth / 2 : clientWidth / 2;
      scrollRef.current.scrollTo({
        left: scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleSelect = (slug) => {
    setActive(slug);
    if (onSelect) onSelect(slug);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => scroll("left")}
        className="px-2 py-1 bg-gray-200 rounded-full hover:bg-gray-300"
      >
   
      </button>

      <div
        ref={scrollRef}
        className="flex overflow-x-auto no-scrollbar gap-4 scroll-smooth"
      >
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => handleSelect(cat.slug)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-all duration-200 ${
              active === cat.slug
                ? "bg-black text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <button
        onClick={() => scroll("right")}
        className="px-2 py-1 bg-gray-200 text-black rounded-full hover:bg-gray-300"
      >
    
      </button>
    </div>
  );
};

// Example usage
export default function Slider() {
  const categories = [
    { name: "All events", slug: "events" },
    { name: "Cricket", slug: "cricket" },
    { name: "Crypto", slug: "crypto" },
    { name: "Current Affairs", slug: "news" },
    { name: "Football", slug: "football" },
    { name: "Youtube", slug: "youtube" },
    { name: "Motorsports", slug: "motorsports" },
    { name: "Stocks", slug: "stocks" },
    { name: "Gaming", slug: "esports" },
    { name: "Basketball", slug: "nba" },
    { name: "Chess", slug: "chess" },
    { name: "Tennis", slug: "tennis" },
    { name: "Probo", slug: "probo" },
  ];

  return (
    <div className="p-4">
      <CategorySlider
        categories={categories}
        onSelect={(slug) => console.log("Selected:", slug)}
      />
    </div>
  );
}
