"use client";

import { Share2, Facebook, Send, Link, Check } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { cn } from "~/lib/cn";
import { Button } from "~/ui/primitives/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/ui/primitives/dropdown-menu";

type SocialShareButtonsProps = {
  productName: string;
  productSlug: string;
  className?: string;
  variant?: "icon" | "dropdown";
};

export function SocialShareButtons({
  productName,
  productSlug,
  className,
  variant = "dropdown",
}: SocialShareButtonsProps) {
  const t = useTranslations("SocialShare");
  const [copied, setCopied] = React.useState(false);

  const productUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/products/${productSlug}`
      : `/products/${productSlug}`;

  const shareText = t("shareText", { productName });

  const handleShareFacebook = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(facebookUrl, "_blank", "width=600,height=400");
  };

  const handleShareTelegram = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(telegramUrl, "_blank", "width=600,height=400");
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      toast.success(t("linkCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  if (variant === "icon") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-full hover:bg-blue-500/10 hover:text-blue-500"
          onClick={handleShareFacebook}
          title={t("facebook")}
        >
          <Facebook className="h-4 w-4" />
          <span className="sr-only">{t("facebook")}</span>
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-full hover:bg-sky-500/10 hover:text-sky-500"
          onClick={handleShareTelegram}
          title={t("telegram")}
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">{t("telegram")}</span>
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            "h-8 w-8 rounded-full",
            copied
              ? "text-green-500"
              : "hover:bg-muted hover:text-foreground"
          )}
          onClick={handleCopyLink}
          title={t("copyLink")}
        >
          {copied ? <Check className="h-4 w-4" /> : <Link className="h-4 w-4" />}
          <span className="sr-only">{t("copyLink")}</span>
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className={cn(
            "h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm",
            className
          )}
          onClick={(e) => e.preventDefault()}
        >
          <Share2 className="h-4 w-4" />
          <span className="sr-only">{t("share")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          className="cursor-pointer gap-2"
          onClick={handleShareFacebook}
        >
          <Facebook className="h-4 w-4 text-blue-500" />
          <span>{t("facebook")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-2"
          onClick={handleShareTelegram}
        >
          <Send className="h-4 w-4 text-sky-500" />
          <span>{t("telegram")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-2"
          onClick={handleCopyLink}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Link className="h-4 w-4 text-muted-foreground" />
          )}
          <span>{copied ? t("copied") : t("copyLink")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
