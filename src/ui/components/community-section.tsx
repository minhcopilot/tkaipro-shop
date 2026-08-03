"use client";

import { Users, MessageCircle, ArrowRight, Facebook } from "lucide-react";
import { useTranslations } from "next-intl";

import { SEO_CONFIG } from "~/app";
import { Card, CardContent } from "~/ui/primitives/card";

const TELEGRAM_URL = SEO_CONFIG.supportContacts.telegram
  ? `https://t.me/${SEO_CONFIG.supportContacts.telegram.replace(/^@/, "")}`
  : "";

function ZaloIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="currentColor">
      <path d="M24 4C12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20S35.046 4 24 4zm7.046 26.106c-.18.2-.46.31-.76.31h-4.08c-.48 0-.74-.32-.74-.62v-6.37l-2.34 6.58c-.1.28-.38.41-.68.41h-1.7c-.3 0-.58-.13-.68-.41l-2.34-6.58v6.37c0 .3-.26.62-.74.62h-4.08c-.3 0-.58-.11-.76-.31-.18-.2-.24-.48-.16-.76l3.34-11.38c.12-.38.46-.62.86-.62h2.76c.28 0 .54.14.68.38l3.22 6.96 3.22-6.96c.14-.24.4-.38.68-.38h2.76c.4 0 .74.24.86.62l3.34 11.38c.08.28.02.56-.16.76z"/>
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return <Facebook className={className} />;
}

export function CommunitySection() {
  const t = useTranslations("Community");

  const communities = [
    {
      name: "Facebook",
      description: t("facebook.description"),
      icon: FacebookIcon,
      href: "https://www.facebook.com/groups/figmaprovietnam/",
      members: "1000+",
    },
    {
      name: "Zalo",
      description: t("zalo.description"),
      icon: ZaloIcon,
      href: "https://zalo.me/g/zdddrp402",
      members: "500+",
    },
    ...(TELEGRAM_URL
      ? [
          {
            name: "Telegram",
            description: t("telegram.description"),
            icon: TelegramIcon,
            href: TELEGRAM_URL,
            members: "200+",
          },
        ]
      : []),
  ];

  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-brand p-8 text-primary-foreground shadow-soft-lg md:p-12">
          <div className="mb-10 text-center">
            <p className="mb-3 inline-block rounded-full bg-background px-3 py-1 text-sm font-semibold text-foreground shadow-soft-sm">
              {t("badge")}
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-primary-foreground md:text-4xl">
              {t("title")}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl font-medium text-primary-foreground/90 md:text-lg">
              {t("description")}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {communities.map((community) => {
              const Icon = community.icon;
              return (
                <a
                  key={community.name}
                  href={community.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <Card className="h-full bg-background transition-all hover:-translate-y-0.5 hover:shadow-soft-lg">
                    <CardContent className="flex items-center gap-4 p-6">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground shadow-soft-sm">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">
                            {t(`${community.name.toLowerCase()}.title`)}
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            {community.members} {t("members")}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {community.description}
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
                    </CardContent>
                  </Card>
                </a>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm font-bold text-primary-foreground">
            <div className="flex items-center gap-1.5">
              <MessageCircle className="h-4 w-4" />
              <span>{t("benefits.support")}</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>{t("benefits.network")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
