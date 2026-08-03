"use client";

import { Loader2, Search } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "~/i18n/navigation";

import { formatPrice } from "~/lib/product-localization";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/ui/primitives/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/ui/primitives/command";

interface SearchProduct {
  id: string;
  slug?: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  categoryName?: string;
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const t = useTranslations("Header");
  const locale = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setDebouncedQuery("");
      return;
    }
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    fetch(`/api/products?search=${encodeURIComponent(debouncedQuery)}&limit=6`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.products) setResults(data.products as SearchProduct[]);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [debouncedQuery]);

  const handleSelect = useCallback(
    (slug: string) => {
      onOpenChange(false);
      setQuery("");
      router.push(`/products/${slug}`);
    },
    [onOpenChange, router],
  );

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader className="sr-only">
        <DialogTitle>{t("search.hint")}</DialogTitle>
        <DialogDescription>{t("search.placeholder")}</DialogDescription>
      </DialogHeader>
      <DialogContent className="top-[20%] translate-y-0 max-w-2xl overflow-hidden p-0 gap-0 rounded-xl">
        <Command
          className={`
            [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium
            [&_[cmdk-group-heading]]:text-muted-foreground
            [&_[cmdk-group]]:px-2
            [&_[cmdk-input]]:h-12
            [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-2.5
          `}
        >
          <CommandInput
            placeholder={t("search.placeholder")}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-[360px]">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isLoading && debouncedQuery && results.length === 0 && (
              <CommandEmpty>{t("search.empty")}</CommandEmpty>
            )}

            {results.length > 0 && (
              <CommandGroup>
                {results.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={product.name}
                    onSelect={() => handleSelect(product.slug || product.id)}
                    className="flex items-center gap-3 cursor-pointer rounded-lg"
                  >
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                      {product.image && (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5 overflow-hidden min-w-0 flex-1">
                      <span className="truncate text-sm font-medium">{product.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-primary">
                          {formatPrice(product.price, locale)}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-xs text-muted-foreground line-through">
                            {formatPrice(product.originalPrice, locale)}
                          </span>
                        )}
                        {product.categoryName && (
                          <span className="text-xs text-muted-foreground truncate">
                            · {product.categoryName}
                          </span>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {!isLoading && !debouncedQuery && (
              <div className="flex flex-col items-center justify-center py-10 text-sm text-muted-foreground">
                <Search className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <p>{t("search.placeholder")}</p>
              </div>
            )}
          </CommandList>

          <div className="flex items-center justify-between border-t px-4 py-2.5 text-xs text-muted-foreground">
            <span>{t("search.hint")}</span>
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
              Ctrl+K
            </kbd>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
