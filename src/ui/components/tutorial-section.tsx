import { Play, Download, Settings, Zap, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import React from "react";
import { getTranslations } from "next-intl/server";

import { SEO_CONFIG } from "~/app";
import { Badge } from "~/ui/primitives/badge";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";

const MESSENGER_URL =
  SEO_CONFIG.supportContacts.messenger || SEO_CONFIG.supportContacts.facebook;
const TELEGRAM_URL = SEO_CONFIG.supportContacts.telegram
  ? `https://t.me/${SEO_CONFIG.supportContacts.telegram.replace(/^@/, "")}`
  : "";

export async function TutorialSection() {
  const t = await getTranslations("Tutorial");

  const tutorialSteps = [
    {
      step: 1,
      title: t("steps.1.title"),
      description: t("steps.1.description"),
      icon: <Download className="h-6 w-6 text-foreground" />,
      details: [0, 1, 2, 3].map(i => t(`steps.1.details.${i}`)),
      specialLink: {
        text: "www.figma.com",
        url: "https://www.figma.com"
      },
      duration: t("steps.1.duration"),
      difficulty: t("steps.1.difficulty")
    },
    {
      step: 2,
      title: t("steps.2.title"),
      description: t("steps.2.description"),
      icon: <Settings className="h-6 w-6 text-foreground" />,
      details: [0, 1, 2, 3].map(i => t(`steps.2.details.${i}`)),
      duration: t("steps.2.duration"),
      difficulty: t("steps.2.difficulty")
    },
    {
      step: 3,
      title: t("steps.3.title"),
      description: t("steps.3.description"),
      icon: <Zap className="h-6 w-6 text-foreground" />,
      details: [0, 1, 2, 3].map(i => t(`steps.3.details.${i}`)),
      duration: t("steps.3.duration"),
      difficulty: t("steps.3.difficulty")
    },
    {
      step: 4,
      title: t("steps.4.title"),
      description: t("steps.4.description"),
      icon: <Play className="h-6 w-6 text-foreground" />,
      details: [0, 1, 2, 3].map(i => t(`steps.4.details.${i}`)),
      duration: t("steps.4.duration"),
      difficulty: t("steps.4.difficulty")
    },
    {
      step: 5,
      title: t("steps.5.title"),
      description: t("steps.5.description"),
      icon: <CheckCircle className="h-6 w-6 text-foreground" />,
      details: [0, 1, 2, 3].map(i => t(`steps.5.details.${i}`)),
      duration: t("steps.5.duration"),
      difficulty: t("steps.5.difficulty")
    }
  ];

  const quickTips = [
    {
      title: t("tips.shortcuts.title"),
      tips: [0, 1, 2, 3].map(i => t(`tips.shortcuts.list.${i}`))
    },
    {
      title: t("tips.bestPractices.title"),
      tips: [0, 1, 2, 3].map(i => t(`tips.bestPractices.list.${i}`))
    },
    {
      title: t("tips.useCases.title"),
      tips: [0, 1, 2, 3].map(i => t(`tips.useCases.list.${i}`))
    }
  ];

  return (
    <section className="bg-muted/30 py-16 md:py-20">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("description")}
          </p>
        </div>

        {/* Download Section */}
        <div className="mb-12 text-center">
          <Card className="inline-block max-w-md mx-auto border-primary/50 bg-primary/5">
            <CardContent className="p-6">
              <Download className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">{t("download.title")}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t.rich("download.version", {
                  bold: (chunks) => <strong>{chunks}</strong>
                })}
              </p>
              <Link href="https://www.figma.com" target="_blank" rel="noopener noreferrer">
                <Button className="w-full mb-3">
                  <Download className="h-4 w-4 mr-2" />
                  {t("download.button")}
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground">
                {t("download.note")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tutorial Steps */}
        <div className="space-y-8 mb-12">
          {tutorialSteps.map((step, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row">
                  {/* Step Number & Icon */}
                  <div className="bg-primary/10 p-6 lg:w-48 flex flex-col items-center justify-center text-center">
                    <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-3">
                      {step.step}
                    </div>
                    <div className="mb-3">{step.icon}</div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {step.duration}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {step.difficulty}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6">
                    <h3 className="font-semibold text-xl mb-2">{step.title}</h3>
                    <p className="text-muted-foreground mb-4">{step.description}</p>
                    
                    <div className="space-y-2">
                      {step.details.map((detail, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm">
                            {detail}
                            {i === 0 && step.specialLink && (
                              <span>
                                {" "}
                                <Link 
                                  href={step.specialLink.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:text-primary/80 underline font-medium"
                                >
                                  {step.specialLink.text}
                                </Link>
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Tips */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {quickTips.map((section, index) => (
            <Card key={index} className="border-none bg-background">
              <CardHeader>
                <CardTitle className="text-lg">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {section.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{tip}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Support Notice */}
        <div className="mt-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-foreground" />
            <span>{t("support.freeSetup")}</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {MESSENGER_URL && (
              <Link href={MESSENGER_URL} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="inline-flex items-center">
                  {t("support.messenger")}
                </Button>
              </Link>
            )}
            {TELEGRAM_URL && (
              <Link href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="inline-flex items-center">
                  {t("support.telegram")}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
} 