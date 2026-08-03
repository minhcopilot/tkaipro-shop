"use client";

import dynamic from "next/dynamic";

// lazy load non-critical client components with ssr: false to improve INP
// this must be in a client component because ssr: false is not allowed in server components
const ChatWidget = dynamic(
  () => import("~/ui/components/chat").then(mod => ({ default: mod.ChatWidget })),
  { ssr: false }
);

const LiveOrderToast = dynamic(
  () => import("~/ui/components/live-order-toast").then(mod => ({ default: mod.LiveOrderToast })),
  { ssr: false }
);

const AnnouncementPopup = dynamic(
  () => import("~/ui/components/announcement-popup").then(mod => ({ default: mod.AnnouncementPopup })),
  { ssr: false }
);

const LegalNoticePopup = dynamic(
  () => import("~/ui/components/legal-notice-popup").then(mod => ({ default: mod.LegalNoticePopup })),
  { ssr: false }
);

const BackToTop = dynamic(
  () => import("~/ui/components/back-to-top").then(mod => ({ default: mod.BackToTop })),
  { ssr: false }
);

export function LayoutWidgets() {
  return (
    <>
      <LiveOrderToast />
      <ChatWidget />
      <LegalNoticePopup />
      <AnnouncementPopup />
      <BackToTop />
    </>
  );
}
