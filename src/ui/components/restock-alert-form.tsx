"use client";

import { Bell } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";

import { useSession } from "~/lib/auth-client";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent } from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";

interface RestockAlertFormProps {
  productSlug: string;
}

export function RestockAlertForm({ productSlug }: RestockAlertFormProps) {
  const t = useTranslations("ProductDetail.restockAlert");
  const locale = useLocale();
  const { data: session } = useSession();

  const [email, setEmail] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubscribed, setIsSubscribed] = React.useState(false);

  React.useEffect(() => {
    const sessionEmail = session?.user?.email;
    if (sessionEmail && !email) {
      setEmail(sessionEmail);
    }
  }, [session?.user?.email, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = email.trim();
    if (!trimmed) {
      toast.error(t("error"));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/public/products/${encodeURIComponent(productSlug)}/restock-alert`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmed, locale }),
        },
      );

      if (res.ok) {
        setIsSubscribed(true);
        toast.success(t("success"));
        return;
      }

      const data = (await res.json().catch(() => null)) as {
        error?: string;
        code?: string;
      } | null;

      if (res.status === 409) {
        toast.error(t("alreadyInStock"));
      } else if (res.status === 429) {
        toast.error(t("rateLimited"));
      } else {
        toast.error(data?.error ?? t("error"));
      }
    } catch {
      toast.error(t("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubscribed) {
    return (
      <Card className="border-green-200 bg-green-50/50 dark:border-green-900/40 dark:bg-green-950/20">
        <CardContent className="p-4">
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            {t("success")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200/70 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">{t("title")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("description")}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("emailPlaceholder")}
            aria-label={t("emailLabel")}
            disabled={isSubmitting}
            className="flex-1"
            required
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            className="shrink-0"
          >
            {isSubmitting ? t("submitting") : t("submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
