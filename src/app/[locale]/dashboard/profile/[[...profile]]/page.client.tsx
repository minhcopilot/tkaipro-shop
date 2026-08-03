"use client";

import { User } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { useCurrentUserOrRedirect } from "~/lib/auth-client";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";

export function ProfilePageClient() {
  const t = useTranslations("DashboardProfile");
  const { isPending, user } = useCurrentUserOrRedirect();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  // sync form data when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
      });
    }
  }, [user]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t("form.saving")}</h1>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json() as any;

      if (!response.ok) {
        throw new Error(result.error || t("form.error"));
      }

      toast.success(t("form.success"));
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || t("form.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div
      className={`
        container space-y-6 p-4
        md:p-8
      `}
    >
      <div className="space-y-0.5">
        <h2 className="font-display text-2xl font-black tracking-tight">{t("title")}</h2>
        <p className="text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t("title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t("form.name")}</Label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                id="name"
                placeholder={t("form.name")}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">{t("form.email")}</Label>
              <Input
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                id="email"
                placeholder={t("form.email")}
                type="email"
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? t("form.saving") : t("form.save")}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
