import Header from "@/components/Header";
import CandidateCard from "@/components/CandidateCard";
import SelfieFlow from "@/components/SelfieFlow";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="flex flex-col items-center w-full min-h-screen min-h-[100dvh]">
      {/* Sticky Header */}
      <Header />

      {/* Content Container — responsive width */}
      <div className="flex flex-col items-center w-full max-w-lg px-4 sm:px-6 flex-1">
        <CandidateCard />
        <SelfieFlow />
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
}
