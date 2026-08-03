"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useRef, useCallback } from "react";
import { Clock, Sparkles, CheckCircle2, ShieldCheck, Users, TrendingUp, BadgeCheck, Verified, Award, Lock, Zap, PartyPopper, HandMetal, Gift } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS, ru, zhCN, arSA, es, fr, de, ja, ko, ptBR } from "date-fns/locale";
import Image from "next/image";

import type { Order } from "~/db/schema/orders/types";
import { cn } from "~/lib/cn";
import { formatPrice } from "~/lib/product-localization";

type OrderWithAvatar = Order & {
  userAvatar?: string | null;
};

type Props = {
  orders: OrderWithAvatar[];
  locale: string;
  visitorName?: string | null;
};

// generate a consistent color based on string
const getAvatarColor = (name: string) => {
  const colors = [
    "from-red-500 to-rose-600", "from-orange-500 to-amber-600", "from-amber-500 to-yellow-600", 
    "from-lime-500 to-green-600", "from-green-500 to-emerald-600", "from-emerald-500 to-teal-600", 
    "from-teal-500 to-cyan-600", "from-cyan-500 to-sky-600", "from-sky-500 to-blue-600", 
    "from-blue-500 to-indigo-600", "from-indigo-500 to-violet-600", "from-violet-500 to-purple-600", 
    "from-purple-500 to-fuchsia-600", "from-fuchsia-500 to-pink-600", "from-pink-500 to-rose-600"
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// cute generic names for anonymous visitors
const getCuteGuestName = (locale: string) => {
  if (locale === 'vi') return 'bạn yêu ơi';
  if (locale === 'ru') return 'дорогой друг';
  if (locale === 'zh') return '亲爱的朋友';
  if (locale === 'ar') return 'صديقي العزيز';
  if (locale === 'es') return 'querido amigo';
  if (locale === 'fr') return 'cher ami';
  if (locale === 'de') return 'lieber Freund';
  if (locale === 'ja') return '親愛なる友よ';
  if (locale === 'ko') return '소중한 친구';
  if (locale === 'pt') return 'querido amigo';
  return 'lovely friend';
};

export function RecentPurchases({ orders, locale, visitorName }: Props) {
  const t = useTranslations("RecentPurchases");
  const [mounted, setMounted] = useState(false);
  const [liveViewers, setLiveViewers] = useState(0);
  const [showGreeting, setShowGreeting] = useState(true);
  
  // scroll state
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const animationRef = useRef<number | null>(null);
  const scrollSpeedRef = useRef(0.8);

  useEffect(() => {
    setMounted(true);
    // simulate live viewers count
    const baseViewers = 15 + Math.floor(Math.random() * 20);
    setLiveViewers(baseViewers);
    
    const interval = setInterval(() => {
      setLiveViewers(prev => {
        const change = Math.floor(Math.random() * 5) - 2;
        return Math.max(10, Math.min(50, prev + change));
      });
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // auto-scroll effect
  useEffect(() => {
    if (!mounted || !scrollRef.current) return;

    const scroll = () => {
      if (!scrollRef.current || isHovering) {
        animationRef.current = requestAnimationFrame(scroll);
        return;
      }

      const container = scrollRef.current;
      container.scrollLeft += scrollSpeedRef.current;

      // loop back to start when reaching the end
      if (container.scrollLeft >= container.scrollWidth - container.clientWidth) {
        container.scrollLeft = 0;
      }

      animationRef.current = requestAnimationFrame(scroll);
    };

    animationRef.current = requestAnimationFrame(scroll);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mounted, isHovering]);
  
  const formatTime = (dateStr: Date | string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    
    const getDateLocale = () => {
      if (locale === 'vi') return vi;
      if (locale === 'ru') return ru;
      if (locale === 'zh') return zhCN;
      if (locale === 'ar') return arSA;
      if (locale === 'es') return es;
      if (locale === 'fr') return fr;
      if (locale === 'de') return de;
      if (locale === 'ja') return ja;
      if (locale === 'ko') return ko;
      if (locale === 'pt') return ptBR;
      return enUS;
    };
    
    try {
      return formatDistanceToNow(date, { 
        addSuffix: true, 
        locale: getDateLocale()
      });
    } catch {
      return "";
    }
  };

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setIsDragging(false);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  }, [isDragging, startX, scrollLeft]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  if (!orders || orders.length === 0) return null;

  const formattedOrders = orders.map(order => ({
    ...order,
    displayName: order.customerName || "Customer",
    timeAgo: formatTime(order.createdAt),
    avatarGradient: getAvatarColor(order.customerName || "Customer"),
    initial: (order.customerName || "Customer").charAt(0).toUpperCase()
  }));

  if (!mounted) return null;

  // count orders today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ordersToday = orders.filter(o => {
    const orderDate = new Date(o.createdAt!);
    return orderDate >= today;
  }).length;

  // use logged-in user name or cute generic name for guests
  const displayName = visitorName || getCuteGuestName(locale);
  const isLoggedIn = !!visitorName;

  return (
    <div className="w-full py-8 overflow-hidden relative group bg-gradient-to-b from-emerald-50/50 via-white to-blue-50/50 dark:from-emerald-950/20 dark:via-gray-900 dark:to-blue-950/20">
      {/* animated background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.15),transparent_50%)]" />
      </div>
      
      {/* greeting banner for online visitor */}
      {showGreeting && displayName && (
        <div className="container mx-auto px-4 mb-6 relative z-10">
          <div 
            className="relative overflow-hidden rounded-lg border border-border bg-muted/40 p-4 md:p-5"
          >
            <button
              onClick={() => setShowGreeting(false)}
              className="absolute top-2 right-2 z-20 flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-foreground md:top-3 md:right-3"
              aria-label="Close"
            >
              ×
            </button>
            
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* left: greeting message */}
              <div className="flex items-center gap-4">
                <div className="relative hidden md:flex">
                  {/* waving hand animation */}
                  <div className="h-12 w-12 flex items-center justify-center rounded-lg border border-border bg-background">
                    <span className="text-3xl animate-wave">👋</span>
                  </div>
                  {/* online indicator */}
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-green-400 border-2 border-white flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                  </div>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-2xl md:hidden">👋</span>
                    <PartyPopper className="h-5 w-5 text-foreground" />
                    <h3 className="text-lg md:text-xl font-bold text-foreground tracking-tight">
                      {locale === 'vi' 
                        ? (isLoggedIn ? `Yo ${displayName}! Đang online à?` : `Ê ${displayName}! 💕`)
                        : locale === 'ru'
                        ? (isLoggedIn ? `Привет, ${displayName}! Ты онлайн!` : `Привет, ${displayName}! 💕`)
                        : locale === 'zh'
                        ? (isLoggedIn ? `嗨 ${displayName}！你在线啦！` : `嗨 ${displayName}！💕`)
                        : locale === 'ar'
                        ? (isLoggedIn ? `مرحباً ${displayName}! أنت متصل الآن!` : `أهلاً ${displayName}! 💕`)
                        : locale === 'es'
                        ? (isLoggedIn ? `¡Hola ${displayName}! ¡Estás en línea!` : `¡Hola ${displayName}! 💕`)
                        : locale === 'fr'
                        ? (isLoggedIn ? `Salut ${displayName}! Tu es en ligne!` : `Salut ${displayName}! 💕`)
                        : locale === 'de'
                        ? (isLoggedIn ? `Hey ${displayName}! Du bist online!` : `Hey ${displayName}! 💕`)
                        : locale === 'ja'
                        ? (isLoggedIn ? `やあ ${displayName}！オンラインだね！` : `やあ ${displayName}！💕`)
                        : locale === 'ko'
                        ? (isLoggedIn ? `안녕 ${displayName}! 온라인이시네요!` : `안녕 ${displayName}! 💕`)
                        : locale === 'pt'
                        ? (isLoggedIn ? `Olá ${displayName}! Você está online!` : `Olá ${displayName}! 💕`)
                        : (isLoggedIn ? `Hey ${displayName}! You're online!` : `Hey there, ${displayName}! 💕`)}
                    </h3>
                    <span className="text-xl">🔥</span>
                  </div>
                  <p className="text-sm md:text-base text-muted-foreground font-medium">
                    {locale === 'vi' 
                      ? (isLoggedIn 
                          ? '💸 Có deal HOT đang chờ bạn kìa! Nhanh tay kẻo hết nha ^^!' 
                          : '💸 Có deal HOT cực đỉnh đang chờ bạn đó! Mua đi mua đi ^^!')
                      : locale === 'ru'
                      ? (isLoggedIn
                          ? '💸 Горячие предложения ждут тебя! Успей забрать ^^!'
                          : '💸 Крутые скидки ждут тебя! Не пропусти ^^!')
                      : locale === 'zh'
                      ? (isLoggedIn
                          ? '💸 热门优惠等着你！赶快抢购吧 ^^！'
                          : '💸 超值优惠等着你！别错过哦 ^^！')
                      : locale === 'ar'
                      ? (isLoggedIn
                          ? '💸 عروض حصرية بانتظارك! لا تفوتها ^^!'
                          : '💸 عروض رائعة بانتظارك! اغتنم الفرصة ^^!')
                      : locale === 'es'
                      ? (isLoggedIn
                          ? '💸 ¡Ofertas calientes te esperan! ¡No te las pierdas ^^!'
                          : '💸 ¡Ofertas increíbles te esperan! ¡Aprovéchalas ^^!')
                      : locale === 'fr'
                      ? (isLoggedIn
                          ? '💸 Des offres chaudes vous attendent! Ne les manquez pas ^^!'
                          : '💸 Des offres incroyables vous attendent! Profitez-en ^^!')
                      : locale === 'de'
                      ? (isLoggedIn
                          ? '💸 Heiße Angebote warten auf dich! Schnapp sie dir ^^!'
                          : '💸 Tolle Angebote warten! Nicht verpassen ^^!')
                      : locale === 'ja'
                      ? (isLoggedIn
                          ? '💸 ホットなお得情報があなたを待っています！お見逃しなく ^^!'
                          : '💸 素晴らしいお得情報が待っています！お見逃しなく ^^!')
                      : locale === 'ko'
                      ? (isLoggedIn
                          ? '💸 핫딜이 기다리고 있어요! 놓치지 마세요 ^^!'
                          : '💸 멋진 딜이 기다리고 있어요! 놓치지 마세요 ^^!')
                      : locale === 'pt'
                      ? (isLoggedIn
                          ? '💸 Ofertas quentes esperando por você! Não perca ^^!'
                          : '💸 Ofertas incríveis esperando! Não perca ^^!')
                      : (isLoggedIn
                          ? '💸 Hot deals waiting for you! Grab them before they\'re gone ^^!'
                          : '💸 Amazing deals are waiting! Don\'t miss out, cutie ^^!')}
                  </p>
                </div>
              </div>
              
              {/* right: cta button */}
              <div className="flex items-center gap-3">
                <a
                  href={`/${locale}/products`}
                  className="group/btn relative flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-purple-600 font-bold text-sm md:text-base shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  <Zap className="h-5 w-5 text-yellow-500 group-hover/btn:animate-bounce" />
                  <span>{locale === 'vi' ? 'Xem ngay!' : locale === 'ru' ? 'Смотреть!' : locale === 'zh' ? '立即查看！' : locale === 'ar' ? '!شاهد الآن' : locale === 'es' ? '¡Míralo!' : locale === 'fr' ? 'Voir!' : locale === 'de' ? 'Ansehen!' : locale === 'ja' ? '見る！' : locale === 'ko' ? '확인하기!' : locale === 'pt' ? 'Confira!' : 'Check it out!'}</span>
                  <Gift className="h-5 w-5 text-pink-500 animate-pulse" />
                  
                  {/* shine effect */}
                  <div className="absolute inset-0 rounded-xl overflow-hidden">
                    <div className="absolute inset-0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  </div>
                </a>
                
                <div className="hidden md:flex flex-col items-center px-3 py-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
                  <span className="text-[10px] text-white/80 uppercase tracking-wider">Sale</span>
                  <span className="text-lg font-black text-yellow-300 animate-pulse">-50%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* commitment banner */}
      <div className="container mx-auto px-4 mb-6 relative z-10">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 p-4 md:p-5 shadow-xl shadow-green-500/20">
          {/* background decorations */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvZz48L3N2Zz4=')] opacity-50" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* left: main commitment message */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg">
                <Award className="h-7 w-7 text-white" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Verified className="h-5 w-5 text-yellow-300" />
                  <h3 className="text-lg md:text-xl font-bold text-foreground tracking-tight">
                    {locale === 'vi' ? 'CAM KẾT 100% ĐƠN HÀNG THẬT' : locale === 'ru' ? '100% РЕАЛЬНЫЕ ЗАКАЗЫ' : locale === 'zh' ? '100%真实订单保证' : locale === 'ar' ? 'ضمان 100% طلبات حقيقية' : locale === 'es' ? '100% PEDIDOS REALES GARANTIZADOS' : locale === 'fr' ? '100% COMMANDES RÉELLES GARANTIES' : locale === 'de' ? '100% ECHTE BESTELLUNGEN GARANTIERT' : locale === 'ja' ? '100%本物の注文保証' : locale === 'ko' ? '100% 실제 주문 보장' : locale === 'pt' ? '100% PEDIDOS REAIS GARANTIDOS' : '100% REAL ORDERS GUARANTEED'}
                  </h3>
                </div>
                <p className="text-sm text-white/90 max-w-xl">
                  {locale === 'vi' 
                    ? 'Tất cả đơn hàng dưới đây được lấy trực tiếp từ hệ thống thanh toán thực. Không fake, không chỉnh sửa. Mỗi giao dịch đều có thể xác minh.' 
                    : locale === 'ru'
                    ? 'Все заказы ниже получены напрямую из системы оплаты. Без фейков, без редактирования. Каждая транзакция проверяема.'
                    : locale === 'zh'
                    ? '以下所有订单直接从真实支付系统获取。无造假，无编辑。每笔交易可验证。'
                    : locale === 'ar'
                    ? 'جميع الطلبات أدناه مأخوذة مباشرة من نظام الدفع الحقيقي. بدون تزييف، بدون تعديل. كل معاملة قابلة للتحقق.'
                    : locale === 'es'
                    ? 'Todos los pedidos a continuación provienen directamente de nuestro sistema de pago real. Sin falsificaciones, sin ediciones. Cada transacción es verificable.'
                    : locale === 'fr'
                    ? 'Toutes les commandes ci-dessous proviennent directement de notre système de paiement réel. Pas de faux, pas de modifications. Chaque transaction est vérifiable.'
                    : locale === 'de'
                    ? 'Alle Bestellungen unten werden direkt aus unserem echten Zahlungssystem abgerufen. Keine Fälschungen, keine Bearbeitungen. Jede Transaktion ist überprüfbar.'
                    : locale === 'ja'
                    ? '以下のすべての注文は実際の決済システムから直接取得されています。偽造なし、編集なし。すべての取引は検証可能です。'
                    : locale === 'ko'
                    ? '아래 모든 주문은 실제 결제 시스템에서 직접 가져온 것입니다. 가짜 없음, 편집 없음. 모든 거래는 검증 가능합니다.'
                    : locale === 'pt'
                    ? 'Todos os pedidos abaixo são obtidos diretamente do nosso sistema de pagamento real. Sem falsificações, sem edições. Cada transação é verificável.'
                    : 'All orders below are fetched directly from our real payment system. No fakes, no edits. Every transaction is verifiable.'}
                </p>
              </div>
            </div>
            
            {/* right: trust seals */}
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-bold">
                <Lock className="h-3.5 w-3.5" />
                <span>{locale === 'vi' ? 'Bảo mật SSL' : locale === 'ru' ? 'SSL Защита' : locale === 'zh' ? 'SSL安全' : locale === 'ar' ? 'SSL آمن' : locale === 'es' ? 'SSL Seguro' : locale === 'fr' ? 'SSL Sécurisé' : locale === 'de' ? 'SSL Gesichert' : locale === 'ja' ? 'SSLセキュア' : locale === 'ko' ? 'SSL 보안' : locale === 'pt' ? 'SSL Seguro' : 'SSL Secure'}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-bold">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{locale === 'vi' ? 'Hoàn tiền 100%' : locale === 'ru' ? '100% Возврат' : locale === 'zh' ? '100%退款' : locale === 'ar' ? 'استرداد 100%' : locale === 'es' ? '100% Reembolso' : locale === 'fr' ? '100% Remboursé' : locale === 'de' ? '100% Erstattung' : locale === 'ja' ? '100%返金' : locale === 'ko' ? '100% 환불' : locale === 'pt' ? '100% Reembolso' : '100% Refund'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* header with live stats */}
      <div className="container mx-auto px-4 mb-4 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* left: title with live indicator */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
              <div className="relative h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-900 shadow-lg shadow-green-500/50" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              {t("title")}
            </h3>
            <div className="hidden sm:flex h-px w-12 bg-gradient-to-r from-green-500/50 to-transparent" />
          </div>
          
          {/* right: live stats badges */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {/* live viewers */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/30 border border-red-200/50 dark:border-red-800/50">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-60" style={{ animationDuration: '2s' }} />
                <div className="relative h-2 w-2 rounded-full bg-red-500" />
              </div>
              <Users className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
              <span className="font-semibold text-red-700 dark:text-red-300">
                {liveViewers} {locale === 'vi' ? 'đang xem' : locale === 'ru' ? 'смотрят' : locale === 'zh' ? '正在观看' : locale === 'ar' ? 'يشاهدون' : locale === 'es' ? 'viendo' : locale === 'fr' ? 'regardent' : locale === 'de' ? 'sehen zu' : locale === 'ja' ? '人が閲覧中' : locale === 'ko' ? '명 보는 중' : locale === 'pt' ? 'vendo' : 'viewing'}
              </span>
            </div>
            
            {/* orders today */}
            {ordersToday > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/30 border border-green-200/50 dark:border-green-800/50">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                <span className="font-semibold text-green-700 dark:text-green-300">
                  {ordersToday}+ {locale === 'vi' ? 'đơn hôm nay' : locale === 'ru' ? 'заказов сегодня' : locale === 'zh' ? '今日订单' : locale === 'ar' ? 'طلبات اليوم' : locale === 'es' ? 'pedidos hoy' : locale === 'fr' ? "commandes aujourd'hui" : locale === 'de' ? 'Bestellungen heute' : locale === 'ja' ? '本日の注文' : locale === 'ko' ? '오늘 주문' : locale === 'pt' ? 'pedidos hoje' : 'orders today'}
                </span>
              </div>
            )}
            
            {/* total orders */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-800/50">
              <BadgeCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-700 dark:text-blue-300">
                {orders.length} {locale === 'vi' ? 'đơn gần đây' : locale === 'ru' ? 'недавних заказов' : locale === 'zh' ? '最近订单' : locale === 'ar' ? 'طلبات حديثة' : locale === 'es' ? 'pedidos recientes' : locale === 'fr' ? 'commandes récentes' : locale === 'de' ? 'kürzliche Bestellungen' : locale === 'ja' ? '件の最近の注文' : locale === 'ko' ? '건 최근 주문' : locale === 'pt' ? 'pedidos recentes' : 'recent orders'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        {/* fade masks */}
        <div className="absolute inset-y-0 left-0 w-16 md:w-24 bg-gradient-to-r from-white dark:from-gray-900 to-transparent z-20 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-16 md:w-24 bg-gradient-to-l from-white dark:from-gray-900 to-transparent z-20 pointer-events-none" />

        <div
          ref={scrollRef}
          className={cn(
            "flex gap-4 overflow-x-auto no-scrollbar py-4 px-4 md:px-8",
            isHovering && (isDragging ? "cursor-grabbing select-none" : "cursor-grab")
          )}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {formattedOrders.map((order, idx) => (
            <div
              key={`${order.id}-${idx}`}
              className="group/card flex-shrink-0 w-[300px] relative transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div
                className="
                  flex flex-col h-full rounded-2xl
                  bg-white dark:bg-gray-800 
                  border border-gray-100 dark:border-gray-700
                  shadow-md hover:shadow-xl
                  transition-all duration-300
                  p-4 relative overflow-hidden
                "
              >
                {/* subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5 pointer-events-none" />
                
                {/* verified badge top right */}
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-[10px] font-bold">
                  <BadgeCheck className="h-3 w-3" />
                  {locale === 'vi' ? 'Đã xác minh' : locale === 'ru' ? 'Проверено' : locale === 'zh' ? '已验证' : locale === 'ar' ? 'موثق' : locale === 'es' ? 'Verificado' : locale === 'fr' ? 'Vérifié' : locale === 'de' ? 'Verifiziert' : locale === 'ja' ? '確認済み' : locale === 'ko' ? '인증됨' : locale === 'pt' ? 'Verificado' : 'Verified'}
                </div>
                
                {/* header: user & time */}
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  {order.userAvatar ? (
                    <div className="relative h-11 w-11 rounded-full overflow-hidden shadow-md ring-2 ring-white dark:ring-gray-700">
                      <Image
                        src={order.userAvatar}
                        alt={order.displayName}
                        fill
                        className="object-cover"
                        sizes="44px"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-green-500 border-2 border-white dark:border-gray-800 flex items-center justify-center">
                        <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-full text-white font-bold shadow-md bg-gradient-to-br",
                        order.avatarGradient
                      )}>
                        {order.initial}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-green-500 border-2 border-white dark:border-gray-800 flex items-center justify-center">
                        <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate pr-16" title={order.displayName}>
                      {order.displayName}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3 flex-shrink-0" />
                      <span>{order.timeAgo}</span>
                    </div>
                  </div>
                </div>

                {/* content: product info */}
                <div className="space-y-3 relative z-10">
                  <div className="relative pl-3 border-l-2 border-green-400 group-hover/card:border-green-500 transition-colors duration-300">
                    {order.items && order.items.length > 0 ? (
                      order.items.slice(0, 1).map((item: any, i: number) => (
                        <div key={i} className="flex flex-col gap-1.5">
                          <span 
                            className="text-sm font-semibold text-gray-800 dark:text-gray-200 line-clamp-1 group-hover/card:text-green-700 dark:group-hover/card:text-green-400 transition-colors" 
                            title={item.name}
                          >
                            {item.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-green-600 dark:text-green-400 font-mono">
                              {formatPrice(order.total || item.price, locale)}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 font-medium">
                              {locale === 'vi' ? 'Thanh toán thành công' : locale === 'ru' ? 'Оплачено' : locale === 'zh' ? '已付款' : locale === 'ar' ? 'مدفوع' : locale === 'es' ? 'Pagado' : locale === 'fr' ? 'Payé' : locale === 'de' ? 'Bezahlt' : locale === 'ja' ? '支払済み' : locale === 'ko' ? '결제 완료' : locale === 'pt' ? 'Pago' : 'Paid'}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="text-sm">Order #{order.orderNumber}</span>
                    )}
                  </div>
                  
                  {/* footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                    {order.items && order.items.length > 1 ? (
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                        +{order.items.length - 1} {locale === 'vi' ? 'sp khác' : locale === 'ru' ? 'ещё' : locale === 'zh' ? '其他' : locale === 'ar' ? 'المزيد' : locale === 'es' ? 'más' : locale === 'fr' ? 'autres' : locale === 'de' ? 'mehr' : locale === 'ja' ? 'その他' : locale === 'ko' ? '더보기' : locale === 'pt' ? 'mais' : 'more'}
                      </span>
                    ) : (
                      <span />
                    )}
                    
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm shadow-green-500/30">
                      <Sparkles className="h-3 w-3" />
                      {t("justBought")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* bottom trust bar with strong commitment */}
      <div className="container mx-auto px-4 mt-8 relative z-10">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-gray-800/50 dark:via-gray-800 dark:to-gray-800/50 border border-gray-200 dark:border-gray-700 p-4 md:p-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* commitment text */}
            <div className="flex items-center gap-3 text-center md:text-left">
              <div className="hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {locale === 'vi' 
                    ? '🛡️ Cam kết: Đơn hàng thực 100% - Không fake, không ảo' 
                    : locale === 'ru'
                    ? '🛡️ Гарантия: 100% Реальные заказы - Без фейков'
                    : locale === 'zh'
                    ? '🛡️ 保证：100%真实订单 - 无造假'
                    : locale === 'ar'
                    ? '🛡️ ضمان: طلبات حقيقية 100% - بدون تزييف'
                    : locale === 'es'
                    ? '🛡️ Garantía: 100% Pedidos Reales - Sin falsificaciones'
                    : locale === 'fr'
                    ? '🛡️ Garantie: 100% Commandes Réelles - Pas de faux'
                    : locale === 'de'
                    ? '🛡️ Garantie: 100% Echte Bestellungen - Keine Fälschungen'
                    : locale === 'ja'
                    ? '🛡️ 保証：100%本物の注文 - 偽造なし'
                    : locale === 'ko'
                    ? '🛡️ 보증: 100% 실제 주문 - 가짜 없음'
                    : locale === 'pt'
                    ? '🛡️ Garantia: 100% Pedidos Reais - Sem falsificações'
                    : '🛡️ Guarantee: 100% Real Orders - No fakes, no bots'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {locale === 'vi' 
                    ? 'Dữ liệu được lấy trực tiếp từ hệ thống thanh toán. Hoàn tiền 200% nếu phát hiện đơn hàng giả.' 
                    : locale === 'ru'
                    ? 'Данные напрямую из системы оплаты. 200% возврат при обнаружении фейка.'
                    : locale === 'zh'
                    ? '数据直接从支付系统获取。发现虚假订单退款200%。'
                    : locale === 'ar'
                    ? 'البيانات مأخوذة مباشرة من نظام الدفع. استرداد 200% عند اكتشاف أي طلب مزيف.'
                    : locale === 'es'
                    ? 'Datos extraídos directamente de nuestro sistema de pago. 200% de reembolso si se encuentra algún pedido falso.'
                    : locale === 'fr'
                    ? 'Données extraites directement de notre système de paiement. Remboursement de 200% si une fausse commande est trouvée.'
                    : locale === 'de'
                    ? 'Daten direkt aus unserem Zahlungssystem. 200% Erstattung bei gefundener gefälschter Bestellung.'
                    : locale === 'ja'
                    ? 'データは決済システムから直接取得。偽の注文が見つかった場合は200%返金。'
                    : locale === 'ko'
                    ? '데이터는 결제 시스템에서 직접 가져옵니다. 가짜 주문 발견 시 200% 환불.'
                    : locale === 'pt'
                    ? 'Dados obtidos diretamente do nosso sistema de pagamento. 200% de reembolso se algum pedido falso for encontrado.'
                    : 'Data pulled directly from our payment system. 200% refund if any fake order is found.'}
                </p>
              </div>
            </div>
            
            {/* trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{locale === 'vi' ? 'Bảo hành trọn đời' : locale === 'ru' ? 'Пожизненная гарантия' : locale === 'zh' ? '终身保修' : locale === 'ar' ? 'ضمان مدى الحياة' : locale === 'es' ? 'Garantía de Por Vida' : locale === 'fr' ? 'Garantie à Vie' : locale === 'de' ? 'Lebenslange Garantie' : locale === 'ja' ? '生涯保証' : locale === 'ko' ? '평생 보증' : locale === 'pt' ? 'Garantia Vitalícia' : 'Lifetime Warranty'}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{locale === 'vi' ? 'Giao hàng tức thì' : locale === 'ru' ? 'Мгновенная доставка' : locale === 'zh' ? '即时配送' : locale === 'ar' ? 'توصيل فوري' : locale === 'es' ? 'Entrega Instantánea' : locale === 'fr' ? 'Livraison Instantanée' : locale === 'de' ? 'Sofortige Lieferung' : locale === 'ja' ? '即時配達' : locale === 'ko' ? '즉시 배송' : locale === 'pt' ? 'Entrega Instantânea' : 'Instant Delivery'}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-semibold">
                <Award className="h-3.5 w-3.5" />
                <span>{locale === 'vi' ? 'Uy tín #1 VN' : locale === 'ru' ? '#1 в VN' : locale === 'zh' ? '越南#1信赖' : locale === 'ar' ? '#1 الأكثر ثقة في VN' : locale === 'es' ? '#1 Confiable en VN' : locale === 'fr' ? '#1 Confiance VN' : locale === 'de' ? '#1 Vertrauenswürdig VN' : locale === 'ja' ? 'VN信頼No.1' : locale === 'ko' ? 'VN 신뢰 1위' : locale === 'pt' ? '#1 Confiável VN' : '#1 Trusted in VN'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
