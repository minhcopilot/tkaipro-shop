"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowRight, Shield, CheckCircle2, TrendingUp, Users, Award, Star, Sparkles, X, ZoomIn, ZoomOut, Maximize2, Move, Calendar, Package, User, Coins } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "~/ui/primitives/button";
import { Card, CardContent } from "~/ui/primitives/card";
import { Badge } from "~/ui/primitives/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "~/ui/primitives/dialog";

interface SocialProofData {
  id: string;
  title: string;
  description?: string | null;
  imageUrl: string;
  platform?: string | null;
  productType: string;
  orderNumber?: string | null;
  customerName?: string | null;
  amount?: number | null;
  orderDate?: Date | null;
  isFeatured?: boolean | null;
  createdAt: Date;
}

interface TrustSocialProofSectionProps {
  proofs: SocialProofData[];
  stats?: {
    total: number;
    byProduct: {
      cursor: number;
      github: number;
      figma: number;
      jetbrains: number;
    };
  };
}

const productTypeConfig: Record<string, { color: string; icon: string }> = {
  "cursor-pro": { color: "bg-blue-500", icon: "💎" },
  "cursor-pro-official-1m": { color: "bg-blue-700", icon: "🛡️" },
  "github-copilot": { color: "bg-purple-500", icon: "🚀" },
  "github-edu": { color: "bg-green-500", icon: "🎓" },
  "figma-pro": { color: "bg-pink-500", icon: "🎨" },
  "jetbrains-edu": { color: "bg-orange-500", icon: "⚡" },
};

export function TrustSocialProofSection({ proofs, stats }: TrustSocialProofSectionProps) {
  const t = useTranslations("TrustSocialProof");
  const displayProofs = proofs.slice(0, 6);
  const totalOrders = stats?.total || proofs.length;
  const cursorOrders = stats?.byProduct?.cursor || 0;
  
  // modal state
  const [selectedProof, setSelectedProof] = useState<SocialProofData | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // format date with time
  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // zoom functions
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 5));
    setIsZoomed(true);
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const newZoom = Math.max(prev - 0.25, 1);
      if (newZoom === 1) {
        setIsZoomed(false);
        setPanPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setIsZoomed(false);
    setPanPosition({ x: 0, y: 0 });
  };

  // wheel zoom
  useEffect(() => {
    if (!selectedProof || !containerRef.current) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      setZoomLevel(prev => {
        const newZoom = Math.max(1, Math.min(5, prev + delta));
        if (newZoom === 1) {
          setIsZoomed(false);
          setPanPosition({ x: 0, y: 0 });
        } else {
          setIsZoomed(true);
        }
        return newZoom;
      });
    };

    const container = containerRef.current;
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [selectedProof]);

  // pan functions
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1 && e.button === 0) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ 
        x: e.clientX - panPosition.x, 
        y: e.clientY - panPosition.y 
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && zoomLevel > 1) {
      e.preventDefault();
      const newX = e.clientX - panStart.x;
      const newY = e.clientY - panStart.y;
      
      const maxPan = 200 * zoomLevel;
      setPanPosition({
        x: Math.max(-maxPan, Math.min(maxPan, newX)),
        y: Math.max(-maxPan, Math.min(maxPan, newY)),
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // touch support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoomLevel > 1 && e.touches.length === 1) {
      const touch = e.touches[0];
      setIsPanning(true);
      setPanStart({ 
        x: touch.clientX - panPosition.x, 
        y: touch.clientY - panPosition.y 
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPanning && zoomLevel > 1 && e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      const newX = touch.clientX - panStart.x;
      const newY = touch.clientY - panStart.y;
      
      const maxPan = 200 * zoomLevel;
      setPanPosition({
        x: Math.max(-maxPan, Math.min(maxPan, newX)),
        y: Math.max(-maxPan, Math.min(maxPan, newY)),
      });
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
  };

  // reset zoom when proof changes
  useEffect(() => {
    resetZoom();
  }, [selectedProof]);

  return (
    <section className="relative overflow-hidden border-y-2 border-border bg-muted py-16 md:py-24">
      <div className="relative container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* header with badge */}
        <div className="mb-12 flex flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-md border-2 border-border bg-primary px-6 py-3 text-primary-foreground shadow-hard">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-black">{t("badge")}</span>
            <CheckCircle2 className="h-5 w-5" />
          </div>
          
          <h2 className="mb-6 font-display text-4xl leading-tight font-black tracking-tight md:text-5xl">
            <span className="bg-primary px-2 text-primary-foreground">
              {t("titlePart1")}
            </span>
            <span className="mt-3 block text-foreground">
              {t("titlePart2")}
            </span>
          </h2>
          
          <p className="mt-4 max-w-3xl text-center text-lg text-muted-foreground md:text-xl leading-relaxed">
            {t("description")}
          </p>
        </div>

        {/* stats cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12 max-w-5xl mx-auto">
            <Card className="border border-border bg-background">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 rounded-lg border border-border bg-muted">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                  {totalOrders}+
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {t("stats.successOrders")}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border bg-background">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 rounded-full bg-gradient-to-br from-green-500 to-green-600">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                  {cursorOrders}+
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  cursor pro
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border bg-background">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 rounded-lg border border-border bg-muted">
                    <Award className="h-6 w-6 text-foreground" />
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                  {stats?.byProduct?.github || 0}+
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  github copilot
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border bg-background">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 rounded-lg border border-border bg-muted">
                    <Star className="h-6 w-6 text-foreground" />
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                  4.9/5
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {t("stats.avgRating")}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* proofs preview grid */}
        {displayProofs.length > 0 ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-10">
              {displayProofs.map((proof, index) => {
                const config = productTypeConfig[proof.productType] || { 
                  color: "bg-gray-500",
                  icon: "📦"
                };
                const label = t.has(`productTypes.${proof.productType}`) 
                  ? t(`productTypes.${proof.productType}`)
                  : proof.productType;
                
                return (
                  <Card 
                    key={proof.id} 
                    onClick={() => setSelectedProof(proof)}
                    className="group overflow-hidden rounded-2xl border-2 border-transparent bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:border-primary/50 cursor-pointer"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                      <Image
                        src={proof.imageUrl}
                        alt={proof.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      
                      {/* overlay gradient on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* badges */}
                      {proof.isFeatured && (
                        <div className="absolute top-4 right-4 z-10">
                          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                            <Star className="h-3.5 w-3.5 fill-white" />
                            nổi bật
                          </div>
                        </div>
                      )}
                      
                      <div className={`absolute top-4 left-4 z-10 ${config.color} text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5`}>
                        <span>{config.icon}</span>
                        {label}
                      </div>

                      {/* verified badge */}
                      <div className="absolute bottom-4 left-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          đã xác minh
                        </div>
                      </div>
                    </div>
                    
                    <CardContent className="p-5">
                      <h3 className="font-bold text-lg mb-2 line-clamp-2 text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">
                        {proof.title}
                      </h3>
                      {proof.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                          {proof.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                        {proof.customerName && (
                          <span className="flex items-center gap-1.5">
                            <Shield className="h-3.5 w-3.5" />
                            {proof.customerName}
                          </span>
                        )}
                        {(proof.orderDate || proof.createdAt) && (
                          <span>
                            {formatDate(proof.orderDate || proof.createdAt)}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mb-10">
              <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md">
                <Shield className="h-5 w-5 text-green-500" />
                <span className="text-sm font-semibold text-foreground">{t("labels.authentic")}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md">
                <CheckCircle2 className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-semibold text-foreground">{t("labels.warranty")}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md">
                <Users className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-semibold text-foreground">{t("labels.support")}</span>
              </div>
            </div>

            {/* cta button */}
            <div className="flex flex-col items-center gap-4">
              <Link href="/khach-hang-da-mua">
                <Button
                  size="lg"
                  className="h-14 gap-3 px-10 text-lg bg-gradient-to-r from-primary via-purple-600 to-pink-600 hover:from-primary/90 hover:via-purple-500 hover:to-pink-500 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  <Sparkles className="h-5 w-5" />
                  {t("cta")}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                {t("ctaSub")}
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <p className="text-lg text-muted-foreground font-medium">
              {t("empty.title")}
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedProof} onOpenChange={(open) => !open && setSelectedProof(null)}>
        {selectedProof && (
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
            <DialogTitle className="sr-only">{selectedProof.title}</DialogTitle>
            <div className="relative">
              {/* Close button */}
              <button
                onClick={() => setSelectedProof(null)}
                className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Image with Zoom */}
              <div 
                ref={containerRef}
                className={`relative bg-black group overflow-hidden ${isPanning ? 'cursor-grabbing' : zoomLevel > 1 ? 'cursor-grab' : ''}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="relative w-full h-[60vh] flex items-center justify-center">
                  <img
                    ref={imageRef}
                    src={selectedProof.imageUrl}
                    alt={selectedProof.title}
                    className={`max-w-full max-h-full object-contain transition-transform duration-200 ${
                      zoomLevel > 1 ? 'cursor-move' : 'cursor-zoom-in'
                    }`}
                    style={{
                      transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                      transformOrigin: 'center center',
                    }}
                    onClick={() => {
                      if (zoomLevel === 1) {
                        handleZoomIn();
                      }
                    }}
                  />
                </div>
                
                {/* Zoom controls */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleZoomOut();
                      }}
                      disabled={zoomLevel <= 1}
                      className="p-1.5 rounded-full hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Thu nhỏ"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </button>
                    <span className="text-xs min-w-[3rem] text-center">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleZoomIn();
                      }}
                      disabled={zoomLevel >= 5}
                      className="p-1.5 rounded-full hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Phóng to"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                    {zoomLevel > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          resetZoom();
                        }}
                        className="p-1.5 rounded-full hover:bg-white/20 transition-colors ml-2"
                        title="Đặt lại"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Zoom hint */}
                {zoomLevel === 1 && (
                  <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-xs flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <Maximize2 className="h-3 w-3" />
                    Click để phóng to • Cuộn chuột để zoom
                  </div>
                )}

                {/* Pan hint */}
                {zoomLevel > 1 && (
                  <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-xs flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <Move className="h-3 w-3" />
                    Kéo để di chuyển • Cuộn chuột để zoom
                  </div>
                )}
                
                {/* Badges overlay */}
                <div className="absolute top-4 left-4 flex gap-2 pointer-events-none">
                  {selectedProof.isFeatured && (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-lg">
                      <Star className="h-4 w-4 mr-1 fill-white" />
                      Nổi bật
                    </Badge>
                  )}
                  <Badge className="bg-green-500 text-white border-0 shadow-lg">
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Đã xác minh
                  </Badge>
                </div>
              </div>

              {/* Details */}
              <div className="p-6 space-y-6 bg-white dark:bg-gray-800 max-h-[30vh] overflow-y-auto">
                {/* Product type */}
                {/* Product type */}
                <div>
                  <Badge className={`${productTypeConfig[selectedProof.productType]?.color || "bg-gray-500"} text-white border-0 text-base px-4 py-2`}>
                    {productTypeConfig[selectedProof.productType]?.icon || "📦"} {t.has(`productTypes.${selectedProof.productType}`) ? t(`productTypes.${selectedProof.productType}`) : selectedProof.productType}
                  </Badge>
                </div>

                {/* Title */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {selectedProof.title}
                  </h2>
                  {selectedProof.description && (
                    <p className="text-gray-600 dark:text-gray-400 mt-3">
                      {selectedProof.description}
                    </p>
                  )}
                </div>

                {/* Order details grid */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {selectedProof.orderNumber && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Package className="h-4 w-4" />
                        <span>Mã đơn hàng</span>
                      </div>
                      <div className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                        {selectedProof.orderNumber}
                      </div>
                    </div>
                  )}
                  
                  {selectedProof.customerName && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <User className="h-4 w-4" />
                        <span>Khách hàng</span>
                      </div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {selectedProof.customerName}
                      </div>
                    </div>
                  )}
                  
                  {selectedProof.amount && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Coins className="h-4 w-4" />
                        <span>Giá trị</span>
                      </div>
                      <div className="font-bold text-lg text-green-600 dark:text-green-400">
                        {typeof selectedProof.amount === 'number' 
                          ? `${selectedProof.amount.toLocaleString('vi-VN')} đ`
                          : selectedProof.amount}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>Ngày đặt hàng</span>
                    </div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {formatDate(selectedProof.orderDate || selectedProof.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </section>
  );
}

