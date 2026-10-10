import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "edureport-install-dismissed";

/**
 * "Install app" banner shown to website visitors on Android/Chrome.
 * Uses the browser's beforeinstallprompt event; on iPhone it shows
 * manual Add to Home Screen instructions instead.
 */
export function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY)) return;
    // Already installed as an app — never show.
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIos) {
      setIos(true);
      setShow(true);
      return;
    }

    function onPrompt(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!show) return null;

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") setShow(false);
    setDeferred(null);
  }

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  }

  return (
    <div className="no-print fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-lg">
      <img src="/icon-192.png" alt="EduReport app icon" className="h-11 w-11 rounded-lg" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">Install EduReport app</p>
        <p className="text-xs text-muted-foreground">
          {ios ? "Tap the Share button, then “Add to Home Screen”." : "Add it to your home screen — opens like a real app."}
        </p>
      </div>
      {!ios && deferred && (
        <button
          onClick={install}
          className="h-9 shrink-0 rounded-md bg-primary px-4 text-xs font-bold text-primary-foreground"
        >
          Install
        </button>
      )}
      <button onClick={dismiss} aria-label="Dismiss install banner" className="shrink-0 px-1 text-muted-foreground">
        ✕
      </button>
    </div>
  );
}
