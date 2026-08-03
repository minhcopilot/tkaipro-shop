"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
  ShoppingBag,
  Megaphone,
  RefreshCw,
  X,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/ui/primitives/dialog";
import { Button } from "~/ui/primitives/button";

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  type: string;
  imageUrl: string | null;
  linkUrl: string | null;
  linkText: string | null;
  priority: number;
}

const LS_KEY = "dismissed-announcements";

function getDismissedIds(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addDismissedId(id: string) {
  const ids = getDismissedIds();
  if (!ids.includes(id)) {
    ids.push(id);
  }
  localStorage.setItem(LS_KEY, JSON.stringify(ids));
}

const typeConfig: Record<string, {
  labels: Record<string, string>;
  icon: typeof Bell;
  gradient: string;
  iconBg: string;
  accentBorder: string;
  ctaClass: string;
}> = {
  general: {
    labels: { vi: "Thông báo", en: "Announcement", ru: "Объявление", zh: "公告", ar: "إعلان", es: "Anuncio", fr: "Annonce", de: "Ankündigung", ja: "お知らせ", ko: "공지", pt: "Aviso" },
    icon: Bell,
    gradient: "from-blue-500 via-indigo-500 to-purple-600",
    iconBg: "bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400",
    accentBorder: "border-t-blue-500",
    ctaClass: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25",
  },
  product: {
    labels: { vi: "Sản phẩm mới", en: "New Product", ru: "Новый продукт", zh: "新产品", ar: "منتج جديد", es: "Nuevo producto", fr: "Nouveau produit", de: "Neues Produkt", ja: "新製品", ko: "신제품", pt: "Novo produto" },
    icon: ShoppingBag,
    gradient: "from-violet-500 via-purple-500 to-fuchsia-600",
    iconBg: "bg-violet-500/10 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400",
    accentBorder: "border-t-violet-500",
    ctaClass: "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25",
  },
  promotion: {
    labels: { vi: "Khuyến mãi", en: "Promotion", ru: "Акция", zh: "促销", ar: "عرض ترويجي", es: "Promoción", fr: "Promotion", de: "Aktion", ja: "プロモーション", ko: "프로모션", pt: "Promoção" },
    icon: Sparkles,
    gradient: "from-amber-500 via-orange-500 to-red-500",
    iconBg: "bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400",
    accentBorder: "border-t-amber-500",
    ctaClass: "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25",
  },
  update: {
    labels: { vi: "Cập nhật", en: "Update", ru: "Обновление", zh: "更新", ar: "تحديث", es: "Actualización", fr: "Mise à jour", de: "Update", ja: "アップデート", ko: "업데이트", pt: "Atualização" },
    icon: RefreshCw,
    gradient: "from-emerald-500 via-teal-500 to-cyan-600",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400",
    accentBorder: "border-t-emerald-500",
    ctaClass: "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25",
  },
};

const dismissLabels: Record<string, { skip: string; close: string }> = {
  vi: { skip: "Bỏ qua", close: "Đóng" },
  en: { skip: "Skip", close: "Close" },
  ru: { skip: "Пропустить", close: "Закрыть" },
  zh: { skip: "跳过", close: "关闭" },
  ar: { skip: "تخطي", close: "إغلاق" },
  es: { skip: "Saltar", close: "Cerrar" },
  fr: { skip: "Passer", close: "Fermer" },
  de: { skip: "Überspringen", close: "Schließen" },
  ja: { skip: "スキップ", close: "閉じる" },
  ko: { skip: "건너뛰기", close: "닫기" },
  pt: { skip: "Pular", close: "Fechar" },
};

const defaultCtaLabels: Record<string, string> = {
  vi: "Xem ngay", en: "View now", ru: "Смотреть", zh: "立即查看",
  ar: "شاهد الآن", es: "Ver ahora", fr: "Voir maintenant", de: "Jetzt ansehen",
  ja: "今すぐ見る", ko: "지금 보기", pt: "Ver agora",
};

export function AnnouncementPopup() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState("vi");
  const openedRef = useRef(false);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (openedRef.current) return;
      try {
        const pathLocale = window.location.pathname.split("/")[1] || "vi";
        const detectedLocale = /^[a-z]{2}$/.test(pathLocale) ? pathLocale : "vi";
        setLocale(detectedLocale);
        const res = await fetch(`/api/announcements?locale=${detectedLocale}`);
        if (!res.ok) return;
        const data = await res.json() as { announcements: AnnouncementItem[] };

        const dismissed = getDismissedIds();
        const undismissed = data.announcements.filter(a => !dismissed.includes(a.id));

        if (undismissed.length > 0) {
          openedRef.current = true;
          setAnnouncements(undismissed);
          setCurrentIndex(0);
          setOpen(true);
        }
      } catch {
        // silently fail
      }
    };

    const timer = setTimeout(fetchAnnouncements, 800);
    return () => clearTimeout(timer);
  }, []);

  const current = announcements[currentIndex];

  const dismissAll = useCallback(() => {
    for (const a of announcements) {
      addDismissedId(a.id);
    }
    setOpen(false);
  }, [announcements]);

  if (!current) return null;

  const config = typeConfig[current.type] || typeConfig.general;
  const TypeIcon = config.icon;

  return (
    <Dialog open={open} onOpenChange={val => {
      if (!val) dismissAll();
    }}>
      <DialogContent className={`max-w-md sm:max-w-[480px] p-0 overflow-hidden border-t-4 ${config.accentBorder} gap-0`}>
        {/* Gradient header strip */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${config.gradient}`} />

        {/* Image */}
        {current.imageUrl && (
          <div className="relative">
            <img
              src={current.imageUrl}
              alt={current.title}
              className="w-full h-[200px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        )}

        {/* Content */}
        <div className="px-6 pt-5 pb-2">
          <DialogHeader className="gap-3">
            {/* Type badge + pagination */}
            <div className="flex items-center justify-between">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${config.iconBg}`}>
                <TypeIcon className="h-3.5 w-3.5" />
                {config.labels[locale] || config.labels.vi}
              </div>
              {announcements.length > 1 && (
                <div className="flex items-center gap-1.5">
                  {announcements.map((_, idx) => (
                    <button
                      key={announcements[idx].id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        idx === currentIndex
                          ? `w-6 bg-gradient-to-r ${config.gradient}`
                          : "w-2 bg-muted-foreground/20 hover:bg-muted-foreground/40"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Title with animation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <DialogTitle className="text-xl font-bold leading-snug tracking-tight">
                  {current.title}
                </DialogTitle>
              </motion.div>
            </AnimatePresence>
          </DialogHeader>

          {/* Body with animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id + "-body"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              className="mt-3"
            >
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {current.content}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 pb-5 pt-4 flex-col gap-3 sm:flex-col">
          {/* CTA button */}
          {current.linkUrl && (
            <Button
              asChild
              size="lg"
              className={`w-full rounded-xl font-semibold ${config.ctaClass} border-0`}
            >
              <a href={current.linkUrl}>
                <ExternalLink className="h-4 w-4 mr-2" />
                {current.linkText || defaultCtaLabels[locale] || "Xem ngay"}
              </a>
            </Button>
          )}

          {/* Navigation + dismiss */}
          <div className="flex items-center justify-between w-full">
            {/* Nav arrows */}
            <div className="flex items-center gap-1">
              {announcements.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className="h-8 w-8 rounded-full"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground tabular-nums px-1">
                    {currentIndex + 1} / {announcements.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentIndex(prev => Math.min(announcements.length - 1, prev + 1))}
                    disabled={currentIndex === announcements.length - 1}
                    className="h-8 w-8 rounded-full"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            {/* Dismiss */}
            <Button
              variant="ghost"
              onClick={dismissAll}
              className="text-muted-foreground hover:text-foreground text-sm h-8 px-3"
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              {dismissLabels[locale]?.close || "Đóng"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
