"use client";

import { useState } from "react";
import { SEO_CONFIG, SITE_HOST } from "~/app";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/ui/primitives/card";
import { Textarea } from "~/ui/primitives/textarea";

const BASE_URL = SEO_CONFIG.url.replace(/\/$/, "");
const INDEXNOW_KEY = process.env.NEXT_PUBLIC_INDEXNOW_KEY || "";

const DEFAULT_PATHS = [
  "/vi",
  "/en",
  "/vi/products",
  "/en/products",
  "/vi/help",
  "/vi/blog",
  "/vi/about",
  "/vi/contact",
  "/vi/khach-hang-da-mua",
  "/vi/warranty",
  "/vi/shipping",
  "/vi/terms",
  "/vi/privacy",
];

const DEFAULT_URLS = DEFAULT_PATHS.map((path) => `${BASE_URL}${path}`).join("\n");

export default function IndexNowAdminPage() {
  const [urls, setUrls] = useState(DEFAULT_URLS);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);

    try {
      const urlList = urls
        .split("\n")
        .map((u) => u.trim())
        .filter((u) => u.length > 0);

      const response = await fetch("/api/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: urlList }),
      });

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitToBing = async () => {
    setLoading(true);
    setResult(null);

    if (!INDEXNOW_KEY) {
      setResult("❌ Chưa cấu hình NEXT_PUBLIC_INDEXNOW_KEY.");
      setLoading(false);
      return;
    }

    try {
      const urlList = urls
        .split("\n")
        .map((u) => u.trim())
        .filter((u) => u.length > 0);

      // submit directly to Bing IndexNow
      const response = await fetch("https://www.bing.com/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: SITE_HOST,
          key: INDEXNOW_KEY,
          keyLocation: `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`,
          urlList: urlList,
        }),
      });

      if (response.ok || response.status === 202) {
        setResult(`✅ Success! Submitted ${urlList.length} URLs to Bing IndexNow.\nStatus: ${response.status}`);
      } else {
        const text = await response.text();
        setResult(`❌ Error: ${response.status}\n${text}`);
      }
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>🚀 IndexNow - Submit URLs</CardTitle>
          <CardDescription>
            Gửi URLs tới Bing, Yandex và các search engine khác để index nhanh hơn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              URLs (mỗi dòng 1 URL):
            </label>
            <Textarea
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              rows={15}
              className="font-mono text-sm"
              placeholder={`${BASE_URL}/vi`}
            />
          </div>

          <div className="flex gap-4">
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Đang gửi..." : "📤 Gửi qua API Server"}
            </Button>
            <Button onClick={handleSubmitToBing} disabled={loading} variant="outline">
              {loading ? "Đang gửi..." : "🔷 Gửi trực tiếp Bing"}
            </Button>
          </div>

          {result && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Kết quả:</h4>
              <pre className="whitespace-pre-wrap text-sm">{result}</pre>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">📋 Hướng dẫn:</h4>
            <ol className="list-decimal list-inside text-sm space-y-1 text-blue-600 dark:text-blue-400">
              <li>Nhập các URLs bạn muốn index (mỗi dòng 1 URL)</li>
              <li>Click "Gửi qua API Server" hoặc "Gửi trực tiếp Bing"</li>
              <li>Đợi kết quả - Status 200 hoặc 202 là thành công</li>
              <li>Bing sẽ crawl các URLs trong vài phút đến vài giờ</li>
            </ol>
            {INDEXNOW_KEY ? (
              <p className="mt-2 text-xs text-blue-600 dark:text-blue-400 break-all">
                Key location: {`https://${SITE_HOST}/${INDEXNOW_KEY}.txt`}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
