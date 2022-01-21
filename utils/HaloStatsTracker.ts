import getWeek from "@utils/getWeek";
import Cache from "./Cache";
import { CacheSections } from "./constants";

interface RecentLookups {
  gamerTag: string;
  date: string;
}

interface LookupStatsOverview {
  recentLookups: RecentLookups[];
  todayCount: number;
  yesterdayCount: number;
  weekCount: number;
  lastWeekCount: number;
  monthCount: number;
  lastMonthCount: number;
}

export class HaloStatsTracker {
  static STATS_KEYS = {
    recentLookups: "recentLookups",
    lookupsToday: "lookupsToday",
    lookupsWeek: "lookupsWeek",
    lookupsMonth: "lookupsMonth",
  };

  static get monthKey(): Array<string | number> {
    const now = new Date();
    return [CacheSections.HaloStatsTracker, HaloStatsTracker.STATS_KEYS.lookupsToday, now.getFullYear(), now.getMonth()];
  }

  static get recentLookupsKey(): Array<string | number> {
    return [CacheSections.HaloStatsTracker, HaloStatsTracker.STATS_KEYS.recentLookups];
  }

  static get todayKey(): Array<string | number> {
    const now = new Date();
    return [CacheSections.HaloStatsTracker, HaloStatsTracker.STATS_KEYS.lookupsToday, now.getFullYear(), now.getMonth(), now.getDate()];
  }

  static get yesterdaysKey(): Array<string | number> {
    const now = HaloStatsTracker.yesterdaysDate;
    return [CacheSections.HaloStatsTracker, HaloStatsTracker.STATS_KEYS.lookupsToday, now.getFullYear(), now.getMonth(), now.getDate()];
  }

  static get lastMonthKey(): Array<string | number> {
    const now = HaloStatsTracker.lastMonthDate;
    return [CacheSections.HaloStatsTracker, HaloStatsTracker.STATS_KEYS.lookupsToday, now.getFullYear(), now.getMonth()];
  }

  static get thisWeekKey(): Array<string | number> {
    const now = new Date();
    const weekNumber = getWeek(now, 1);
    return [CacheSections.HaloStatsTracker, HaloStatsTracker.STATS_KEYS.lookupsWeek, weekNumber];
  }

  static get lastWeekKey(): Array<string | number> {
    const now = new Date();
    const weekNumber = getWeek(now, 1);
    const safeWeek = weekNumber === 0 ? 52 : weekNumber - 1;
    return [CacheSections.HaloStatsTracker, HaloStatsTracker.STATS_KEYS.lookupsWeek, safeWeek];
  }

  static get lastMonthDate(): Date {
    const currentDate = new Date();
    return new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  }

  static get nextMonthDate(): Date {
    const currentDate = new Date();
    return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  }

  static get twoMonthDate(): Date {
    const currentDate = new Date();
    return new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 1);
  }

  static get yesterdaysDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date;
  }

  static get tomorrowsDate(): Date {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1);
    return currentDate;
  }

  generateLookUpItem = (gamerTag: string): RecentLookups => {
    return {
      gamerTag,
      date: new Date().toString(),
    };
  };

  addLookup = async (gamerTag: string): Promise<void> => {
    try {
      const cache = new Cache(HaloStatsTracker.recentLookupsKey);
      await cache.listPush(this.generateLookUpItem(gamerTag));
      await Promise.all([cache.listTrim(0, 19), this.incrementToday(), this.incrementMonth(), this.incrementWeek()]);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[HaloStatsTracker][addLookup]", error);
    }
  };

  fetchLookUpStats = async (): Promise<LookupStatsOverview | null> => {
    try {
      const cacheLookups = new Cache(HaloStatsTracker.recentLookupsKey);
      const cacheTodayCount = new Cache(HaloStatsTracker.todayKey);
      const cacheYesterdaysCount = new Cache(HaloStatsTracker.yesterdaysKey);
      const cacheWeekCount = new Cache(HaloStatsTracker.thisWeekKey);
      const cacheLastWeekCount = new Cache(HaloStatsTracker.lastWeekKey);
      const cacheMonthCount = new Cache(HaloStatsTracker.monthKey);
      const cacheLastMonthCount = new Cache(HaloStatsTracker.lastMonthKey);
      const [recentLookups, todayCount, yesterdayCount, weekCount, lastWeekCount, monthCount, lastMonthCount] = await Promise.all([
        cacheLookups.listGet<RecentLookups>("0", "19"),
        cacheTodayCount.get<number>(),
        cacheYesterdaysCount.get<number>(),
        cacheWeekCount.get<number>(),
        cacheLastWeekCount.get<number>(),
        cacheMonthCount.get<number>(),
        cacheLastMonthCount.get<number>(),
      ]);
      return {
        recentLookups: recentLookups || [],
        todayCount: todayCount || 0,
        yesterdayCount: yesterdayCount || 0,
        weekCount: weekCount || 0,
        lastWeekCount: lastWeekCount || 0,
        monthCount: monthCount || 0,
        lastMonthCount: lastMonthCount || 0,
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[HaloStatsTracker][fetchLookUpStats]", error);
    }
    return null;
  };

  incrementToday = async (): Promise<void> => {
    try {
      const cache = new Cache(HaloStatsTracker.todayKey);
      await cache.increment(); // if it doesnt exist cant set exp
      await Promise.all([cache.expireAt(HaloStatsTracker.nextMonthDate.valueOf())]);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[HaloStatsTracker][incrementToday]", error);
    }
  };

  incrementMonth = async (): Promise<void> => {
    try {
      const cache = new Cache(HaloStatsTracker.monthKey);
      await cache.increment(); // if it doesnt exist cant set exp

      await Promise.all([cache.expireAt(HaloStatsTracker.twoMonthDate.valueOf())]);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[HaloStatsTracker][incrementMonth]", error);
    }
  };

  incrementWeek = async (): Promise<void> => {
    try {
      const cache = new Cache(HaloStatsTracker.thisWeekKey);
      await cache.increment(); // if it doesnt exist cant set exp
      await Promise.all([cache.expireAt(HaloStatsTracker.twoMonthDate.valueOf())]);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[HaloStatsTracker][incrementToday]", error);
    }
  };
}
