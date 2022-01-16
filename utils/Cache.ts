import upstash from '@upstash/redis'

type CacheValue = string | number

class Cache {
  static client = upstash()
  public rawKey: string | string[]

  constructor(key: string | string[]) {
    this.rawKey = key
  }

  static keyBuilder = (keys: string[] | string) => {
    if(Array.isArray(keys)) return keys.join(':')
    return keys
  }

  static deserializeValue = (value: CacheValue) => {
    if (typeof value === 'string') {
      return JSON.parse(value)
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

  get key() {
    return Cache.keyBuilder(this.rawKey)
  }

  get = async () => {
    const value = await Cache.client.get(this.key);
    return Cache.deserializeValue(value.data);
  }

  set = (value: any) => {
    const safeValue = Cache.serializeValue(value)
    return Cache.client.set(this.key, safeValue)
  }

  // broken type in upstash? value is only string?
  setSeconds = (value: any, seconds: number) => {
    const safeValue = Cache.serializeValue(value)
    return Cache.client.setex(this.key, seconds, safeValue)
  }

}

export default Cache