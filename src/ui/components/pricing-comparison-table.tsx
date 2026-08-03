"use client";

import { Check, Star, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";

import { formatPrice } from "~/lib/product-localization";

import { cn } from "~/lib/cn";
import { Badge } from "~/ui/primitives/badge";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";

const pricingMetadata = [
  {
    id: "1-month",
    price: 99000,
    originalPrice: 149000,
    pricePerMonth: 99000,
    savings: 34,
    popular: false,
    buttonVariant: "outline" as const,
    featureCount: 6
  },
  {
    id: "3-months",
    price: 279000,
    originalPrice: 297000,
    pricePerMonth: 86333,
    savings: 13,
    popular: true,
    buttonVariant: "default" as const,
    featureCount: 6
  },
  {
    id: "6-months",
    price: 499000,
    originalPrice: 594000,
    pricePerMonth: 83167,
    savings: 16,
    popular: false,
    buttonVariant: "outline" as const,
    featureCount: 6
  },
  {
    id: "12-months",
    price: 649000,
    originalPrice: 999000,
    pricePerMonth: 54083,
    savings: 35,
    popular: false,
    buttonVariant: "outline" as const,
    featureCount: 6
  }
];

export function PricingComparisonTable() {
  const t = useTranslations("Pricing");
  const locale = useLocale();
  const [selectedPlan, setSelectedPlan] = useState("3-months");

  const pricingPlans = pricingMetadata.map((plan) => ({
    ...plan,
    name: t(`plans.${plan.id}.name`),
    description: t(`plans.${plan.id}.description`),
    buttonText: t(`plans.${plan.id}.button`),
    features: Array.from({ length: plan.featureCount }, (_, i) => 
      t(`plans.${plan.id}.features.${i}`)
    )
  }));

  return (
    <section id="pricing" className="py-12 md:py-16">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            {t("title")}
          </h2>
          <div className="mt-2 h-1 w-12 rounded-full bg-primary mx-auto" />
          <p className="mt-4 text-lg text-muted-foreground">
            {t("description")}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4 md:grid-cols-2">
          {pricingPlans.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                "relative overflow-hidden transition-all duration-300 hover:shadow-lg",
                selectedPlan === plan.id && "ring-2 ring-primary",
                plan.popular && "border-primary/50 shadow-md"
              )}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground font-semibold px-3 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    {t("popular")}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-6">
                <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
                
                <div className="mt-4">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-3xl font-bold">
                      {formatPrice(plan.price, locale)}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(plan.originalPrice, locale)}
                    </span>
                    <Badge variant="destructive" className="text-xs">
                      -{plan.savings}%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {formatPrice(plan.pricePerMonth, locale)}{t("perMonth")}
                  </p>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href={`/products?plan=${plan.id}`} className="block">
                  <Button
                    className={cn(
                      "w-full mt-6",
                      plan.popular && "bg-primary hover:bg-primary/90"
                    )}
                    variant={plan.buttonVariant}
                    size="lg"
                  >
                    {plan.popular && <Zap className="h-4 w-4 mr-2" />}
                    {plan.buttonText}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>{t("guarantees.oneTime")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>{t("guarantees.noRenew")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>{t("guarantees.refund")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 