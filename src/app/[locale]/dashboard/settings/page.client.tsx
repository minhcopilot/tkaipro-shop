"use client";

import { Lock, User } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { useCurrentUser } from "~/lib/auth-client";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/ui/primitives/tabs";

export function SettingsPageClient() {
  const t = useTranslations("DashboardSettings");
  const { user } = useCurrentUser();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // sync profile data when user data loads
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      const result = await response.json() as any;

      if (!response.ok) {
        throw new Error(result.error || t("profile.error"));
      }

      toast.success(t("profile.success"));
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || t("profile.error"));
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(t("security.errorMatch"));
      return;
    }

    // validate password length
    if (passwordData.newPassword.length < 8) {
      toast.error(t("security.errorLength"));
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const result = await response.json() as any;

      if (!response.ok) {
        throw new Error(result.error || t("security.error"));
      }

      toast.success(t("security.success"));
      
      // reset form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(error.message || t("security.error"));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleProfileChange = (field: keyof typeof profileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePasswordChange = (field: keyof typeof passwordData, value: string) => {
    setPasswordData(prev => ({
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

      <Tabs className="space-y-4" defaultValue="profile">
        <TabsList>
          <TabsTrigger className="flex items-center gap-2" value="profile">
            <User className="h-4 w-4" />
            {t("tabs.profile")}
          </TabsTrigger>
          <TabsTrigger className="flex items-center gap-2" value="security">
            <Lock className="h-4 w-4" />
            {t("tabs.security")}
          </TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-4" value="profile">
          <form onSubmit={handleProfileSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>{t("profile.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="profile-name">{t("profile.name")}</Label>
                  <Input
                    value={profileData.name}
                    onChange={(e) => handleProfileChange("name", e.target.value)}
                    id="profile-name"
                    placeholder={t("profile.namePlaceholder")}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="profile-email">{t("profile.email")}</Label>
                  <Input
                    value={profileData.email}
                    onChange={(e) => handleProfileChange("email", e.target.value)}
                    id="profile-email"
                    placeholder={t("profile.emailPlaceholder")}
                    type="email"
                    required
                  />
                </div>
                <Button type="submit" disabled={profileLoading}>
                  {profileLoading ? t("profile.saving") : t("profile.save")}
                </Button>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        <TabsContent className="space-y-4" value="security">
          <form onSubmit={handlePasswordSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>{t("security.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="current-password">{t("security.currentPassword")}</Label>
                  <Input
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                    id="current-password"
                    placeholder={t("security.currentPasswordPlaceholder")}
                    type="password"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-password">{t("security.newPassword")}</Label>
                  <Input
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                    id="new-password"
                    placeholder={t("security.newPasswordPlaceholder")}
                    type="password"
                    required
                    minLength={8}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">{t("security.confirmPassword")}</Label>
                  <Input
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                    id="confirm-password"
                    placeholder={t("security.confirmPasswordPlaceholder")}
                    type="password"
                    required
                    minLength={8}
                  />
                </div>
                <Button type="submit" disabled={passwordLoading}>
                  {passwordLoading ? t("security.updating") : t("security.update")}
                </Button>
              </CardContent>
            </Card>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
