import { ArrowRight, Shield, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { Link } from "~/i18n/navigation";
import { getTranslations, getLocale } from "next-intl/server";

import { Button } from "~/ui/primitives/button";
import { Card, CardContent } from "~/ui/primitives/card";

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

interface SocialProofPreviewSectionProps {
  proofs: SocialProofData[];
}

const productTypeColors: Record<string, string> = {
  "cursor-pro": "bg-blue-500",
  "cursor-pro-official-1m": "bg-blue-700",
  "github-copilot": "bg-purple-500",
  "github-edu": "bg-green-500",
  "figma-pro": "bg-pink-500",
  "jetbrains-edu": "bg-orange-500",
};

export async function SocialProofPreviewSection({ proofs }: SocialProofPreviewSectionProps) {
  const t = await getTranslations("SocialProofPreview");
  const locale = await getLocale();
  const displayProofs = proofs.slice(0, 6);

  return (
    <section className="py-12 md:py-16 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* header */}
        <div className="mb-12 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-primary">{t("badge")}</span>
          </div>
          
          <h2 className="font-display text-3xl leading-tight font-bold tracking-tight md:text-4xl mb-4">
            {t("title")}
            <span className="block mt-2 text-foreground">
              {t("highlight")}
            </span>
          </h2>
          
          <p className="mt-4 max-w-2xl text-center text-muted-foreground md:text-lg">
            {t("description")}
          </p>
        </div>

        {/* proofs grid */}
        {displayProofs.length > 0 ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {displayProofs.map((proof) => {
                const color = productTypeColors[proof.productType] || "bg-gray-500";
                // Safe access to product type translation, fallback to key if missing
                let label = proof.productType;
                try {
                  label = t(`productTypes.${proof.productType}` as any);
                  // If result is same as key (and key has dots etc), it might be fallback. 
                  // But here keys are simple. If specific key doesn't exist, next-intl usually returns key path.
                  // We can just rely on t() behavior or add a check if needed.
                } catch (e) {
                  label = proof.productType;
                }
                
                return (
                  <Card key={proof.id} className="overflow-hidden rounded-xl border-none bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-700">
                      <Image
                        src={proof.imageUrl}
                        alt={proof.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {proof.isFeatured && (
                        <div className="absolute top-3 right-3 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {t("featured")}
                        </div>
                      )}
                      <div className={`absolute top-3 left-3 ${color} text-white px-3 py-1 rounded-full text-xs font-semibold`}>
                        {label}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-1 text-gray-900 dark:text-gray-100">
                        {proof.title}
                      </h3>
                      {proof.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                          {proof.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        {proof.customerName && (
                          <span className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            {proof.customerName}
                          </span>
                        )}
                        {proof.orderDate && (
                          <span>
                            {new Date(proof.orderDate).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US')}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* cta button */}
            <div className="flex justify-center">
              <Link href="/khach-hang-da-mua">
                <Button
                  size="lg"
                  className="h-12 gap-2 px-8 bg-primary  shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {t("viewAll")} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t("empty")}</p>
          </div>
        )}
      </div>
    </section>
  );
}

