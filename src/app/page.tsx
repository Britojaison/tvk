import Header from "@/components/Header";
import CandidateCard from "@/components/CandidateCard";
import Gallery from "@/components/Gallery";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="flex flex-col items-center w-full min-h-screen min-h-[100dvh]">
      <Header />

      <div className="flex flex-col items-center w-full max-w-lg px-4 sm:px-6 flex-1">
        <CandidateCard />
        <Gallery />
      </div>

      <Footer />
    </main>
  );
}
