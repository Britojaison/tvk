"use client";

import { useState } from "react";
import Image from "next/image";
import {
  CANDIDATE_NAME,
  CANDIDATE_NAME_TAMIL,
  CANDIDATE_CONSTITUENCY,
  CANDIDATE_CONSTITUENCY_TAMIL,
  PARTY_ACRONYM,
  IMAGES,
} from "@/lib/constants";

export default function CandidateCard() {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className="w-full mt-6 sm:mt-8 animate-fade-up delay-200 glass-card-strong p-4 sm:p-5"
    >
      <div className="shimmer-overlay" />

      <div className="relative z-10 flex items-center gap-4">
        {/* Candidate Photo */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl border border-[#F5A800]/30 overflow-hidden bg-[#1a0808]">
            {!imgError ? (
              <Image
                src={IMAGES.logo}
                alt={CANDIDATE_NAME}
                width={72}
                height={72}
                className="object-cover w-full h-full scale-150"
                priority
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-7 h-7 text-[#F5A800]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Candidate Info */}
        <div className="flex-1 min-w-0">
          <h2
            className="text-white text-base sm:text-lg font-bold leading-tight mb-0.5"
            style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}
          >
            {CANDIDATE_NAME_TAMIL}
          </h2>
          <p className="text-[#909090] text-xs truncate mb-2.5">
            {CANDIDATE_CONSTITUENCY}
          </p>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#C8102E] to-[#9e0c24]">
            <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
            <span className="text-white text-[10px] font-bold tracking-wider uppercase">
              {PARTY_ACRONYM} Candidate
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
