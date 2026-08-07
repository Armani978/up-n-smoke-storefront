"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="checkout-complete">
      <AlertTriangle />
      <span>SIGNAL INTERRUPTED</span>
      <h1>TRY IT<br /><em>AGAIN.</em></h1>
      <p>Something went sideways. Your cart is still saved on this device.</p>
      <Button onClick={reset}>Retry</Button>
    </main>
  );
}
