const lib = require('lib')({token: process.env.STDLIB_SECRET_TOKEN});

export enum Experience {
  PVP = 'pvp-only',
  BOTS = 'pve-bots',
  CUSTOM = 'custom',
  FEATURED = 'featured',
  ARENA = 'arena',
  BTB = 'btb',
  ALL = 'all'
}

export enum StatsApiErrors {
  InvalidGamerTag = "Could not match player's identifier (halo/infinite@0.2.3/stats/service-record)"
}

export class HaloStats {
  api = lib.halo.infinite['@0.2.3'];
  gamerTag: string | null = null

  constructor(gamertag: string) {
    this.gamerTag = gamertag
  }

  async fetchOverview(type = Experience.ALL) {
    try  {
      const response = await this.api.stats['service-record']({
        gamertag: this.gamerTag,
        experience: type
      });
      return {
        ...response.data,
        fetchedOn: new Date(),
        type
      };
    } catch(err) {
      console.error('error fetching HaloStats for', this.gamerTag, 'in', type)
      console.error(err)
      if (err.message === StatsApiErrors.InvalidGamerTag) throw new Error(`Invalid tag: ${this.gamerTag}`)
      throw new Error('Sorry something went wrong!')
    }
    
  }
}