"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { generateCampaignPhoto } from "@/lib/gemini";
import { downloadImage, shareOnWhatsApp, nativeShare } from "@/lib/utils";
import {
  CANDIDATE_NAME,
  CANDIDATE_NAME_TAMIL,
  PARTY_ACRONYM,
  WHATSAPP_MESSAGE,
  STATUS_MESSAGES,
} from "@/lib/constants";

type FlowState = "idle" | "camera" | "generating" | "result";

export default function SelfieFlow() {
  const [state, setState] = useState<FlowState>("idle");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [statusIndex, setStatusIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [canNativeShare, setCanNativeShare] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check native share support
  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== "undefined" &&
      !!navigator.share &&
      !!navigator.canShare
    );
  }, []);

  // Attach stream to video element — retry loop ensures video ref is ready after render
  useEffect(() => {
    if (state !== "camera" || !streamRef.current) return;

    let attempts = 0;
    const maxAttempts = 20; // 20 * 100ms = 2 seconds max wait

    const attachStream = () => {
      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = streamRef.current;
        video.play().catch((err) => {
          console.error("Video play error:", err);
        });
        return true;
      }
      return false;
    };

    // Try immediately first
    if (attachStream()) return;

    // If video ref isn't ready yet, retry
    const interval = setInterval(() => {
      attempts++;
      if (attachStream() || attempts >= maxAttempts) {
        clearInterval(interval);
        if (attempts >= maxAttempts) {
          console.error("Could not attach stream to video element after retries");
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [state]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Start camera — request permission immediately on user gesture
  const startCamera = useCallback(async () => {
    setError(null);
    setCameraError(null);

    // If camera is already active, don't request again
    if (streamRef.current) {
      setState("camera");
      return;
    }

    try {
      console.log("[CAMERA] Requesting camera permission...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1080 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      console.log("[CAMERA] Permission granted, stream received");
      streamRef.current = stream;
      setState("camera");
    } catch (err: any) {
      console.error("Camera error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError(
          "📷 கேமரா அனுமதி தேவை! Camera permission was denied. Please allow camera access in your browser settings and try again."
        );
      } else if (err.name === "NotFoundError") {
        setCameraError(
          "📷 கேமரா கிடைக்கவில்லை! No camera found on this device."
        );
      } else {
        setCameraError(
          "📷 கேமரா அனுமதி தேவை! Camera permission required. Please allow camera access."
        );
      }
    }
  }, []);

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = 1080;
    canvas.height = 1080;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;

    // Mirror for selfie
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 1080, 1080);

    const dataURL = canvas.toDataURL("image/jpeg", 0.95);
    setCapturedImage(dataURL);
    stopCamera();
    startGeneration(dataURL);
  }, [stopCamera]);

  // Start AI generation
  const startGeneration = async (selfieDataURL: string) => {
    setState("generating");
    setStatusIndex(0);
    setProgress(5); // Start at 5% immediately to show activity
    setError(null);

    const statusInterval = setInterval(() => {
      setStatusIndex((prev) =>
        prev >= STATUS_MESSAGES.length - 1 ? prev : prev + 1
      );
    }, 4000);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        const inc = Math.random() * 5 + 2; // Smooth small increments
        return prev + inc;
      });
    }, 800); // Faster updates for better UX

    try {
      const base64 = selfieDataURL.split(",")[1];
      const result = await generateCampaignPhoto(base64, "image/jpeg");

      if (!result) throw new Error("Could not create photo. Please try again.");

      setGeneratedImage(result);
      setProgress(100);
      setState("result");
    } catch (err) {
      console.error("Generation error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Generation failed. Please check your connection."
      );
      setState("idle");
    } finally {
      clearInterval(statusInterval);
      clearInterval(progressInterval);
    }
  };

  const cancelCamera = () => {
    stopCamera();
    setState("idle");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataURL = event.target?.result as string;
      setCapturedImage(dataURL);
      startGeneration(dataURL);
    };
    reader.onerror = () => setError("Failed to read file.");
    reader.readAsDataURL(file);
  };

  const retake = () => {
    setCapturedImage(null);
    setGeneratedImage(null);
    setError(null);
    setStatusIndex(0);
    setProgress(0);
    setState("idle");
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    try {
      // Use blob approach for better mobile compatibility
      const parts = generatedImage.split(",");
      const mime = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
      const bstr = atob(parts[1]);
      const u8arr = new Uint8Array(bstr.length);
      for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
      const blob = new Blob([u8arr], { type: mime });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `TVK-${CANDIDATE_NAME.replace(/\s/g, "-")}-Campaign.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      console.error("Download error:", err);
      // Fallback
      downloadImage(generatedImage, `TVK-${CANDIDATE_NAME.replace(/\s/g, "-")}-Campaign.jpg`);
    }
  };

  const handleWhatsApp = async () => {
    if (!generatedImage) return;

    // Try native share with image first (works on mobile)
    try {
      const parts = generatedImage.split(",");
      const mime = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
      const bstr = atob(parts[1]);
      const u8arr = new Uint8Array(bstr.length);
      for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
      const blob = new Blob([u8arr], { type: mime });
      const file = new File([blob], "tvk-campaign-photo.jpg", { type: "image/jpeg" });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          text: WHATSAPP_MESSAGE,
          files: [file],
        });
        return;
      }
    } catch (err) {
      console.log("Native share failed, falling back to WhatsApp link:", err);
    }

    // Fallback: open WhatsApp with text only
    shareOnWhatsApp(WHATSAPP_MESSAGE);
  };

  const handleNativeShare = async () => {
    if (!generatedImage) return;

    try {
      const parts = generatedImage.split(",");
      const mime = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
      const bstr = atob(parts[1]);
      const u8arr = new Uint8Array(bstr.length);
      for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
      const blob = new Blob([u8arr], { type: mime });
      const file = new File([blob], "tvk-campaign-photo.jpg", { type: "image/jpeg" });

      if (navigator.share && navigator.canShare) {
        const shareData: ShareData = {
          title: `${PARTY_ACRONYM} Campaign Photo`,
          text: WHATSAPP_MESSAGE,
          files: [file],
        };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      }
    } catch (err) {
      console.log("Share cancelled or failed:", err);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  // Step indicator component
  const StepIndicator = ({ activeStep }: { activeStep: number }) => (
    <div className="flex items-center justify-center gap-2 mt-5">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`step-dot ${i === activeStep ? "active" : ""}`}
        />
      ))}
    </div>
  );

  return (
    <div className="w-full mt-5 sm:mt-6 animate-fade-up delay-400">
      <canvas ref={canvasRef} className="hidden" />

      {/* ═══════ IDLE STATE ═══════ */}
      {state === "idle" && (
        <div className="space-y-5">
          {/* Title */}
          <div className="text-center">
            <h2
              className="text-[#F5A800] text-lg sm:text-xl font-bold"
              style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}
            >
              செல்ஃபி எடுங்கள்!
            </h2>
            <p className="text-[#707070] text-xs sm:text-sm mt-1">
              Take a selfie with Vijay &amp; our candidate
            </p>
          </div>

          {/* Camera Preview Area */}
          <div
            className="relative aspect-square w-full rounded-2xl sm:rounded-3xl overflow-hidden glass-card flex flex-col items-center justify-center cursor-pointer group"
            onClick={startCamera}
          >
            <div className="viewfinder-corner viewfinder-tl" />
            <div className="viewfinder-corner viewfinder-tr" />
            <div className="viewfinder-corner viewfinder-bl" />
            <div className="viewfinder-corner viewfinder-br" />

            {/* Camera icon */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#C8102E]/15 border border-[#C8102E]/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg
                className="w-7 h-7 sm:w-9 sm:h-9 text-[#F5A800]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>

            <p
              className="text-[#808080] text-sm sm:text-base"
              style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}
            >
              கேமரா திற
            </p>
            <p className="text-[#505050] text-xs mt-1">Tap to open camera</p>
          </div>

          {/* CTA Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={startCamera}
              className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-[#C8102E] to-[#a00d24] text-white font-bold text-sm sm:text-base tracking-wide btn-glow flex items-center justify-center gap-2"
            >
              <span>📸</span> Open Camera / கேமரா திற
            </button>

            <label className="w-full py-3.5 sm:py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 cursor-pointer hover:bg-white/10 transition-all">
              <span>📁</span> Choose Photo / படம் சேர்
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {/* Error messages */}
          {cameraError && (
            <div className="p-3 rounded-xl bg-[#C8102E]/10 border border-[#C8102E]/20">
              <p className="text-[#F5A800] text-xs text-center leading-relaxed">
                {cameraError}
              </p>
            </div>
          )}
          {error && (
            <div className="p-3 rounded-xl bg-[#C8102E]/10 border border-[#C8102E]/20">
              <p className="text-[#F5A800] text-xs text-center">{error}</p>
            </div>
          )}

          <StepIndicator activeStep={0} />
        </div>
      )}

      {/* ═══════ CAMERA ACTIVE ═══════ */}
      {state === "camera" && (
        <div className="space-y-4">
          {/* Live viewfinder */}
          <div className="relative aspect-square w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-[#F5A800]/30 bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
            <div className="viewfinder-corner viewfinder-tl" />
            <div className="viewfinder-corner viewfinder-tr" />
            <div className="viewfinder-corner viewfinder-bl" />
            <div className="viewfinder-corner viewfinder-br" />

            {/* Center crosshair */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-12 rounded-full border border-white/20" />
            </div>
          </div>

          {/* Capture button */}
          <button
            onClick={capturePhoto}
            className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-[#C8102E] to-[#a00d24] text-white font-bold text-sm sm:text-base btn-glow"
          >
            📷 Capture Photo / புகைப்படம் எடு
          </button>

          <button
            onClick={cancelCamera}
            className="w-full py-2.5 text-[#606060] text-xs hover:text-[#909090] transition-colors text-center"
          >
            Cancel
          </button>

          <StepIndicator activeStep={1} />
        </div>
      )}

      {/* ═══════ GENERATING ═══════ */}
      {state === "generating" && (
        <div className="space-y-4">
          <div className="relative aspect-square w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-[#F5A800]/20">
            {capturedImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={capturedImage}
                alt="Your selfie"
                className="w-full h-full object-cover"
              />
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center px-6">
              {/* Spinner */}
              <div className="relative w-14 h-14 mb-5">
                <div className="absolute inset-0 rounded-full border-[3px] border-[#F5A800]/10" />
                <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#F5A800] animate-spin" />
                <div className="absolute inset-2 rounded-full border-[2px] border-transparent border-b-[#C8102E] animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
              </div>

              <p
                className="text-[#F5A800] text-sm sm:text-base font-semibold text-center mb-1"
                style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}
              >
                {STATUS_MESSAGES[statusIndex]?.tamil}
              </p>
              <p className="text-[#808080] text-xs sm:text-sm text-center">
                {STATUS_MESSAGES[statusIndex]?.english}
              </p>

              {/* Progress */}
              <div className="w-full max-w-[200px] mt-5">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <p className="text-[#505050] text-[10px] text-center mt-1.5">
                  {Math.round(Math.min(progress, 100))}%
                </p>
              </div>
            </div>
          </div>

          <StepIndicator activeStep={2} />
        </div>
      )}

      {/* ═══════ RESULT ═══════ */}
      {state === "result" && generatedImage && (
        <div className="space-y-4 animate-scale-in">
          {/* Success banner */}
          <div className="flex items-center gap-3 p-3 sm:p-4 rounded-2xl bg-emerald-950/50 border border-emerald-800/40">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <p
                className="text-gray-100 text-sm font-bold"
                style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}
              >
                உங்கள் photo தயார்!
              </p>
              <p className="text-gray-400 text-[10px] sm:text-[11px] mt-0.5">
                Your campaign photo is ready!
              </p>
            </div>
          </div>

          {/* Generated Image */}
          <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-[#F5A800]/20 bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={generatedImage}
              alt="Campaign photo"
              className="w-full aspect-square object-cover"
            />

            {/* Bottom label */}
            <div className="absolute bottom-0 left-0 right-0 py-2.5 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
              <p className="text-[#F5A800] text-[10px] sm:text-xs font-bold tracking-[0.15em] uppercase text-center">
                {CANDIDATE_NAME_TAMIL} | {PARTY_ACRONYM} 2026
              </p>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <button
              onClick={handleWhatsApp}
              className="py-3 sm:py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </button>

            <button
              onClick={handleDownload}
              className="py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-[#F5A800] to-[#d49200] hover:from-[#d49200] hover:to-[#b37e00] text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
          </div>

          {/* Native share */}
          {canNativeShare && (
            <button
              onClick={handleNativeShare}
              className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#909090] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share via Other Apps
            </button>
          )}

          {/* Retake */}
          <button
            onClick={retake}
            className="w-full py-3 rounded-2xl border border-[#333] hover:border-[#555] text-[#707070] hover:text-[#999] font-bold text-xs sm:text-sm transition-all text-center"
          >
            🔄 Retake / மீண்டும் எடு
          </button>

          <StepIndicator activeStep={3} />
        </div>
      )}
    </div>
  );
}
