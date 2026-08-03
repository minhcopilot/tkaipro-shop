"use client";

import { useState, useEffect } from "react";
import { Star, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi as dateFnsVi, enUS as dateFnsEn } from "date-fns/locale";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "~/i18n/navigation";

import { Button } from "~/ui/primitives/button";
import { Textarea } from "~/ui/primitives/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "~/ui/primitives/avatar";
import { Badge } from "~/ui/primitives/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/ui/primitives/card";
import { useSession } from "~/lib/auth-client";
import { Separator } from "~/ui/primitives/separator";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  reply: string | null;
  replyAt: string | null;
  createdAt: string;
  user: {
    name: string;
    image: string | null;
  };
}

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const t = useTranslations("ProductReviews");
  const locale = useLocale();
  const dateLocale = locale === 'vi' ? dateFnsVi : dateFnsEn;
  
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination state (simplified for now)
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const QUICK_TAGS = [
    t("tags.quality"),
    t("tags.support"),
    t("tags.reliable"),
    t("tags.professional"),
    t("tags.fast"),
    t("tags.recommend")
  ];

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/reviews?productId=${productId}&page=${page}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Failed to fetch reviews", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId, page]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error(t("toast.loginRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating,
          comment,
        }),
      });

      if (res.ok) {
        toast.success(t("toast.success"));
        setComment("");
        setRating(5);
        fetchReviews(); // Refresh list
      } else {
        const err = await res.json();
        toast.error(err.error || t("toast.error"));
      }
    } catch (error) {
      toast.error(t("toast.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Write Review */}
        <Card>
            <CardHeader>
                <CardTitle>{t("writeReview.title")}</CardTitle>
                <CardDescription>{t("writeReview.description")}</CardDescription>
            </CardHeader>
            <CardContent>
                {session ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t("writeReview.yourRating")}</label>
                        <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="focus:outline-none transition-colors"
                            >
                            <Star
                                className={`h-6 w-6 ${
                                star <= rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground"
                                }`}
                            />
                            </button>
                        ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t("writeReview.quickTags")}</label>
                        <div className="flex flex-wrap gap-2">
                            {QUICK_TAGS.map((tag, index) => (
                                <Badge 
                                    key={index} 
                                    variant="outline" 
                                    className="cursor-pointer hover:bg-secondary transition-colors py-1 px-3 font-normal"
                                    onClick={() => setComment(prev => prev ? `${prev} ${tag}` : tag)}
                                >
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t("writeReview.commentLabel")}</label>
                        <Textarea
                        placeholder={t("writeReview.placeholder")}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        required
                        />
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? t("writeReview.submitting") : t("writeReview.submit")}
                    </Button>
                    </form>
                ) : (
                    <div className="text-center py-6">
                    <p className="text-muted-foreground mb-4">{t("writeReview.loginRequired")}</p>
                    <Link href="/auth/sign-in">
                      <Button variant="outline">
                        {t("writeReview.loginButton")}
                      </Button>
                    </Link>
                    </div>
                )}
            </CardContent>
        </Card>

        {/* Reviews List */}
        <div className="space-y-6">
            <h3 className="text-xl font-semibold">{t("title", { count: total })}</h3>
            
            {isLoading ? (
                <div className="text-center py-4">{t("list.loading")}</div>
            ) : reviews.length === 0 ? (
                <p className="text-muted-foreground">{t("list.empty")}</p>
            ) : (
                <div className="space-y-6">
                {reviews.map((review) => (
                    <div key={review.id} className="space-y-4">
                    <div className="flex items-start gap-4">
                        <Avatar>
                        <AvatarImage src={review.user.image || undefined} />
                        <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="font-semibold">{review.user.name}</span>
                            <span className="text-xs text-muted-foreground">
                                {format(new Date(review.createdAt), "dd/MM/yyyy", { locale: dateLocale })}
                            </span>
                        </div>
                        <div className="flex text-yellow-400">
                            {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                                key={i}
                                className={`h-3 w-3 ${i < review.rating ? "fill-current" : "text-muted-foreground/30"}`}
                            />
                            ))}
                        </div>
                        <p className="text-sm mt-2">{review.comment}</p>
                        
                        {/* Admin Reply */}
                        {review.reply && (
                            <div className="bg-muted p-3 rounded-md mt-3 ml-2 border-l-2 border-primary">
                                <p className="text-xs font-semibold mb-1">{t("list.adminReply")}</p>
                                <p className="text-sm text-muted-foreground">{review.reply}</p>
                            </div>
                        )}
                        </div>
                    </div>
                    <Separator />
                    </div>
                ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
