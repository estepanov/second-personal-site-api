import upstash from "@upstash/redis";
import { ReturnType } from "@upstash/redis/dist/module/types";

type CacheValue = string | number;

type RawKey = string | Array<string | number>;

class Cache {
  static client = upstash();

  public rawKey: RawKey;

  constructor(key: RawKey) {
    this.rawKey = key;
  }

  get key(): string {
    return Cache.keyBuilder(this.rawKey);
  }

  static keyBuilder = (keys: RawKey): string => {
    if (Array.isArray(keys)) return keys.join(":");
    return keys;
  };

  static deserializeValue = <T>(value: CacheValue): T | T[] => {
    if (typeof value === "string") {
      return JSON.parse(value);
    }
    if (Array.isArray(value)) {
      return value.map((val) => Cache.deserializeValue(val)) as T[];
    }
    return (value as unknown) as T;
  };

  static serializeValue = (value: string | number | string[] | number[] | unknown): string | number | string[] | number[] => {
    let serializedValue = value;
    if (typeof value === "object") {
      serializedValue = JSON.stringify(value);
    }
    return serializedValue as string | number;
  };

  errorHandler = (response: ReturnType): void => {
    if (response.error) throw new Error(response.error);
  };

  getRawValue = async (): Promise<ReturnType> => {
    const response = await Cache.client.get(this.key);
    this.errorHandler(response);
    return response;
  };

  get = async <T>(): Promise<T> => {
    const value = await this.getRawValue();
    this.errorHandler(value);
    return Cache.deserializeValue<T>(value.data) as T;
  };

  set = async (value: string | number | never | string[] | number[] | never[]): Promise<ReturnType> => {
    const safeValue = Cache.serializeValue(value);
    const response = await Cache.client.set(this.key, safeValue as string);
    this.errorHandler(response);
    return response;
  };

  expireAt = async (timeStamp: string | number): Promise<ReturnType> => {
    const response = await Cache.client.expireat(this.key, timeStamp);
    this.errorHandler(response);
    return response;
  };

  // broken type in upstash? value is only string?
  setSeconds = async (value: string | number | unknown, seconds: number): Promise<ReturnType> => {
    const safeValue = Cache.serializeValue(value);
    const response = await Cache.client.setex(this.key, seconds, safeValue as string);
    this.errorHandler(response);
    return response;
  };

  increment = async (): Promise<ReturnType> => {
    const response = await Cache.client.incr(this.key);
    this.errorHandler(response);
    return response;
  };

  listGet = async <T>(start?: number | string, stop?: number | string): Promise<T[]> => {
    const result = await Cache.client.lrange(this.key, start, stop);
    this.errorHandler(result);
    return Cache.deserializeValue<T>(result.data) as T[];
  };

  listPush = async (input: string | number | unknown): Promise<ReturnType> => {
    const serializedInput = Cache.serializeValue(input);
    const result = await Cache.client.lpush(this.key, serializedInput);
    this.errorHandler(result);
    return result;
  };

  listTrim = async (start: number, stop: number): Promise<ReturnType> => {
    const result = await Cache.client.ltrim(this.key, start, stop);
    this.errorHandler(result);
    return result;
  };
}

export default Cache;
