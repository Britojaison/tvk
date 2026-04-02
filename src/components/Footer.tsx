import {
  PARTY_NAME,
  PARTY_ACRONYM,
  ELECTION_YEAR,
} from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="w-full mt-auto pt-6 pb-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Divider */}
        <div className="gold-divider mb-5" />

        <div className="text-center space-y-1.5">
          <p
            className="text-[#505050] text-[11px] font-semibold"
            style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}
          >
            {PARTY_NAME}
          </p>
          <p className="text-[#404040] text-[10px] tracking-wide">
            Authorized by {PARTY_ACRONYM} Election Committee {ELECTION_YEAR}
          </p>
          <p className="text-[#303030] text-[9px] tracking-wide mt-2">
            Powered by AI • Campaign Photo Generator
          </p>
        </div>
      </div>
    </footer>
  );
}
