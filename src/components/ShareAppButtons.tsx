import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SHARE_MESSAGE, shareApp } from "@/lib/shareApp";

export function ShareAppButtons() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_MESSAGE);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button type="button" onClick={() => { void shareApp(); }}>📲 Share App</Button>
      <Button type="button" variant="outline" onClick={() => { void copy(); }}>{copied ? "✅ Copied" : "Copy message"}</Button>
    </div>
  );
}
