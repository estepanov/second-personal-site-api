export enum CacheSections {
  HaloStats = "HaloStats",
  HaloRecentMatches = "HaloRecentMatches",
  HaloStatsTracker = "HaloStatsTracker",
}

export const PERSONAL_OVERALL_HALO_STATS_CACHE_SECONDS = 60 * 60 * 12; // 12 hours = 60 sec * 60 min * 12 hours
export const HALO_STATS_CACHE_SECONDS = 60 * 60 * 1.5; // 1.5 hour = 60 sec * 60 min * 1.5
