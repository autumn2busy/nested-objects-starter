"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";

export function OutsetaProfileWidget({ tab, planUid }: { tab?: string; planUid?: string }) {
  const { isAuthenticated } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isParsed, setIsParsed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attemptCountRef = useRef(0);
  const maxAttempts = 30; // Try for up to 15 seconds (30 * 500ms)

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    if (!containerRef.current) return;

    let cancelled = false;
    attemptCountRef.current = 0;

    // Function to check if Outseta is fully ready
    const isOutsetaReady = () => {
      return !!(
        window.Outseta &&
        window.Outseta.c &&
        typeof window.Outseta.c.parse === 'function' &&
        window.Outseta.getJwtPayload
      );
    };

    // Function to attempt parsing
    const parseWidget = () => {
      if (cancelled || isParsed) return;

      attemptCountRef.current++;

      if (!isOutsetaReady()) {
        if (attemptCountRef.current >= maxAttempts) {
          setError("Outseta is taking longer than expected to load. Please refresh the page.");
          setIsLoading(false);
        }
        return;
      }

      if (!containerRef.current) return;

      try {
        // Try to parse the specific container
        window.Outseta.c.parse(containerRef.current);
        setIsParsed(true);
        setIsLoading(false);
        setError(null);
      } catch (e) {
        console.warn("Outseta container parse failed, trying global parse", e);
        try {
          // Fallback to global parse
          window.Outseta.c.parse();
          setIsParsed(true);
          setIsLoading(false);
          setError(null);
        } catch (err) {
          console.error("Outseta global parse failed", err);
          if (attemptCountRef.current >= maxAttempts) {
            setError("Unable to load profile widget. Please refresh the page.");
            setIsLoading(false);
          }
        }
      }
    };

    // 1. Initial immediate attempt
    parseWidget();

    // 2. Polling mechanism with increasing intervals
    const pollInterval = setInterval(() => {
      if (isParsed || cancelled) {
        clearInterval(pollInterval);
        return;
      }
      parseWidget();
    }, 500);

    // 3. DOM mutation observer as a backup
    const observer = new MutationObserver(() => {
      if (!isParsed && !cancelled && isOutsetaReady()) {
        parseWidget();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-outseta-loaded']
    });

    // 4. Listen for Outseta load event if available
    const handleOutsetaLoad = () => {
      if (!cancelled && !isParsed) {
        parseWidget();
      }
    };

    window.addEventListener('outsetaLoaded', handleOutsetaLoad);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
      observer.disconnect();
      window.removeEventListener('outsetaLoaded', handleOutsetaLoad);
    };
  }, [isAuthenticated, isParsed, tab, planUid]);

  if (!isAuthenticated) return null;

  return (
    <div className="w-full min-h-[600px] bg-white relative">
      {isLoading && !isParsed && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-copper border-t-transparent"></div>
            <p className="text-sm text-text-secondary">Loading your profile...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        data-o-profile="1"
        data-tab={tab || "profile"}
        data-plan-uid={planUid}
        data-mode="embed"
        className="w-full min-h-[600px]"
      />
    </div>
  );
}
