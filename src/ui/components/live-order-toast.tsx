"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS, ru, zhCN, arSA, es, fr, de, ja, ko, ptBR } from "date-fns/locale";
import { X, CheckCircle2, Sparkles, ShoppingBag, MapPin } from "lucide-react";
import Image from "next/image";

import { cn } from "~/lib/cn";
import { formatPrice } from "~/lib/product-localization";

type OrderToast = {
  id: string;
  customerName: string;
  productName: string;
  price: number;
  timeAgo: string;
  avatar?: string | null;
  location?: string;
};


// get random vietnamese location for extra social proof
const getRandomLocation = (locale: string) => {
  const locationsVi = [
    "Hà Nội", "TP.HCM", "Đà Nẵng", "Hải Phòng", "Cần Thơ", 
    "Nha Trang", "Huế", "Vũng Tàu", "Bình Dương", "Đồng Nai"
  ];
  const locationsEn = [
    "Hanoi", "Ho Chi Minh", "Da Nang", "Hai Phong", "Can Tho",
    "Nha Trang", "Hue", "Vung Tau", "Binh Duong", "Dong Nai"
  ];
  const locations = locale === 'vi' ? locationsVi : locationsEn;
  return locations[Math.floor(Math.random() * locations.length)];
};

// generate avatar gradient color based on name
const getAvatarColor = (name: string) => {
  const colors = [
    "from-pink-500 to-rose-500",
    "from-violet-500 to-purple-500", 
    "from-blue-500 to-cyan-500",
    "from-green-500 to-emerald-500",
    "from-orange-500 to-amber-500",
    "from-red-500 to-pink-500",
    "from-indigo-500 to-blue-500",
    "from-teal-500 to-green-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

type LiveOrderToastProps = {
  enabled?: boolean;
  interval?: number; // ms between toasts
  duration?: number; // ms toast stays visible
};

export function LiveOrderToast({ 
  enabled = true, 
  interval = 15000, // show every 15 seconds
  duration = 6000   // visible for 6 seconds
}: LiveOrderToastProps) {
  const t = useTranslations("LiveOrderToast");
  const locale = useLocale();
  const [currentToast, setCurrentToast] = useState<OrderToast | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ordersRef = useRef<any[]>([]);
  const lastIndexRef = useRef(0);

  const getDateLocale = useCallback(() => {
    const localeMap: Record<string, typeof vi> = {
      vi, en: enUS, ru, zh: zhCN, ar: arSA, es, fr, de, ja, ko, pt: ptBR
    };
    return localeMap[locale] || enUS;
  }, [locale]);

  // fetch recent orders
  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch("/api/orders?status=completed&limit=20");
      if (response.ok) {
        const data = await response.json() as { orders?: any[] };
        if (data.orders && data.orders.length > 0) {
          ordersRef.current = data.orders;
        }
      }
    } catch {
      // silently fail - will use mock data
    }
  }, []);

  // generate mock order if no real orders available
  const generateMockOrder = useCallback((): OrderToast => {
    const names = [
      "Nguyễn Văn Minh", "Trần Thị Hoa", "Lê Hoàng Nam", "Phạm Đức Anh",
      "Võ Thị Mai", "Đặng Quốc Huy", "Hoàng Văn Tùng", "Bùi Thị Lan",
      "Ngô Minh Tuấn", "Đinh Thị Hương", "Phan Văn Long", "Vũ Thị Ngọc"
    ];
    const products = [
      { name: "Google AI Pro", price: 199000 },
      { name: "Google AI Ultra", price: 499000 },
      { name: "Google Antigravity Pro", price: 249000 },
      { name: "Google Antigravity Ultra", price: 599000 },
    ];
    
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const minutesAgo = Math.floor(Math.random() * 30) + 1;
    const date = new Date(Date.now() - minutesAgo * 60 * 1000);

    return {
      id: `mock-${Date.now()}`,
      customerName: randomName,
      productName: randomProduct.name,
      price: randomProduct.price,
      timeAgo: formatDistanceToNow(date, { addSuffix: true, locale: getDateLocale() }),
      location: getRandomLocation(locale),
    };
  }, [locale, getDateLocale]);

  // get next order to display
  const getNextOrder = useCallback((): OrderToast => {
    const orders = ordersRef.current;
    
    if (orders.length > 0) {
      const order = orders[lastIndexRef.current % orders.length];
      lastIndexRef.current++;
      
      const firstItem = order.items?.[0];
      const createdAt = new Date(order.createdAt);
      
      return {
        id: order.id,
        customerName: order.customerName || "Khách hàng",
        productName: firstItem?.name || "Google AI Pro",
        price: order.total || firstItem?.price || 199000,
        timeAgo: formatDistanceToNow(createdAt, { addSuffix: true, locale: getDateLocale() }),
        location: getRandomLocation(locale),
        avatar: order.userAvatar || null,
      };
    }
    
    return generateMockOrder();
  }, [generateMockOrder, getDateLocale, locale]);

  // show toast
  const showToast = useCallback(() => {
    const order = getNextOrder();
    setCurrentToast(order);
    setIsExiting(false);
    setIsVisible(true);
    
    // auto hide after duration
    timeoutRef.current = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        setCurrentToast(null);
      }, 300); // exit animation duration
    }, duration);
  }, [getNextOrder, duration]);

  // dismiss toast manually
  const dismissToast = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      setCurrentToast(null);
    }, 300);
  }, []);

  // init and cleanup - deferred with requestIdleCallback to avoid blocking INP
  useEffect(() => {
    if (!enabled) return;

    let initialTimeout: ReturnType<typeof setTimeout> | null = null;
    let refetchInterval: ReturnType<typeof setInterval> | null = null;
    let idleCallbackId: number | null = null;

    const initializeToasts = () => {
      fetchOrders();

      initialTimeout = setTimeout(() => {
        showToast();
        intervalRef.current = setInterval(showToast, interval);
      }, 10000); // first toast after 10s (increased from 5s)

      refetchInterval = setInterval(fetchOrders, 60000);
    };

    // defer initialization to when browser is idle
    if ("requestIdleCallback" in window) {
      idleCallbackId = window.requestIdleCallback(initializeToasts, { timeout: 5000 });
    } else {
      // fallback: just delay by 3s
      initialTimeout = setTimeout(initializeToasts, 3000);
    }

    return () => {
      if (initialTimeout) clearTimeout(initialTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (refetchInterval) clearInterval(refetchInterval);
      if (idleCallbackId && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleCallbackId);
      }
    };
  }, [enabled, interval, fetchOrders, showToast]);

  if (!enabled || !isVisible || !currentToast) return null;

  const avatarGradient = getAvatarColor(currentToast.customerName);
  const displayName = currentToast.customerName;
  const initial = currentToast.customerName.charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 z-50 max-w-sm",
        "transform transition-all duration-300 ease-out",
        isExiting 
          ? "translate-x-[-120%] opacity-0" 
          : "translate-x-0 opacity-100",
        !isVisible && "hidden"
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-xl",
          "bg-white dark:bg-gray-900",
          "border border-gray-200 dark:border-gray-700",
          "shadow-2xl shadow-black/10 dark:shadow-black/30",
          "animate-in slide-in-from-left-full duration-300"
        )}
      >
        {/* progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 dark:bg-gray-800">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
            style={{ 
              animation: `shrink ${duration}ms linear forwards`,
            }}
          />
        </div>

        {/* close button */}
        <button
          onClick={dismissToast}
          className={cn(
            "absolute top-2 right-2 p-1 rounded-full",
            "text-gray-400 hover:text-gray-600",
            "dark:text-gray-500 dark:hover:text-gray-300",
            "hover:bg-gray-100 dark:hover:bg-gray-800",
            "transition-colors z-10"
          )}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-4 pt-5">
          {/* header badge */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold shadow-lg shadow-green-500/30">
              <Sparkles className="h-3 w-3" />
              <span>{t("badge")}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span>{t("verified")}</span>
            </div>
          </div>

          {/* content */}
          <div className="flex items-start gap-3">
            {/* avatar */}
            <div className="relative flex-shrink-0">
              {currentToast.avatar ? (
                <Image
                  src={currentToast.avatar}
                  alt={displayName}
                  width={44}
                  height={44}
                  className="rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
                />
              ) : (
                <div className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full",
                  "text-white font-bold text-lg",
                  "bg-gradient-to-br ring-2 ring-white dark:ring-gray-800",
                  avatarGradient
                )}>
                  {initial}
                </div>
              )}
              {/* online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-green-500 border-2 border-white dark:border-gray-900 flex items-center justify-center">
                <CheckCircle2 className="h-2.5 w-2.5 text-white" />
              </div>
            </div>

            {/* info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {displayName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                <ShoppingBag className="h-3 w-3" />
                <span>{t("justPurchased")}</span>
              </p>
            </div>
          </div>

          {/* product info */}
          <div className="mt-3 pl-14">
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-100 dark:border-green-800/50">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {currentToast.productName}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">
                    {formatPrice(currentToast.price, locale)}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {currentToast.timeAgo}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* location */}
          {currentToast.location && (
            <div className="mt-2 pl-14 flex items-center gap-1 text-xs text-gray-400">
              <MapPin className="h-3 w-3" />
              <span>{currentToast.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* CSS for progress bar animation */}
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
