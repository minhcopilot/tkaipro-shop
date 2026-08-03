"use client";

import { useState, useRef, useEffect } from "react";
import { CheckCircle2, Star, X, Calendar, Package, User, Coins, ZoomIn, ZoomOut, ExternalLink, ChevronLeft, ChevronRight, ShieldCheck, BadgeCheck, Verified } from "lucide-react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";

import { Badge } from "~/ui/primitives/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "~/ui/primitives/dialog";
import { cn } from "~/lib/cn";

interface Proof {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  platform: string;
  productType: string;
  orderNumber: string | null;
  customerName: string | null;
  amount: string | null;
  orderDate: Date | null;
  formattedOrderDate?: string;
  formattedCreatedAt?: string;
  isFeatured: boolean;
  createdAt: Date;
}

interface ProofGalleryProps {
  proofs: Proof[];
  productTypeLabels: Record<string, { label: string; color: string }>;
}

const ITEMS_PER_PAGE = 50;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

export function ProofGallery({ proofs, productTypeLabels }: ProofGalleryProps) {
  const t = useTranslations("ProofGallery");
  const [selectedProof, setSelectedProof] = useState<Proof | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // pagination logic
  const totalPages = Math.ceil(proofs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProofs = proofs.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, page)));
  };

  const formatDate = (proof: Proof): string => {
    return proof.formattedOrderDate || proof.formattedCreatedAt || "N/A";
  };

  // zoom functions
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom === 1) {
        setPanPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  // wheel zoom
  useEffect(() => {
    if (!selectedProof || !containerRef.current) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const delta = e.deltaY > 0 ? -0.2 : 0.2;
      setZoomLevel(prev => {
        const newZoom = Math.max(1, Math.min(4, prev + delta));
        if (newZoom === 1) {
          setPanPosition({ x: 0, y: 0 });
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
      
      const maxPan = 400 * (zoomLevel - 1);
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
      
      const maxPan = 400 * (zoomLevel - 1);
      setPanPosition({
        x: Math.max(-maxPan, Math.min(maxPan, newX)),
        y: Math.max(-maxPan, Math.min(maxPan, newY)),
      });
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
  };

  useEffect(() => {
    resetZoom();
  }, [selectedProof]);

  // generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showPages = 5;
    
    if (totalPages <= showPages + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      
      if (currentPage > 3) pages.push('...');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) pages.push(i);
      
      if (currentPage < totalPages - 2) pages.push('...');
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <>
      {/* pagination top */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <BadgeCheck className="h-5 w-5 text-green-500" />
              <span>
                Hiển thị <strong className="text-gray-900 dark:text-white">{startIndex + 1}-{Math.min(endIndex, proofs.length)}</strong> trong tổng số <strong className="text-gray-900 dark:text-white">{proofs.length}</strong> minh chứng
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* prev button */}
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Trước</span>
              </button>

              {/* page numbers - compact */}
              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, idx) => (
                  page === '...' ? (
                    <span key={`ellipsis-top-${idx}`} className="px-2 text-gray-400 text-sm">...</span>
                  ) : (
                    <button
                      key={`top-${page}`}
                      onClick={() => goToPage(page as number)}
                      className={cn(
                        "min-w-[32px] h-8 rounded-lg text-sm font-medium transition-all duration-200",
                        currentPage === page
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      )}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>

              {/* next button */}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                <span className="hidden sm:inline">Sau</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        suppressHydrationWarning
      >
        {currentProofs.map((proof) => {
          const productInfo = productTypeLabels[proof.productType] || { 
            label: proof.productType, 
            color: "bg-gray-500" 
          };

          return (
            <motion.button
              layout
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              key={proof.id}
              onClick={() => setSelectedProof(proof)}
              className="group relative bg-white dark:bg-gray-800/50 rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700/50 hover:border-primary/50 text-left"
              suppressHydrationWarning
            >
              {/* Shine effect on hover */}
              <div className="absolute inset-0 z-10 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:animate-shine pointer-events-none" suppressHydrationWarning />

              {/* Image Container */}
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-900" suppressHydrationWarning>
                <img
                  src={proof.imageUrl}
                  alt={proof.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                  suppressHydrationWarning
                />
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                
                {/* Hover Action */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100">
                  <div className="bg-white/20 backdrop-blur-md rounded-full p-3 shadow-xl border border-white/30 text-white">
                    <ZoomIn className="h-6 w-6" />
                  </div>
                </div>

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                  <Badge className="bg-green-500/90 backdrop-blur-sm text-white border-0 shadow-sm flex items-center gap-1 px-2 py-0.5">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{t("badges.verified")}</span>
                  </Badge>
                  {proof.isFeatured && (
                    <Badge className="bg-amber-500/90 backdrop-blur-sm text-white border-0 shadow-sm flex items-center gap-1 px-2 py-0.5">
                      <Star className="h-3 w-3 fill-current" />
                      <span>{t("badges.featured")}</span>
                    </Badge>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge className={cn(
                    productInfo.color, 
                    "text-white border-0 text-xs px-2 py-0.5 shadow-sm bg-opacity-90"
                  )}>
                    {productInfo.label}
                  </Badge>
                  {proof.amount && (
                    <div className="flex items-center gap-1 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                      <Coins className="h-3 w-3" />
                      {proof.amount}
                    </div>
                  )}
                </div>

                <h3 className="font-bold text-base bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 line-clamp-2 min-h-[3rem]">
                  {proof.title}
                </h3>

                <div className="pt-3 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between text-xs text-muted-foreground" suppressHydrationWarning>
                  <div className="flex items-center gap-1.5" suppressHydrationWarning>
                    <Calendar className="h-3.5 w-3.5" />
                    <span suppressHydrationWarning>{formatDate(proof)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                     {t("cta")} <ExternalLink className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {proofs.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Package className="h-12 w-12 text-gray-400" />
          </div>
          <p className="text-xl font-semibold">{t("empty.title")}</p>
          <p className="text-sm mt-2">{t("empty.description")}</p>
        </div>
      )}

      {/* pagination */}
      {totalPages > 1 && (
        <div className="mt-10 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            {/* prev button */}
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Trước</span>
            </button>

            {/* page numbers */}
            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, idx) => (
                page === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-3 py-2 text-gray-400">...</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => goToPage(page as number)}
                    className={cn(
                      "min-w-[40px] h-10 rounded-lg font-medium transition-all duration-200",
                      currentPage === page
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                        : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    )}
                  >
                    {page}
                  </button>
                )
              ))}
            </div>

            {/* next button */}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <span className="hidden sm:inline">Sau</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* quick jump */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Đi tới trang:</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) goToPage(val);
              }}
              className="w-16 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span>/ {totalPages}</span>
          </div>
        </div>
      )}

      {/* Detail Modal - LARGER & BETTER */}
      <Dialog open={!!selectedProof} onOpenChange={(open) => !open && setSelectedProof(null)}>
        {selectedProof && (
          <DialogContent className="max-w-6xl w-[98vw] h-[95vh] overflow-hidden p-0 border-none bg-transparent shadow-2xl">
            <DialogTitle className="sr-only">{selectedProof.title}</DialogTitle>
            <div className="relative flex flex-col lg:flex-row h-full bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl overflow-hidden">
              
              {/* Close button */}
              <button
                onClick={() => setSelectedProof(null)}
                className="absolute top-4 right-4 z-[60] bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-all duration-200 backdrop-blur-md border border-white/20 hover:scale-110"
              >
                <X className="h-6 w-6" />
              </button>

              {/* Image Section - Larger */}
              <div 
                ref={containerRef}
                className="relative w-full lg:w-2/3 h-[50vh] lg:h-full bg-black/50 flex items-center justify-center overflow-hidden"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Background pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_70%)]" />
                
                <div 
                   className={cn(
                     "w-full h-full flex items-center justify-center p-4",
                     isPanning ? 'cursor-grabbing' : zoomLevel > 1 ? 'cursor-grab' : 'cursor-zoom-in'
                   )}
                >
                  <img
                    ref={imageRef}
                    src={selectedProof.imageUrl}
                    alt={selectedProof.title}
                    className="max-w-full max-h-full object-contain transition-transform duration-100 rounded-lg shadow-2xl"
                    style={{
                      transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                    }}
                    onClick={() => {
                      if (zoomLevel === 1) handleZoomIn();
                    }}
                  />
                </div>

                {/* Zoom Controls */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-xl px-6 py-3 rounded-full border border-white/20 shadow-2xl z-50">
                   <button 
                     onClick={handleZoomOut} 
                     disabled={zoomLevel <= 1} 
                     className="p-2 text-white hover:text-blue-400 disabled:opacity-30 transition-colors rounded-full hover:bg-white/10"
                   >
                     <ZoomOut className="h-5 w-5" />
                   </button>
                   <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full">
                     <span className="text-white text-sm font-mono">{Math.round(zoomLevel * 100)}%</span>
                   </div>
                   <button 
                     onClick={handleZoomIn} 
                     disabled={zoomLevel >= 4} 
                     className="p-2 text-white hover:text-blue-400 disabled:opacity-30 transition-colors rounded-full hover:bg-white/10"
                   >
                     <ZoomIn className="h-5 w-5" />
                   </button>
                   {zoomLevel > 1 && (
                     <button 
                       onClick={resetZoom} 
                       className="ml-2 p-2 text-white hover:text-red-400 transition-colors rounded-full hover:bg-white/10"
                     >
                       <X className="h-4 w-4" />
                     </button>
                   )}
                </div>

                {/* Trust badge on image */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg">
                    <Verified className="h-4 w-4" />
                    Đã xác minh 100%
                  </div>
                </div>
              </div>

              {/* Info Section - Better design */}
              <div className="w-full lg:w-1/3 h-[50vh] lg:h-full overflow-y-auto bg-gradient-to-b from-gray-900 to-slate-900 flex flex-col">
                <div className="p-6 lg:p-8 space-y-6 flex-1">
                  
                  {/* Product Badge */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={cn(
                      productTypeLabels[selectedProof.productType]?.color || "bg-gray-500",
                      "text-white px-4 py-1.5 text-sm font-bold shadow-lg border-0"
                    )}>
                      {productTypeLabels[selectedProof.productType]?.label || selectedProof.productType}
                    </Badge>
                    {selectedProof.isFeatured && (
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 text-sm font-bold shadow-lg border-0 flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        Nổi bật
                      </Badge>
                    )}
                  </div>
                  
                  {/* Title */}
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-white leading-tight">
                      {selectedProof.title}
                    </h2>
                    {selectedProof.description && (
                      <p className="text-gray-400 leading-relaxed mt-3 text-sm lg:text-base">
                        {selectedProof.description}
                      </p>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />

                  {/* Details */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Chi tiết đơn hàng
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {selectedProof.amount && (
                        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
                          <div className="flex items-center gap-2 text-green-400">
                            <Coins className="h-5 w-5" />
                            <span className="font-medium">Giá trị</span>
                          </div>
                          <span className="text-xl font-bold text-green-400">{selectedProof.amount}</span>
                        </div>
                      )}

                      {selectedProof.customerName && (
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                          <div className="flex items-center gap-2 text-gray-400">
                            <User className="h-5 w-5" />
                            <span>Khách hàng</span>
                          </div>
                          <span className="font-semibold text-white">{selectedProof.customerName}</span>
                        </div>
                      )}
                      
                      {selectedProof.orderNumber && (
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Package className="h-5 w-5" />
                            <span>Mã đơn hàng</span>
                          </div>
                          <span className="font-mono font-semibold text-white">{selectedProof.orderNumber}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10" suppressHydrationWarning>
                        <div className="flex items-center gap-2 text-gray-400">
                          <Calendar className="h-5 w-5" />
                          <span>Ngày đặt hàng</span>
                        </div>
                        <span className="font-semibold text-white" suppressHydrationWarning>{formatDate(selectedProof)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Trust Badges */}
                <div className="p-6 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 border-t border-white/10">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-center gap-6">
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="text-sm font-bold">Đơn hàng thật 100%</span>
                      </div>
                      <div className="w-px h-5 bg-white/20" />
                      <div className="flex items-center gap-2 text-blue-400">
                        <ShieldCheck className="h-5 w-5" />
                        <span className="text-sm font-bold">Đã xác minh</span>
                      </div>
                    </div>
                    <p className="text-center text-xs text-gray-500">
                      Dữ liệu được lấy trực tiếp từ hệ thống thanh toán
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
