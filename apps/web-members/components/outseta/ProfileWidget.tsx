"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";

export function OutsetaProfileWidget({ tab, planUid }: { tab?: string; planUid?: string }) {
  const { isAuthenticated } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const parsedRef = useRef(false);
  const attemptCountRef = useRef(0);
  const maxAttempts = 40; // Try for up to 4 seconds (40 * 100ms)

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      parsedRef.current = false;
      return;
    }
    if (!containerRef.current) return;

    // Reset state when tab/planUid changes
    parsedRef.current = false;
    setIsLoading(true);
    setError(null);
    attemptCountRef.current = 0;

    let cancelled = false;

    // Function to check if Outseta is fully ready
    const isOutsetaReady = () => {
      return !!(
        window.Outseta &&
        window.Outseta.c &&
        typeof window.Outseta.c.parse === 'function'
      );
    };

    // Helper: check if widget has been mounted (Outseta injected content)
    const isMounted = () => {
      const el = containerRef.current;
      return el ? el.childNodes.length > 0 : false;
    };

    // Function to attempt parsing
    const parseWidget = () => {
      if (cancelled || parsedRef.current) return;

      attemptCountRef.current++;

      if (!isOutsetaReady()) {
        if (attemptCountRef.current >= maxAttempts) {
          setError("Outseta is taking longer than expected to load. Please refresh the page.");
          setIsLoading(false);
        }
        return;
      }

      const el = containerRef.current;
      if (!el) return;

      try {
        // Try to parse the specific container
        window.Outseta.c.parse(el);
        parsedRef.current = true;
        setIsLoading(false);
        setError(null);
      } catch (e) {
        console.warn("Outseta container parse failed, trying global parse", e);
        try {
          // Fallback to global parse
          window.Outseta.c.parse();
          parsedRef.current = true;
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
    if (isOutsetaReady()) {
      parseWidget();
    }

    // 2. Polling mechanism
    const pollInterval = setInterval(() => {
      if (parsedRef.current || cancelled || isMounted()) {
        if (isMounted()) {
          parsedRef.current = true;
          setIsLoading(false);
        }
        clearInterval(pollInterval);
        return;
      }
      parseWidget();
    }, 100);

    // 3. DOM mutation observer to detect when Outseta injects content
    const observer = new MutationObserver(() => {
      if (isMounted() && !parsedRef.current && !cancelled) {
        parsedRef.current = true;
        setIsLoading(false);
        setError(null);
        observer.disconnect();
      } else if (!parsedRef.current && !cancelled && isOutsetaReady()) {
        parseWidget();
      }
    });

    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
    });

    // Safety timeout
    const timeoutId = setTimeout(() => {
      if (!parsedRef.current && !isMounted() && !cancelled) {
        setIsLoading(false);
        setError("Profile widget is taking longer than expected. Please refresh the page.");
      }
    }, 6000);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [isAuthenticated, tab, planUid]);

  if (!isAuthenticated) return null;

  return (
    <div className="w-full min-h-[600px] bg-white relative">
      {isLoading && (
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
