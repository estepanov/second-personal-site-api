import { APIGatewayEvent, APIGatewayProxyHandler } from 'aws-lambda';
import 'source-map-support/register';
import { Experience, HaloStats } from '@utils/HaloStats';
import { MessageUtil } from '@utils/message';
import Cache from '@utils/Cache';
import { CacheSections, PERSONAL_HALO_STATS_CACHE_SECONDS } from '@utils/constants';
import { StatusCode } from '@utils/result';
import { HaloStatsTracker } from '@utils/HaloStatsTracker';

export const statsOverview: APIGatewayProxyHandler = async (): Promise<any> => {
  try {
    const key = [process.env.GAMER_TAG, Experience.ALL, CacheSections.HaloStats]
    const cache = new Cache(key)
    const cachedResults = await cache.get();
    if (cachedResults) return MessageUtil.success(cachedResults);
  
    const service = new HaloStats(process.env.GAMER_TAG);
    const stats = await service.fetchOverview(Experience.ALL);
    if(stats) {
      await cache.setSeconds(stats, PERSONAL_HALO_STATS_CACHE_SECONDS)
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
    const stats = await service.fetchOverview(Experience.PVP);
  
    await cache.setSeconds(stats, PERSONAL_HALO_STATS_CACHE_SECONDS)
  
    return MessageUtil.success(stats)
  } catch(err) {
    return MessageUtil.error(StatusCode.internalServerError, err.message)
  }
};

export const comparePvpOverview: APIGatewayProxyHandler = async (event:APIGatewayEvent): Promise<any> => {
  try {
    const meKey = [process.env.GAMER_TAG, Experience.PVP, CacheSections.HaloStats]
    const meCache = new Cache(meKey)
    let meCachedResults = await meCache.get();
    let meStats = {}
    if(!meCachedResults) {
      const meService = new HaloStats(process.env.GAMER_TAG);
      meStats = await meService.fetchOverview(Experience.PVP);
      if(meStats) {
        await meCache.setSeconds(meStats, PERSONAL_HALO_STATS_CACHE_SECONDS)
      }
    }
  
    const tag =  event.queryStringParameters?.tag?.trim()
    let tagCachedResults
    let tagStats = {}
    if(tag) {
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
        tagStats = await tagService.fetchOverview(Experience.PVP);
        if(tagStats) {
          // sucessfull look up
          await tracker.addLookup(tag)
          await tagCache.setSeconds(tagStats, PERSONAL_HALO_STATS_CACHE_SECONDS)
        }
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
