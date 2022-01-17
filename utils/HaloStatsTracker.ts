import Cache from "./Cache";
import { CacheSections } from "./constants";

export class HaloStatsTracker {
  static STATS_KEYS = {
    recentLookups: 'recentLookups',
    lookupsToday: 'lookupsToday',
    lookupsWeek: 'lookupsWeek',
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
        this.incrementMonth(),
        this.incrementWeek(),
      ]);
    } catch (error) {
      console.error('[HaloStatsTracker][addLookup]', error)
    }
  }

  fetchLookUpStats = async () => {
    try {
      const cacheLookups = new Cache(this.recentLookupsKey)
      const cacheTodaysCount = new Cache(this.todaysKey)
      const cacheYesterdaysCount = new Cache(this.yesterdaysKey)
      const cacheWeekCount = new Cache(this.thisWeekKey)
      const cacheLastWeekCount = new Cache(this.lastWeekKey)
      const cacheMonthCount = new Cache(this.monthKey)
      const cacheLastMonthCount = new Cache(this.lastMonthKey)
      const [
        recentLookups, 
        todaysCount,
        yesterdayCount, 
        weekCount,
        lastWeekCount,
        monthCount,
        lastMonthCount
      ] = await Promise.all([
        cacheLookups.listGet("0", "19"), 
        cacheTodaysCount.get(), 
        cacheYesterdaysCount.get(),
        cacheWeekCount.get(),
        cacheLastWeekCount.get(),
        cacheMonthCount.get(),
        cacheLastMonthCount.get()
      ])
      return {
        recentLookups: recentLookups || [],
        todaysCount: todaysCount || 0,
        yesterdayCount: yesterdayCount || 0,
        weekCount: weekCount || 0,
        lastWeekCount:lastWeekCount ||0,
        monthCount: monthCount || 0,
        lastMonthCount: lastMonthCount || 0,
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

  get yesterdaysKey() {
    const now = this.yesterdaysDate
    return [
      CacheSections.HaloStatsTracker,
      HaloStatsTracker.STATS_KEYS.lookupsToday,
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ]
  }

  get lastMonthKey() {
    const now = this.lastMonthDate
    return [
      CacheSections.HaloStatsTracker,
      HaloStatsTracker.STATS_KEYS.lookupsToday,
      now.getFullYear(),
      now.getMonth()
    ]
  }

  get thisWeekKey() {
    const now = new Date()
    const weekNumber = getWeek(now, 1);
    return [
      CacheSections.HaloStatsTracker,
      HaloStatsTracker.STATS_KEYS.lookupsWeek,
      weekNumber
    ]
  }

  get lastWeekKey() {
    const now = new Date()
    const weekNumber = getWeek(now, 1);
    const safeWeek = weekNumber === 0 ? 52 : weekNumber -1
    return [
      CacheSections.HaloStatsTracker,
      HaloStatsTracker.STATS_KEYS.lookupsWeek,
      safeWeek
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

  get yesterdaysDate() {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date
  }

  get tomorrowsDate() {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1);
    return currentDate
  }

  get lastMonthDate() {
    const currentDate = new Date();
    return new Date(currentDate.getFullYear(), currentDate.getMonth()-1, 1);
  }

  get nextMonthDate() {
    const currentDate = new Date();
    return new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 1);
  }

  get twoMonthDate() {
    const currentDate = new Date();
    return new Date(currentDate.getFullYear(), currentDate.getMonth()+2, 1);
  }

  incrementToday = async () => {
    try {
      const cache = new Cache(this.todaysKey)
      await cache.increment() // if it doesnt exist cant set exp
      await Promise.all([
        cache.expireAt(this.nextMonthDate.valueOf())
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
        cache.expireAt(this.twoMonthDate.valueOf())
      ])
    } catch (error) {
      console.error('[HaloStatsTracker][incrementMonth]', error)
    }
  }

  incrementWeek = async () => {
    try {
      const cache = new Cache(this.thisWeekKey)
      await cache.increment() // if it doesnt exist cant set exp
      await Promise.all([
        cache.expireAt(this.twoMonthDate.valueOf())
      ])
    } catch (error) {
      console.error('[HaloStatsTracker][incrementToday]', error)
    }
  }
}

/**
* Returns the week number for this date.  dowOffset is the day of week the week
* "starts" on for your locale - it can be from 0 to 6. If dowOffset is 1 (Monday),
* the week returned is the ISO 8601 week number.
* @param int dowOffset
* @return int
*/
const getWeek =  (date, dowOffset) => {
  dowOffset = typeof(dowOffset) == 'number' ? dowOffset : 0; //default dowOffset to zero
   let newYear = new Date(date.getFullYear(),0,1);
   let day = newYear.getDay() - dowOffset; //the day of week the year begins on
   day = (day >= 0 ? day : day + 7);
   let daynum = Math.floor((date.getTime() - newYear.getTime() - 
   (date.getTimezoneOffset()-newYear.getTimezoneOffset())*60000)/86400000) + 1;
   let weeknum;
   //if the year starts before the middle of a week
   if(day < 4) {
       weeknum = Math.floor((daynum+day-1)/7) + 1;
       if(weeknum > 52) {
           let nYear = new Date(date.getFullYear() + 1,0,1);
           let nday = nYear.getDay() - dowOffset;
           nday = nday >= 0 ? nday : nday + 7;
           /*if the next year starts before the middle of
             the week, it is week #1 of that year*/
           weeknum = nday < 4 ? 1 : 53;
       }
   } else {
       weeknum = Math.floor((daynum+day-1)/7);
   }
   return weeknum;
};