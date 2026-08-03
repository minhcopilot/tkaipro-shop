"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

import AdminNavigation from "./components/admin-navigation";
import { Button } from "~/ui/primitives/button";
import { cn } from "~/lib/cn";

export default function AdminLayoutClient({
  children,
  unrepliedReviewsCount = 0
}: {
  children: React.ReactNode,
  unrepliedReviewsCount?: number
}) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // sync with navigation state
  useEffect(() => {
    const savedState = localStorage.getItem("admin-nav-collapsed");
    if (savedState !== null) {
      setIsCollapsed(savedState === "true");
    }

    // listen for changes
    const handleStorageChange = () => {
      const newState = localStorage.getItem("admin-nav-collapsed");
      if (newState !== null) {
        setIsCollapsed(newState === "true");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    
    // custom event for same-window updates
    const handleNavToggle = (e: CustomEvent) => {
      setIsCollapsed(e.detail.isCollapsed);
    };
    
    window.addEventListener("nav-toggle" as any, handleNavToggle);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("nav-toggle" as any, handleNavToggle);
    };
  }, []);

  // close mobile menu when clicking outside
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-4 md:py-6 px-4">
        {/* Header */}
        <div className="mb-6 md:mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Quản lý hệ thống</p>
          </div>
          
          {/* Mobile Menu Button */}
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Navigation & Content */}
        <div className="flex gap-6">
          {/* Desktop Sidebar Navigation */}
          <div 
            className="hidden lg:block flex-shrink-0 transition-all duration-300"
            style={{ width: isCollapsed ? '80px' : '280px' }}
          >
            <div className="rounded-lg bg-white dark:bg-gray-800 p-4 shadow-sm sticky top-6">
              <AdminNavigation 
                onNavigate={() => {}} 
                unrepliedReviewsCount={unrepliedReviewsCount} 
              />
            </div>
          </div>

          {/* Mobile Sidebar Navigation (Drawer) */}
          {isMobileMenuOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              
              {/* Drawer */}
              <div className={cn(
                "fixed inset-y-0 left-0 w-72 bg-white dark:bg-gray-800 z-50 lg:hidden",
                "transform transition-transform duration-300 ease-in-out",
                "shadow-xl overflow-y-auto"
              )}>
                <div className="p-4">
                  {/* Mobile Menu Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Menu Admin</h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  {/* Navigation */}
                  <AdminNavigation 
                    onNavigate={() => setIsMobileMenuOpen(false)}
                    isMobile={true}
                    unrepliedReviewsCount={unrepliedReviewsCount}
                  />
                </div>
              </div>
            </>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="rounded-lg bg-white dark:bg-gray-800 p-4 md:p-6 shadow-sm">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 