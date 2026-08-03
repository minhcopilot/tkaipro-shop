"use client";

import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { SEO_CONFIG } from "~/app";
import { cn } from "~/lib/cn";

interface BreadcrumbItem {
  name: string;
  href: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const pathname = usePathname();
  
  // generate breadcrumbs from pathname if items not provided
  const breadcrumbItems = React.useMemo(() => {
    if (items) return items;
    
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { name: 'Trang Chủ', href: '/' }
    ];
    
    let currentPath = '';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      const name = path
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      breadcrumbs.push({
        name: decodeURIComponent(name),
        href: currentPath
      });
    });
    
    return breadcrumbs;
  }, [pathname, items]);

  // breadcrumb schema.org structured data
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `${SEO_CONFIG.url}${item.href}`
    }))
  };

  if (breadcrumbItems.length <= 1) return null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema)
        }}
      />
      <nav
        aria-label="Breadcrumb"
        className={cn("flex items-center space-x-2 text-sm text-muted-foreground", className)}
      >
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          
          return (
            <React.Fragment key={item.href}>
              {index === 0 ? (
                <Link
                  href={item.href}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  <Home className="h-4 w-4" />
                  <span className="sr-only">{item.name}</span>
                </Link>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "hover:text-foreground transition-colors",
                    isLast && "font-medium text-foreground"
                  )}
                >
                  {item.name}
                </Link>
              )}
              {!isLast && (
                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </>
  );
}

