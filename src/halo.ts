import { APIGatewayEvent, APIGatewayProxyHandler } from 'aws-lambda';
import 'source-map-support/register';
import { Experience, HaloStats, MatchMode } from '@utils/HaloStats';
import { MessageUtil } from '@utils/message';
import Cache from '@utils/Cache';
import { CacheSections, HALO_STATS_CACHE_SECONDS, PERSONAL_OVERALL_HALO_STATS_CACHE_SECONDS } from '@utils/constants';
import { StatusCode } from '@utils/result';
import { HaloStatsTracker } from '@utils/HaloStatsTracker';

export const statsOverview: APIGatewayProxyHandler = async (): Promise<any> => {
  try {
    const key = [process.env.GAMER_TAG, Experience.ALL, CacheSections.HaloStats]
    const cache = new Cache(key)
    const cachedResults = await cache.get();
    if (cachedResults) return MessageUtil.success(cachedResults);
  
    const service = new HaloStats(process.env.GAMER_TAG);
    const stats = await service.fetchMultiplayerOverview(Experience.ALL);
    if(stats) {
      await cache.setSeconds(stats, PERSONAL_OVERALL_HALO_STATS_CACHE_SECONDS)
    }
  
    return MessageUtil.success(stats)
  } catch(err) {
    return MessageUtil.error(StatusCode.internalServerError, err.message)
  }
};

export const recentMatches: APIGatewayProxyHandler = async (): Promise<any> => {
  try {
    const key = [process.env.GAMER_TAG, MatchMode.MATCHMADE, CacheSections.HaloRecentMatches]
    const cache = new Cache(key)
    const cachedResults = await cache.get();
    if (cachedResults) return MessageUtil.success(cachedResults);
  
    const service = new HaloStats(process.env.GAMER_TAG);
    const stats = await service.fetchGames(MatchMode.MATCHMADE, 15, 0);
    if(stats) {
      await cache.setSeconds(stats, HALO_STATS_CACHE_SECONDS)
    }
  
    return MessageUtil.success(stats)
  } catch(err) {
    return MessageUtil.error(StatusCode.internalServerError, err.message)
  }
};

export const pvpOverview: APIGatewayProxyHandler = async (): Promise<any> => {
  try {
    const key = [process.env.GAMER_TAG, Experience.PVP, CacheSections.HaloStats]
    const cache = new Cache(key)
    const cachedResults = await cache.get();
    if (cachedResults) return MessageUtil.success(cachedResults);
  
    const service = new HaloStats(process.env.GAMER_TAG);
    const stats = await service.fetchMultiplayerOverview(Experience.PVP);
  
    await cache.setSeconds(stats, HALO_STATS_CACHE_SECONDS)
  
    return MessageUtil.success(stats)
  } catch(err) {
    return MessageUtil.error(StatusCode.internalServerError, err.message)
  }
};

export const comparePvpOverview: APIGatewayProxyHandler = async (event:APIGatewayEvent): Promise<any> => {
  try {
    const tag =  event.queryStringParameters?.tag?.trim().toLocaleLowerCase()
    if(!tag || !tag.length) {
      return MessageUtil.error(StatusCode.notAcceptable, `A gamer tag is required.`)
    }
    if(tag.length < 3) {
      return MessageUtil.error(StatusCode.notAcceptable, `Gamer tag (${tag}) is too short.`)
    }
    if(tag.length > 20) {
      return MessageUtil.error(StatusCode.notAcceptable, `Gamer tag (${tag}) is too long.`)
    }
    if(tag === process.env.GAMER_TAG) {
      return MessageUtil.error(StatusCode.notAcceptable, `Sneaky, sneaky... I am the best`)
    }

    const meKey = [process.env.GAMER_TAG, Experience.PVP, CacheSections.HaloStats]
    const meCache = new Cache(meKey)
    let meCachedResults = await meCache.get();
    let meStats = {}
    if(!meCachedResults) {
      const meService = new HaloStats(process.env.GAMER_TAG);
      meStats = await meService.fetchMultiplayerOverview(Experience.PVP);
      if(meStats) {
        await meCache.setSeconds(meStats, HALO_STATS_CACHE_SECONDS)
      }
    }

    let tagCachedResults
    let tagStats = {}
      const tracker = new HaloStatsTracker()
      const tagKey = [tag, Experience.PVP,  CacheSections.HaloStats]
      const tagCache = new Cache(tagKey)
      tagCachedResults = await tagCache.get();

      if (tagCachedResults) {
        // sucessfull look up
        await tracker.addLookup(tag)
      }
        
      if(!tagCachedResults) {
        const tagService = new HaloStats(tag);
        tagStats = await tagService.fetchMultiplayerOverview(Experience.PVP);
        if(tagStats) {
          // sucessfull look up
          await tracker.addLookup(tag)
          await tagCache.setSeconds(tagStats, HALO_STATS_CACHE_SECONDS)
        }
      }

  
    return MessageUtil.success({
      me: meCachedResults || meStats,
      tag: {
        name: tag,
        data: tagCachedResults || tagStats
      }
    })
  } catch(err) {
    return MessageUtil.error(StatusCode.internalServerError, err.message)
  }
};
