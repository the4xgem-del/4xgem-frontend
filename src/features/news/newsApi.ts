import { apiClient } from "@/lib/apiClient";

export interface ApiNewsArticle {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
  source: string;
  url: string;
  publishedAt: string;
}



function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const hrs = Math.round(ms / 3_600_000);
  if (hrs < 1) return "Just now";
  if (hrs === 1) return "1 hour ago";
  if (hrs < 24) return `${hrs} hours ago`;
  const days = Math.round(hrs / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

export const newsApi = {
  async list(params: { category?: string; impact?: string } = {}): Promise<ApiNewsArticle[]> {
    const { data } = await apiClient.get<{ data: ApiNewsArticle[] }>("/news", { params });
    return data.data;
  },
};

export function toUiNewsItem(n: ApiNewsArticle) {
  const text = `${n.title} ${n.summary}`.toLowerCase();

  let category = "Forex";

  if (
    text.includes("gold") ||
    text.includes("xau")
  ) {
    category = "Gold";
  } else if (
    text.includes("bitcoin") ||
    text.includes("btc") ||
    text.includes("crypto") ||
    text.includes("ethereum") ||
    text.includes("eth")
  ) {
    category = "Crypto";
  } else if (
    text.includes("nasdaq") ||
    text.includes("dow") ||
    text.includes("s&p") ||
    text.includes("index")
  ) {
    category = "Indices";
  }

  return {
    id: n.id,
    title: n.title,
    summary: n.summary,
    image: n.imageUrl,
    source: n.source,
    url: n.url,
    time: relativeTime(n.publishedAt),

    category,
    tag: "Live",
    emoji: "📰",
  };
}
