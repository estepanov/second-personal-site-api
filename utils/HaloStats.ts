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

export class HaloStats {
  api = lib.halo.infinite['@0.2.3'];
  gamerTag: string | null = null

  constructor(gamertag: string) {
    this.gamerTag = gamertag
  }

  async fetchOverview(type = Experience.ALL) {
    const response = await this.api.stats['service-record']({
      gamertag: this.gamerTag,
      experience: type
    });
    return response.data;
  }
}