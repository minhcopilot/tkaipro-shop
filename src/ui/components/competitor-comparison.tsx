import { Check, X, Star } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Badge } from "~/ui/primitives/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";

export async function CompetitorComparison() {
  const t = await getTranslations("CompetitorComparison");

  const comparisonData = [
    {
      feature: t("features.completion"),
      cursor: { value: t("values.cursor.completion"), highlight: true },
      vscode: { value: t("values.vscode.completion"), highlight: false },
      copilot: { value: t("values.copilot.completion"), highlight: false },
      codeium: { value: t("values.codeium.completion"), highlight: false }
    },
    {
      feature: t("features.chat"),
      cursor: { value: t("values.cursor.chat"), highlight: true },
      vscode: { value: t("values.vscode.chat"), highlight: false },
      copilot: { value: t("values.copilot.chat"), highlight: false },
      codeium: { value: t("values.codeium.chat"), highlight: false }
    },
    {
      feature: t("features.models"),
      cursor: { value: t("values.cursor.models"), highlight: true },
      vscode: { value: t("values.vscode.models"), highlight: false },
      copilot: { value: t("values.copilot.models"), highlight: false },
      codeium: { value: t("values.codeium.models"), highlight: false }
    },
    {
      feature: t("features.analysis"),
      cursor: { value: t("values.cursor.analysis"), highlight: true },
      vscode: { value: t("values.vscode.analysis"), highlight: false },
      copilot: { value: t("values.copilot.analysis"), highlight: false },
      codeium: { value: t("values.codeium.analysis"), highlight: false }
    },
    {
      feature: t("features.editing"),
      cursor: { value: t("values.cursor.editing"), highlight: true },
      vscode: { value: t("values.vscode.editing"), highlight: false },
      copilot: { value: t("values.copilot.editing"), highlight: false },
      codeium: { value: t("values.codeium.editing"), highlight: false }
    },
    {
      feature: t("features.generation"),
      cursor: { value: t("values.cursor.generation"), highlight: true },
      vscode: { value: t("values.vscode.generation"), highlight: false },
      copilot: { value: t("values.copilot.generation"), highlight: false },
      codeium: { value: t("values.codeium.generation"), highlight: false }
    },
    {
      feature: t("features.debug"),
      cursor: { value: t("values.cursor.debug"), highlight: true },
      vscode: { value: t("values.vscode.debug"), highlight: false },
      copilot: { value: t("values.copilot.debug"), highlight: false },
      codeium: { value: t("values.codeium.debug"), highlight: false }
    },
    {
      feature: t("features.performance"),
      cursor: { value: t("values.cursor.performance"), highlight: true },
      vscode: { value: t("values.vscode.performance"), highlight: false },
      copilot: { value: t("values.copilot.performance"), highlight: false },
      codeium: { value: t("values.codeium.performance"), highlight: false }
    },
    {
      feature: t("features.cost"),
      cursor: { value: t("values.cursor.cost"), highlight: true },
      vscode: { value: t("values.vscode.cost"), highlight: false },
      copilot: { value: t("values.copilot.cost"), highlight: false },
      codeium: { value: t("values.codeium.cost"), highlight: false }
    }
  ];

  const tools = [
    {
      name: "Google AI",
      description: t("tools.cursor.description"),
      logo: "🎯",
      highlight: true,
      price: t("tools.cursor.price"),
      originalPrice: t("tools.cursor.originalPrice")
    },
    {
      name: t("tools.vscode.name"),
      description: t("tools.vscode.description"),
      logo: "📝",
      highlight: false,
      price: t("tools.vscode.price"),
      originalPrice: null
    },
    {
      name: t("tools.copilot.name"),
      description: t("tools.copilot.description"),
      logo: "🤖",
      highlight: false,
      price: t("tools.copilot.price"),
      originalPrice: null
    },
    {
      name: t("tools.codeium.name"),
      description: t("tools.codeium.description"),
      logo: "⚡",
      highlight: false,
      price: t("tools.codeium.price"),
      originalPrice: null
    }
  ];

  return (
    <section className="border-y border-border bg-background py-16 md:py-20">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("description")}
          </p>
        </div>

        {/* Tools Header */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="hidden md:block">
            <div className="h-20 flex items-center">
              <span className="font-semibold text-muted-foreground">{t("features.header")}</span>
            </div>
          </div>
          {tools.map((tool, index) => (
            <Card key={index} className={tool.highlight ? "ring-2 ring-primary bg-primary/5" : ""}>
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-2">{tool.logo}</div>
                <h3 className="font-bold text-sm mb-1">{tool.name}</h3>
                {tool.highlight && (
                  <Badge className="mb-2 text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    {t("recommended")}
                  </Badge>
                )}
                <p className="text-xs text-muted-foreground mb-2">{tool.description}</p>
                <div className="text-sm font-semibold text-primary">
                  {tool.price}
                  {tool.originalPrice && (
                    <span className="block text-xs text-muted-foreground line-through">
                      {tool.originalPrice}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="space-y-2">
          {comparisonData.map((row, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-background p-4 rounded-lg">
                <span className="font-medium">{row.feature}</span>
              </div>
              
              <div className={`p-4 rounded-lg ${row.cursor.highlight ? 'bg-primary/10 border-2 border-primary/20' : 'bg-background'}`}>
                <span className={`font-medium ${row.cursor.highlight ? 'text-primary' : ''}`}>
                  {row.cursor.value}
                </span>
              </div>
              
              <div className="bg-background p-4 rounded-lg">
                <span className="text-muted-foreground">{row.vscode.value}</span>
              </div>
              
              <div className="bg-background p-4 rounded-lg">
                <span className="text-muted-foreground">{row.copilot.value}</span>
              </div>
              
              <div className="bg-background p-4 rounded-lg">
                <span className="text-muted-foreground">{row.codeium.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Check className="h-5 w-5" />
                {t("cards.cursor.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {[0, 1, 2, 3].map((i) => (
                <p key={i}>
                  {t.rich(`cards.cursor.content.${i}`, {
                    bold: (chunks) => <strong className="text-foreground">{chunks}</strong>
                  })}
                </p>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Star className="h-5 w-5" />
                {t("cards.service.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {[0, 1, 2, 3].map((i) => (
                <p key={i}>
                  {t.rich(`cards.service.content.${i}`, {
                    bold: (chunks) => <strong className="text-foreground">{chunks}</strong>
                  })}
                </p>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Check className="h-5 w-5" />
                {t("cards.commitment.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {[0, 1, 2, 3].map((i) => (
                <p key={i}>
                  {t.rich(`cards.commitment.content.${i}`, {
                    bold: (chunks) => <strong className="text-foreground">{chunks}</strong>
                  })}
                </p>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
} 