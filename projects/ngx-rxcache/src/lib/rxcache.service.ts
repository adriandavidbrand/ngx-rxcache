import { Injectable } from '@angular/core';

import { RxCacheItem } from './models/rxcache-item';
import { RxCacheItemConfig } from './models/rxcache-item-config';
import { globalConfig } from './models/rxcache-global-config';

@Injectable()
export class RxCacheService {
  private cacheItems: RxCacheItem<any>[] = [];

  get<T>(idOrConfig: string | RxCacheItemConfig<T>): RxCacheItem<T> {
    const paramIsString = typeof idOrConfig === "string";
    const config: RxCacheItemConfig<T> = paramIsString ? { id: idOrConfig as string } : idOrConfig as RxCacheItemConfig<T>;
    let cacheItem = this.cacheItems.find(i => i.id === config.id);
    if (!cacheItem) {
      cacheItem = new RxCacheItem<T>(config);
      this.cacheItems = [ ...this.cacheItems, cacheItem ];
    } else if (!paramIsString) {
      cacheItem.configure(config);
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
