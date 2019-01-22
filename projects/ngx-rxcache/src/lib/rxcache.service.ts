import { Injectable } from '@angular/core';

import { RxCacheItem } from './models/rxcache-item';
import { RxCacheItemConfig } from './models/rxcache-item-config';
import { globalConfig } from './models/rxcache-global-config';

@Injectable({
  providedIn: 'root'
})
export class RxCacheService {
  private cacheItems: { [id: string]: RxCacheItem<any> } = {};

  get<T>(id: string): RxCacheItem<T>;
  get<T>(config: RxCacheItemConfig<T>): RxCacheItem<T>;
  get<T>(idOrConfig: string | RxCacheItemConfig<T>): RxCacheItem<T> {
    const paramIsString = typeof idOrConfig === 'string';
    const config: RxCacheItemConfig<T> = paramIsString
      ? { id: idOrConfig as string }
      : (idOrConfig as RxCacheItemConfig<T>);
    let cacheItem = this.cacheItems[config.id];
    if (!cacheItem) {
      cacheItem = new RxCacheItem<T>(config);
      this.cacheItems[config.id] = cacheItem;
    } else if (!paramIsString) {
      cacheItem.configure(config);
    }
    return cacheItem;
  }

  exists(id: string): boolean {
    return id in this.cacheItems;
  }

  delete<T>(id: string) {
    let cacheItem = this.cacheItems[id];
    if (localStorage.getItem(id)) {
      localStorage.removeItem(id);
    }
    if (sessionStorage.getItem(id)) {
      sessionStorage.removeItem(id);
    }
    if (cacheItem) {
      cacheItem.finish();
      delete this.cacheItems[id];
    }
  }

  clear() {
    for (let id in this.cacheItems) {
      this.cacheItems[id].finish();
    }
    this.cacheItems = {};
  }

  genericError(genericError: string) {
    globalConfig.genericError = genericError;
  }

  errorHandler(errorHandler: (id: string, error: any, value?: any) => string | void) {
    globalConfig.errorHandler = errorHandler;
  }
}
