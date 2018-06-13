import { Injectable } from '@angular/core';

import { RxCacheItem } from './models/rxcache-item';
import { RxCacheItemConfig } from './models/rxcache-item-config';
import { globalConfig } from './models/rxcache-global-config';

@Injectable()
export class RxCacheService {
  private cacheItems: RxCacheItem<any>[] = [];

  config<T>(config: RxCacheItemConfig<T>) {
    let cacheItem = this.cacheItems.find(i => i.id === config.id);
    if (!cacheItem) {
      cacheItem = new RxCacheItem<T>(config);
      this.cacheItems = [ ...this.cacheItems, cacheItem ];
    } else {
      cacheItem.configure(config);
    }
    return cacheItem;
  }

  get<T>(id: string): RxCacheItem<T> {
    let cacheItem = this.cacheItems.find(i => i.id === id);
    if (!cacheItem) {
      cacheItem = new RxCacheItem<T>({ id });
      this.cacheItems = [ ...this.cacheItems, cacheItem ];
    }
    return cacheItem;
  }

  exists(id: string): boolean {
    return !!this.cacheItems.find(i => i.id === id);
  }

  delete<T>(id: string) {
    let cacheItem = this.cacheItems.find(i => i.id === id);
    if (localStorage.getItem(id)) {
      localStorage.removeItem(id);
    }
    if (cacheItem) {
      cacheItem.finish();
      this.cacheItems = this.cacheItems.filter(item => item.id !== id);
    }
  }

  genericError(genericError: string) {
    globalConfig.genericError = genericError;
  }

  errorHandler(errorHandler: (id: string, error?: any) => string) {
    globalConfig.errorHandler = errorHandler;
  }
}
