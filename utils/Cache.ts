import upstash from '@upstash/redis'
import { ReturnType } from '@upstash/redis/dist/module/types'

type CacheValue = string | number

type RawKey = string | Array<string|number>

class Cache {
  static client = upstash()
  public rawKey: RawKey

  constructor(key: RawKey) {
    this.rawKey = key
  }

  static keyBuilder = (keys: RawKey) => {
    if(Array.isArray(keys)) return keys.join(':')
    return keys
  }

  static deserializeValue = (value: CacheValue) => {
    if (typeof value === 'string') {
      return JSON.parse(value)
    }
    if (Array.isArray(value)) {
      return value.map(Cache.deserializeValue)
    }
    return value
  }

  static serializeValue = (value: any) => {
    let serializedValue = value;
    if(typeof value === 'object') {
      serializedValue = JSON.stringify(value)
    }
    return serializedValue
  }

  errorHandler = (response: ReturnType) => {
    if(response.error) throw new Error(response.error)
  }

  get key() {
    return Cache.keyBuilder(this.rawKey)
  }

  getRawValue = async () => {
    const response = await Cache.client.get(this.key);
    this.errorHandler(response);
    return response
  }

  get = async () => {
    const value = await this.getRawValue()
    this.errorHandler(value);
    return Cache.deserializeValue(value.data);
  }

  set = async (value: any) => {
    const safeValue = Cache.serializeValue(value)
    const response = await Cache.client.set(this.key, safeValue)
    this.errorHandler(response);
    return response
  }

  expireAt = async (timeStamp: string | number) => {
    const response = await Cache.client.expireat(this.key, timeStamp)
    this.errorHandler(response);
    return response;
  }

  // broken type in upstash? value is only string?
  setSeconds = async (value: any, seconds: number) => {
    const safeValue = Cache.serializeValue(value)
    const response = await Cache.client.setex(this.key, seconds, safeValue)
    this.errorHandler(response);
    return response;
  }

  increment = async () => {
    const response = await Cache.client.incr(this.key)
    this.errorHandler(response);
    return response;
  }

  listGet = async (start?: number|string, stop?: number|string) => {
    const result = await Cache.client.lrange(this.key, start, stop)
    this.errorHandler(result);
    return Cache.deserializeValue(result.data)
  }

  listPush = async (input: any) => {
    const serializedInput = Cache.serializeValue(input)
    const result = await Cache.client.lpush(this.key, serializedInput)
    this.errorHandler(result);
    return result
  }

  listTrim = async (start: number, stop: number) => {
    const result = await Cache.client.ltrim(this.key, start, stop)
    this.errorHandler(result);
    return result
  }


}

export default Cache