"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";

import { SEO_CONFIG } from "~/app";
import { cn } from "~/lib/cn";
import { Card, CardContent } from "~/ui/primitives/card";

const { email: SUPPORT_EMAIL, facebook: FACEBOOK_URL, messenger: MESSENGER_URL } =
  SEO_CONFIG.supportContacts;
const TELEGRAM_URL = SEO_CONFIG.supportContacts.telegram
  ? `https://t.me/${SEO_CONFIG.supportContacts.telegram.replace(/^@/, "")}`
  : "";

export function FAQSection() {
  const t = useTranslations("FAQ");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // Generate FAQ data from translations
  const faqData = [0, 1, 2, 3, 4, 5, 6, 7].map((index) => ({
    question: t(`items.${index}.question`),
    answer: t(`items.${index}.answer`)
  }));

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // FAQ Schema.org structured data
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqData.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <section className="py-12 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema)
        }}
      />
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-black tracking-tight md:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("description")}
          </p>
        </div>

        <div className="space-y-3">
          {faqData.map((faq, index) => (
            <Card
              key={index}
              className={cn(
                "cursor-pointer overflow-hidden border-border transition-colors",
                openIndex === index && "bg-muted/40"
              )}
              onClick={() => toggleFAQ(index)}
            >
              <CardContent className="p-0">
                <div
                  className={cn(
                    "flex items-center justify-between p-6 transition-colors",
                    openIndex === index && "bg-muted/50"
                  )}
                >
                  <h3 className="font-semibold text-lg pr-4 text-left">{faq.question}</h3>
                  <div className="flex-shrink-0">
                    {openIndex === index ? (
                      <ChevronUp className="h-5 w-5 text-primary" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
                
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    openIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <div className="px-6 pb-6">
                    <p className="text-muted-foreground leading-relaxed text-left">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="p-6 bg-muted/50 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">{t("stillHaveQuestions")}</h3>
            <p className="text-muted-foreground mb-4">
              {t("contactSupport")}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm max-w-2xl mx-auto">
              {TELEGRAM_URL && (
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <span className="font-medium">💬 Telegram:</span>
                <a href={TELEGRAM_URL} className="text-primary hover:text-primary/80 underline" target="_blank" rel="noopener noreferrer">
                  {t("telegram")}
                </a>
              </div>
              )}
              {MESSENGER_URL && (
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <span className="font-medium">💬 Messenger:</span>
                <a href={MESSENGER_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline">
                  {t("messenger")}
                </a>
              </div>
              )}
              {FACEBOOK_URL && (
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <span className="font-medium">📘 Facebook:</span>
                <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline">
                  {t("fanpage")}
                </a>
              </div>
              )}
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <span className="font-medium">💙 Zalo:</span>
                <a href="https://zalo.me/g/zdddrp402" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline">
                  {t("zaloGroup")}
                </a>
              </div>
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <span className="font-medium">👥 Facebook:</span>
                <a href="https://www.facebook.com/share/g/16qjrs4XeH/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline">
                  {t("facebookGroup")}
                </a>
              </div>
              {SUPPORT_EMAIL && (
              <div className="flex items-center gap-2 md:col-span-2 justify-center">
                <span className="font-medium">📧 {t("email")}:</span>
                <span className="text-primary">{SUPPORT_EMAIL}</span>
              </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 