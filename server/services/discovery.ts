// server/services/discovery.ts
import { getTrendingTopics, TrendData } from "../adapters/trends";
import * as db from "../db";
import { addAutomationLog } from "../db";

/**
 * Trend scoring heuristic.
 */
const scoreTrend = (trend: TrendData): number => {
  let score = 50;

  if (trend.metrics.velocity === "high") score += 30;
  if (trend.metrics.velocity === "medium") score += 15;

  if (trend.metrics.competition === "high") score -= 10;
  if (trend.metrics.competition === "low") score += 10;

  if (trend.metrics.searchVolume && trend.metrics.searchVolume > 100000) {
    score += 5;
  }

  return Math.max(0, Math.min(100, score));
};

/**
 * Generates a safe unique ID.
 */
const uid = () =>
  `disc_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

/**
 * Content discovery job.
 */
export const runDiscovery = async (
  niche: string,
  platforms: string[],
  geo: string
) => {
  try {
    addAutomationLog(
      `Starting discovery for niche: "${niche}" in geo: ${geo}`
    );

    const topics = await getTrendingTopics(niche, platforms, geo);

    const discoveriesTable = db.getTable("discoveries") || [];
    const existingUrls = new Set(discoveriesTable.map((d) => d.url));

    const newDiscoveries: any[] = [];

    for (const topic of topics) {
      if (!topic?.url || existingUrls.has(topic.url)) {
        continue;
      }

      const calculatedScore = scoreTrend(topic);

      const newDiscovery = {
        id: uid(),
        topic: topic.topic,
        url: topic.url,
        score: calculatedScore,
        payload: topic,
        status: "new",
        fetched_at: new Date().toISOString(),
      };

      db.addItem("discoveries", newDiscovery);
      newDiscoveries.push(newDiscovery);
    }

    if (newDiscoveries.length > 0) {
      addAutomationLog(
        `Discovery complete. Added ${newDiscoveries.length} new topics.`,
        "success"
      );
    } else {
      addAutomationLog(`Discovery complete. No new topics found.`, "info");
    }

    return newDiscoveries;
  } catch (err: any) {
    addAutomationLog(
      `Discovery failed: ${err.message || err}`,
      "error"
    );
    throw err;
  }
};
