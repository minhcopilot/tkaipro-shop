"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  BarChart3, 
  Users, 
  Upload, 
  Settings,
  Home,
  FileText,
  Tag,
  ShoppingBag,
  Clock,
  Key,
  ChevronLeft,
  ChevronRight,
  Award,
  MessageCircle,
  Bell,
  BadgeDollarSign,
  Ticket,
  ShieldAlert,
  Ban,
  Activity,
  Wallet,
  Receipt,
  KeyRound,
  Crown,
} from "lucide-react";

import { cn } from "~/lib/cn";
import { Button } from "~/ui/primitives/button";
import { Badge } from "~/ui/primitives/badge";

const navigationItems = [
  {
    label: "Tổng quan",
    href: "/admin/summary", 
    icon: Home,
    description: "Thống kê tổng quan",
  },
  {
    label: "Người dùng",
    href: "/admin/users",
    icon: Users,
    description: "Quản lý tài khoản",
  },
  {
    label: "Sản phẩm",
    href: "/admin/products",
    icon: FileText,
    description: "Quản lý sản phẩm",
  },
  {
    label: "Danh mục",
    href: "/admin/categories",
    icon: Tag,
    description: "Quản lý danh mục sản phẩm",
  },
  {
    label: "Đơn hàng",
    href: "/admin/orders",
    icon: ShoppingBag,
    description: "Quản lý đơn hàng & thanh toán",
  },
  {
    label: "Nạp ví",
    href: "/admin/wallet/topups",
    icon: Wallet,
    description: "Duyệt yêu cầu nạp tiền (crypto)",
  },
  {
    label: "Lịch sử ví",
    href: "/admin/wallet/transactions",
    icon: Receipt,
    description: "Audit log số dư ví khách",
  },
  {
    label: "Số dư user",
    href: "/admin/wallet/users",
    icon: Wallet,
    description: "Xem & điều chỉnh số dư ví user",
  },
  {
    label: "Ban IP / Email",
    href: "/admin/bans",
    icon: Ban,
    description: "Chặn IP & email lạm dụng",
  },
  {
    label: "Giám sát IP",
    href: "/admin/ip-monitor",
    icon: Activity,
    description: "Theo dõi IP & multi-account",
  },
  {
    label: "Subscriptions",
    href: "/admin/subscriptions",
    icon: Clock,
    description: "Quản lý thời hạn tài khoản",
  },
  {
    label: "License Keys",
    href: "/admin/licenses",
    icon: Key,
    description: "Quản lý license JetBrains",
  },
  {
    label: "Đánh giá",
    href: "/admin/reviews",
    icon: MessageCircle,
    description: "Quản lý đánh giá sản phẩm",
  },
  {
    label: "Khách hàng đã mua",
    href: "/admin/social-proofs",
    icon: Award,
    description: "Quản lý minh chứng đơn hàng",
  },
  {
    label: "Blog",
    href: "/admin/blogs",
    icon: FileText,
    description: "Quản lý bài viết blog",
  },
  {
    label: "Thông báo",
    href: "/admin/announcements",
    icon: Bell,
    description: "Quản lý thông báo popup",
  },
  {
    label: "Mã giảm giá",
    href: "/admin/vouchers",
    icon: Ticket,
    description: "Cấp & quản lý mã giảm giá",
  },
  {
    label: "Uploads",
    href: "/admin/uploads", 
    icon: Upload,
    description: "Quản lý tập tin",
  },
  {
    label: "Báo cáo doanh thu",
    href: "/admin/reports",
    icon: BarChart3,
    description: "Phân tích doanh thu chi tiết",
  },
  {
    label: "Top chi tiêu",
    href: "/admin/stats/top-spenders",
    icon: Crown,
    description: "Khách chi tiêu nhiều nhất",
  },
  {
    label: "Cài đặt",
    href: "/admin/settings",
    icon: Settings,
    description: "Cấu hình hệ thống",
  },
];

export interface AdminNavigationProps {
  onNavigate?: () => void;
  isMobile?: boolean;
  unrepliedReviewsCount?: number;
}

export default function AdminNavigation({ 
  onNavigate, 
  isMobile = false,
  unrepliedReviewsCount = 0 
}: AdminNavigationProps): JSX.Element {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(true);

  // load collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("admin-nav-collapsed");
    if (savedState !== null) {
      setIsCollapsed(savedState === "true");
    }
  }, []);

  // save collapsed state to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("admin-nav-collapsed", String(newState));
    
    // dispatch event for layout to update
    window.dispatchEvent(new CustomEvent("nav-toggle", { 
      detail: { isCollapsed: newState } 
    }));
  };

  // trên mobile luôn expanded
  const showCollapsed = isMobile ? false : isCollapsed;

  return (
    <nav className="space-y-2 relative">
      {/* Toggle Button - chỉ hiện trên desktop */}
      {!isMobile && (
        <div className={cn(
          "flex items-center justify-between mb-4",
          showCollapsed && "justify-center"
        )}>
          {!showCollapsed && (
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Navigation
            </h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapse}
            className="h-8 w-8 p-0"
            title={showCollapsed ? "Mở rộng" : "Thu nhỏ"}
          >
            {showCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
      
      {navigationItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = pathname === item.href || 
          (item.href !== "/admin" && pathname.startsWith(item.href));
        


        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => onNavigate?.()}
            className={cn(
              "flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-colors group relative",
              "hover:bg-gray-100 dark:hover:bg-gray-700",
              isActive 
                ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-r-2 border-blue-700 dark:border-blue-400" 
                : "text-gray-700 dark:text-gray-300",
              showCollapsed ? "justify-center" : "gap-3"
            )}
            title={showCollapsed ? item.label : undefined}
          >
            <div className="relative">
                <IconComponent className={cn(
                "h-5 w-5 flex-shrink-0",
                isActive ? "text-blue-700 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
                )} />
            </div>
            
            {!showCollapsed && (
              <div className="flex-1 min-w-0 flex items-center justify-between">
                <div>
                    <div className="font-medium truncate">{item.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.description}</div>
                </div>
              </div>
            )}
            
            {/* Tooltip khi collapsed - chỉ trên desktop */}
            {showCollapsed && !isMobile && (
              <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none">
                <div className="font-medium flex items-center gap-2">
                    {item.label}
                </div>
                <div className="text-xs text-gray-300 dark:text-gray-400">{item.description}</div>
                <div className="absolute top-1/2 right-full -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-700"></div>
              </div>
            )}
          </Link>
        );
      })}
    </nav>
  );
} 