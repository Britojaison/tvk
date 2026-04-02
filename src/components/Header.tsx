"use client";

import { useState } from "react";
import Image from "next/image";
import {
  PARTY_NAME,
  PARTY_NAME_ENGLISH,
  PARTY_ACRONYM,
  ELECTION_YEAR,
  IMAGES,
} from "@/lib/constants";

export default function Header() {
  const [logoError, setLogoError] = useState(false);

  return (
    <header className="w-full sticky top-0 z-40">
      {/* Glass backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: "rgba(10, 0, 0, 0.75)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      />

      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background:
            "linear-gradient(90deg, transparent, #C8102E 30%, #F5A800 50%, #C8102E 70%, transparent)",
        }}
      />

      <div className="relative z-10 flex items-center gap-3 px-4 sm:px-6 py-3 max-w-lg mx-auto w-full">
        {/* Logo */}
        <div className="flex-shrink-0 w-11 h-11 rounded-full border border-[#F5A800]/40 overflow-hidden bg-[#C8102E] animate-pulse-glow">
          {!logoError ? (
            <Image
              src={IMAGES.logo}
              alt={`${PARTY_ACRONYM} Logo`}
              width={44}
              height={44}
              className="object-cover w-full h-full"
              onError={() => setLogoError(true)}
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-white font-bold text-sm tracking-widest">
                {PARTY_ACRONYM}
              </span>
            </div>
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <h1
            className="text-[#F5A800] text-base sm:text-lg font-bold leading-tight truncate"
            style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}
          >
            {PARTY_NAME}
          </h1>
          <p className="text-[#808080] text-[10px] sm:text-[11px] tracking-[0.08em] uppercase font-medium truncate">
            {PARTY_NAME_ENGLISH}
          </p>
        </div>

        {/* Election badge */}
        <div className="flex-shrink-0 px-2.5 py-1 rounded-full bg-[#C8102E]/20 border border-[#C8102E]/40">
          <span className="text-[#C8102E] text-[10px] font-bold tracking-wider">
            {ELECTION_YEAR}
          </span>
        </div>
      </div>

      {/* Bottom border */}
      <div className="absolute bottom-0 left-0 right-0 gold-divider" />
    </header>
  );
}
