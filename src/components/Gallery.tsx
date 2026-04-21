"use client";

import { useState } from "react";
import Image from "next/image";

const IMAGES = Array.from({ length: 10 }, (_, i) => ({
  src: `/images/${i + 1}.jpeg`,
  alt: `TVK Campaign Photo ${i + 1}`,
}));

export default function Gallery() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <div className="w-full mt-6 sm:mt-8 animate-fade-up delay-300">
      {/* Title */}
      <div className="text-center mb-5">
        <h2
          className="text-[#F5A800] text-lg sm:text-xl font-bold"
          style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}
        >
          பிரச்சார புகைப்படங்கள்
        </h2>
        <p className="text-[#707070] text-xs sm:text-sm mt-1">
          Campaign Photo Gallery
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3">
        {IMAGES.map((img, i) => (
          <div
            key={i}
            className="relative aspect-square rounded-2xl overflow-hidden border border-[#F5A800]/15 cursor-pointer group hover:border-[#F5A800]/40 transition-all"
            onClick={() => setSelectedImage(img.src)}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, 250px"
            />
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-lg w-full max-h-[80vh] animate-scale-in">
            <Image
              src={selectedImage}
              alt="Campaign Photo"
              width={1080}
              height={1080}
              className="w-full h-auto rounded-2xl object-contain"
            />
            <button
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white text-lg"
              onClick={() => setSelectedImage(null)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
