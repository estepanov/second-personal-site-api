import * as rawLib from "lib";

const lib = rawLib({ token: process.env.STDLIB_SECRET_TOKEN });

export enum Experience {
  PVP = "pvp-only",
  BOTS = "pve-bots",
  CUSTOM = "custom",
  FEATURED = "featured",
  ARENA = "arena",
  BTB = "btb",
  ALL = "all",
}

export enum MatchMode {
  CUSTOM = "custom",
  MATCHMADE = "matchmade",
}

export enum StatsApiErrors {
  PlayerNotFound = "Player not found (halo/infinite@0.3.6/stats/service-record/multiplayer)",
}

export class HaloStats {
  api = lib.halo.infinite["@1.4.0"];

  gamerTag: string | null = null;

  constructor(gamertag: string) {
    this.gamerTag = gamertag;
  }

  async fetchMultiplayerOverview(type = Experience.ALL): Promise<unknown> {
    try {
      const response = await this.api.stats.players["service-record"].multiplayer.matchmade.all({
        gamertag: this.gamerTag,
        experience: type,
      });
      return {
        ...response.data,
        fetchedOn: new Date(),
        type,
      };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("error fetching HaloStats for", this.gamerTag, "in", type);
      // eslint-disable-next-line no-console
      console.error(err);
      if (err.message === StatsApiErrors.PlayerNotFound) throw new Error(`No player found with tag: ${this.gamerTag}`);
      throw new Error("Sorry something went wrong!");
    }
  }

  async fetchGames(mode: MatchMode, count: number, offset: number): Promise<unknown> {
    try {
      const response = await this.api.stats.players.matches({
        gamertag: this.gamerTag,
        limit: {
          count,
          offset,
        },
        mode,
      });
      return {
        games: response.data,
        fetchedOn: new Date(),
        mode,
      };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("error fetching games for", this.gamerTag, "in", mode, "count", count, "offset", offset);
      // eslint-disable-next-line no-console
      console.error(err);
      if (err.message === StatsApiErrors.PlayerNotFound) throw new Error(`No player found with tag: ${this.gamerTag}`);
      throw new Error("Sorry something went wrong!");
    }
  }
}
