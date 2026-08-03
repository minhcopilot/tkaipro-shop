"use client";

import { Menu, Search, ShoppingBag, Wallet, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";

import { SEO_CONFIG } from "~/app";
import { LanguageSwitcher } from "~/components/language-switcher";
import { useCurrentUser } from "~/lib/auth-client";
import { cn } from "~/lib/cn";
import { Link, usePathname } from "~/i18n/navigation";
import { Cart } from "~/ui/components/cart";
import { GlobalSearch } from "~/ui/components/global-search";
import { Button } from "~/ui/primitives/button";
import { Skeleton } from "~/ui/primitives/skeleton";

import { ThemeToggle } from "../theme-toggle";
import { HeaderUserDropdown } from "./header-user";

interface HeaderProps {
  children?: React.ReactNode;
  showAuth?: boolean;
}

export function Header({ showAuth = true }: HeaderProps) {
  const t = useTranslations("Header");
  const pathname = usePathname();
  const { isPending, user } = useCurrentUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const baseMainNavigation = [
    { href: "/", name: t("home") },
    { href: "/intro", name: t("intro") },
    { href: "/products", name: t("products") },
    { href: "/khach-hang-da-mua", name: t("purchasedCustomers") },
    { href: "/blog", name: t("blog") },
    { href: "/contact", name: t("contact") },
  ];

  const baseDashboardNavigation = [
    { href: "/dashboard/orders", name: t("orders") },
    { href: "/dashboard/wallet", name: t("wallet") },
    { href: "/dashboard/profile", name: t("profile") },
    { href: "/dashboard/settings", name: t("settings") },
  ];

  const isAdmin = isMounted && user && (user as any)?.role === "ADMIN";
  const mainNavigation = isAdmin
    ? [...baseMainNavigation, { href: "/admin/summary", name: t("admin") }]
    : baseMainNavigation;

  const dashboardNavigation = isAdmin
    ? [...baseDashboardNavigation, { href: "/admin/summary", name: t("admin") }]
    : baseDashboardNavigation;

  const isDashboard =
    isMounted &&
    user &&
    (pathname.startsWith("/dashboard") || pathname.startsWith("/admin"));
  const navigation = isDashboard ? dashboardNavigation : mainNavigation;

  const renderContent = () => (
    <header
      className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/85 backdrop-blur-md"
      suppressHydrationWarning
    >
      <div
        className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        suppressHydrationWarning
      >
        <div className="flex h-16 items-center justify-between" suppressHydrationWarning>
          <div className="flex items-center gap-8">
            <Link className="flex items-center gap-2" href="/">
              <Image
                alt=""
                className="h-8 w-8 shrink-0 rounded-md"
                height={32}
                priority
                src="/tkaipro-icon.png"
                width={32}
              />
              <span className="font-display text-xl font-bold tracking-tight text-foreground">
                {SEO_CONFIG.name}
              </span>
            </Link>
            <nav className="hidden md:flex">
              <ul className="flex items-center gap-1">
                {navigation.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname?.startsWith(item.href));

                  const linkClass = cn(
                    "rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-soft-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  );

                  if (item.href.startsWith("/admin")) {
                    return (
                      <li key={item.name}>
                        <a className={linkClass} href={item.href}>
                          {item.name}
                        </a>
                      </li>
                    );
                  }

                  return (
                    <li key={item.name}>
                      <Link className={linkClass} href={item.href}>
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          <div className="flex items-center gap-2" suppressHydrationWarning>
            {!isDashboard && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(true)}
                aria-label={t("search.hint")}
              >
                <Search className="h-5 w-5" />
              </Button>
            )}

            {!isDashboard &&
              (!isMounted ? (
                <Skeleton className="h-9 w-9 rounded-full" />
              ) : (
                <Cart />
              ))}

            {isMounted && user && !isDashboard && (
              <div className="hidden items-center gap-1 md:flex">
                <Link href="/dashboard/orders" aria-label={t("orders")}>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("orders")}
                    title={t("orders")}
                  >
                    <ShoppingBag className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/dashboard/wallet" aria-label={t("wallet")}>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("wallet")}
                    title={t("wallet")}
                  >
                    <Wallet className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            )}

            {showAuth && isMounted && (
              <div className="hidden md:block">
                {user ? (
                  <HeaderUserDropdown
                    isDashboard={!!isDashboard}
                    userEmail={user.email}
                    userImage={user.image}
                    userName={user.name}
                  />
                ) : isPending ? (
                  <Skeleton className="h-10 w-32" />
                ) : (
                  <div className="flex items-center gap-2">
                    <Link href="/auth/sign-in">
                      <Button size="sm" variant="ghost" className="text-muted-foreground">
                        {t("signIn")}
                      </Button>
                    </Link>
                    <Link href="/auth/sign-up">
                      <Button size="sm">{t("signUp")}</Button>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {!isDashboard && <LanguageSwitcher />}
            {!isDashboard && <ThemeToggle />}

            <Button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              size="icon"
              variant="ghost"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="space-y-2 px-4 py-3">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname?.startsWith(item.href));

              const mobileClass = cn(
                "block rounded-xl px-3 py-2.5 text-base font-semibold transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-soft-sm"
                  : "text-foreground hover:bg-muted",
              );

              if (item.href.startsWith("/admin")) {
                return (
                  <a
                    className={mobileClass}
                    href={item.href}
                    key={item.name}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </a>
                );
              }

              return (
                <Link
                  className={mobileClass}
                  href={item.href}
                  key={item.name}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          {showAuth && !user && (
            <div className="space-y-2 border-t border-border px-4 py-4">
              <Link
                className="block rounded-md border border-border px-3 py-2.5 text-center text-base font-semibold text-foreground shadow-soft-sm hover:bg-muted"
                href="/auth/sign-in"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("signIn")}
              </Link>
              <Link
                className="block rounded-md bg-gradient-brand px-3 py-2.5 text-center text-base font-semibold text-primary-foreground shadow-soft glow-primary"
                href="/auth/sign-up"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("signUp")}
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );

  return (
    <>
      {renderContent()}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
