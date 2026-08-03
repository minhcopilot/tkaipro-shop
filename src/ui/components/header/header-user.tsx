import {
  BarChart,
  LogOut,
  Settings,
  Shield,
  ShoppingBag,
  Upload,
  User,
  Wallet,
} from "lucide-react";
import NextLink from "next/link";
import { Link, useRouter } from "~/i18n/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { signOut, useCurrentUser } from "~/lib/auth-client";
import { cn } from "~/lib/cn";
import { Avatar, AvatarFallback, AvatarImage } from "~/ui/primitives/avatar";
import { Button } from "~/ui/primitives/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/ui/primitives/dropdown-menu";

interface HeaderUserDropdownProps {
  isDashboard: boolean;
  userEmail: string;
  userImage?: null | string;
  userName: string;
}

export function HeaderUserDropdown({
  isDashboard = false,
  userEmail,
  userImage,
  userName,
}: HeaderUserDropdownProps) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const t = useTranslations("HeaderUser");

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success(t("toast.success"));
      router.push("/");
    } catch (err) {
      toast.error(t("toast.error"));
      console.error("Sign-out error:", err);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="relative overflow-hidden rounded-full"
          size="icon"
          variant="ghost"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage
              alt={userName || "User"}
              src={userImage || undefined}
            />
            <AvatarFallback>
              {userName ? (
                userName
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
              ) : (
                <User className="h-4 w-4" />
              )}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center justify-start gap-2 p-2">
          <Avatar className="h-8 w-8 bg-primary/10">
            <AvatarImage
              alt={userName || "User"}
              src={userImage || undefined}
            />
            <AvatarFallback>
              {userName ? (
                userName
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
              ) : (
                <User className="h-4 w-4 text-primary" />
              )}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-0.5">
            <p className="text-sm font-medium">{userName || "User"}</p>
            <p
              className={"max-w-[160px] truncate text-xs text-muted-foreground"}
            >
              {userEmail}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link className="cursor-pointer" href="/dashboard/orders">
            <ShoppingBag className="mr-2 h-4 w-4" />
            {t("menu.orders")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link className="cursor-pointer" href="/dashboard/wallet">
            <Wallet className="mr-2 h-4 w-4" />
            {t("menu.wallet")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link className="cursor-pointer" href="/dashboard/profile">
            <User className="mr-2 h-4 w-4" />
            {t("menu.profile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link className="cursor-pointer" href="/dashboard/settings">
            <Settings className="mr-2 h-4 w-4" />
            {t("menu.settings")}
          </Link>
        </DropdownMenuItem>
        {(user as any)?.role === "ADMIN" && (
          <DropdownMenuItem asChild>
            <a className="cursor-pointer" href="/admin/summary">
              <Shield className="mr-2 h-4 w-4" />
              {t("menu.admin")}
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className={cn(
            "cursor-pointer",
            isDashboard
              ? "text-red-600"
              : `
                text-destructive
                focus:text-destructive
              `,
          )}
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t("menu.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
