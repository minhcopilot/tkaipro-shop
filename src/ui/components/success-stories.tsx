import { Star, Code, Zap, TrendingUp } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { SEO_CONFIG } from "~/app";
import { Badge } from "~/ui/primitives/badge";
import { Card, CardContent } from "~/ui/primitives/card";

const FACEBOOK_URL = SEO_CONFIG.supportContacts.facebook;

export async function SuccessStories() {
  const t = await getTranslations("SuccessStories");
  
  // Defines static data structure for iteration, but pulls content from translations
  const storiesList = [
    {
      name: "Nguyễn Văn Minh",
      company: "TechViet Solutions",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      techStack: ["React", "Node.js", "TypeScript"]
    },
    {
      name: "Trần Thị Lan",
      company: "VinTech",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      techStack: ["Vue.js", "Nuxt", "TailwindCSS"]
    },
    {
      name: "Lê Hoàng Nam",
      company: "Startup ABC",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face", 
      techStack: ["Python", "Django", "PostgreSQL"]
    },
    {
      name: "Phạm Đức Anh",
      company: "FPT Software",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
      techStack: ["Terraform", "Kubernetes", "AWS"]
    },
    {
      name: "Võ Thị Mai",
      company: "Freelancer",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      techStack: ["React Native", "Flutter", "Firebase"]
    },
    {
      name: "Đặng Quoc Huy", 
      company: "VinAI Research",
      avatar: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face",
      techStack: ["Python", "PyTorch", "CUDA"]
    }
  ];

  const stats = [
    { number: "150+", label: t("stats.developers"), icon: <Code className="h-6 w-6 text-foreground" /> },
    { number: "3.2x", label: t("stats.speed"), icon: <Zap className="h-6 w-6 text-foreground" /> },
    { number: "89%", label: t("stats.debug"), icon: <TrendingUp className="h-6 w-6 text-foreground" /> },
    { number: "4.9/5", label: t("stats.rating"), icon: <Star className="h-6 w-6 text-foreground" /> }
  ];

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("description")}
          </p>
        </div>

        {/* Stats */}
        <div className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="border-border text-center">
              <CardContent className="p-6">
                <div className="mb-3 flex justify-center">
                  {stat.icon}
                </div>
                <div className="mb-1 text-2xl font-bold text-foreground">{stat.number}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Success Stories Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {storiesList.map((story, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative">
                    <Image
                      src={story.avatar}
                      alt={story.name}
                      width={60}
                      height={60}
                      className="rounded-full object-cover"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{story.name}</h3>
                    <p className="text-sm text-muted-foreground">{t(`stories.${index}.role`)}</p>
                    <p className="text-xs text-primary font-medium">{story.company}</p>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="text-sm text-muted-foreground ml-2">5.0/5</span>
                </div>

                {/* Story */}
                <blockquote className="text-sm text-muted-foreground mb-4 italic">
                  "{t(`stories.${index}.story`)}"
                </blockquote>

                {/* Results */}
                <div className="space-y-2 mb-4">
                  <h4 className="font-medium text-sm">{t("resultsLabel")}</h4>
                  <ul className="space-y-1">
                    {[0, 1, 2].map((i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                        <div className="w-1 h-1 bg-primary rounded-full"></div>
                        {t(`stories.${index}.results.${i}`)}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-1">
                  {story.techStack.map((tech, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center bg-muted/40 rounded-2xl p-8">
          <h3 className="font-display text-2xl font-bold mb-4">
            {t("cta.title")}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            {t("cta.description")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#pricing"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              {t("cta.start")}
            </a>
            {FACEBOOK_URL && (
              <a 
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 border border-primary text-primary rounded-lg font-medium hover:bg-primary/10 transition-colors"
              >
                {t("cta.follow")}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
} 