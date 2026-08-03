"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const COOKIE_NAME = "shop_cookie_consent_v1";

function readConsent(): string | null {
  if (typeof document === "undefined") return null;
  const target = `${COOKIE_NAME}=`;
  return (
    document.cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(target))
      ?.slice(target.length) ?? null
  );
}

/** Load Microsoft Clarity only when user opted in via cookie consent banner. */
export function AnalyticsLoader() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const sync = () => setEnabled(readConsent() === "all");
    sync();
    window.addEventListener("shop:analytics-consent", sync);
    return () => window.removeEventListener("shop:analytics-consent", sync);
  }, []);

  if (!enabled) return null;

  return (
    <Script
      id="microsoft-clarity-opt-in"
      strategy="lazyOnload"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i+"?ref=bwt";
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "uxph4wmshv");
        `,
      }}
    />
  );
}
