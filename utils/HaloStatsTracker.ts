import Cache from "./Cache";
import { CacheSections } from "./constants";

export class HaloStatsTracker {
  static STATS_KEYS = {
    recentLookups: 'recentLookups',
    lookupsToday: 'lookupsToday',
    lookupsMonth: 'lookupsMonth',
  }
  constructor() {
  }

  generateLookUpItem = (gamerTag: string) => {
    return ({
      gamerTag,
      date: new Date()
    })
  }

  addLookup = async (gamerTag: string) => {
    try {
      const cache = new Cache(this.recentLookupsKey)
      await cache.listPush(this.generateLookUpItem(gamerTag))
      await Promise.all([
        cache.listTrim(0,19),
        this.incrementToday(),
        this.incrementMonth()
      ]);
    } catch (error) {
      console.error('[HaloStatsTracker][addLookup]', error)
    }
  }

  fetchLookUpStats = async () => {
    try {
      const cacheLookups = new Cache(this.recentLookupsKey)
      const cacheTodaysCount = new Cache(this.todaysKey)
      const cacheMonthCount = new Cache(this.monthKey)
      const [
        recentLookups, 
        todaysCount, 
        monthCount
      ] = await Promise.all([
        cacheLookups.listGet("0", "19"), 
        cacheTodaysCount.get(), 
        cacheMonthCount.get()
      ])
      return {
        recentLookups: recentLookups || [],
        todaysCount: todaysCount || 0,
        monthCount: monthCount || 0
      }
    } catch (error) {
      console.error('[HaloStatsTracker][fetchLookUpStats]', error)
    } 
  }

  get recentLookupsKey () {
    return [
      CacheSections.HaloStatsTracker,
      HaloStatsTracker.STATS_KEYS.recentLookups, 
    ]
  }

  get todaysKey() {
    const now = new Date()
    return [
      CacheSections.HaloStatsTracker,
      HaloStatsTracker.STATS_KEYS.lookupsToday,
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ]
  }

  get monthKey() {
    const now = new Date()
    return [
      CacheSections.HaloStatsTracker,
      HaloStatsTracker.STATS_KEYS.lookupsToday,
      now.getFullYear(),
      now.getMonth()
    ]
  }

  get tomorrowsDate() {
    const currentDate = new Date();
    return currentDate.setDate(currentDate.getDate() + 1);
  }

  get nextMonthDate() {
    const currentDate = new Date();
    return new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 1);
  }

  incrementToday = async () => {
    try {
      const cache = new Cache(this.todaysKey)
      await cache.increment() // if it doesnt exist cant set exp
      await Promise.all([
        cache.expireAt(this.tomorrowsDate.valueOf())
      ])
    } catch (error) {
      console.error('[HaloStatsTracker][incrementToday]', error)
    }
  }

  incrementMonth = async () => {
    try {
      const cache = new Cache(this.monthKey)
      await cache.increment() // if it doesnt exist cant set exp
    
      await Promise.all([
        cache.expireAt(this.nextMonthDate.valueOf())
      ])
    } catch (error) {
      console.error('[HaloStatsTracker][incrementMonth]', error)
    }
  }
}