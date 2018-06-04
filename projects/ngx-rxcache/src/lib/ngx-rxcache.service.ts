import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from "rxjs";

import { RxCacheItem } from './models/rxcache-item';
import { RxCacheItemConfig } from './models/rxcache-item-config';

@Injectable({
  providedIn: 'root'
})
export class NgxRxcacheService {

  constructor() { }

  private cacheItems: RxCacheItem<any>[] = [];

  add<T>(config: RxCacheItemConfig<T>) {
    const hasInitialValue = typeof config.initialValue !== 'undefined';
    const cacheItem: RxCacheItem<T> = {
      id: config.id,
      instance$: new BehaviorSubject<T>(hasInitialValue ? config.initialValue : null),
      loading$: new BehaviorSubject<boolean>(false),
      loaded$: new BehaviorSubject<boolean>(hasInitialValue),
      hasError$: new BehaviorSubject<boolean>(false),
      error$: new BehaviorSubject<string>(undefined),
      genericError: config.genericError ? config.genericError : 'An error has occoured',
      construct: config.construct,
      errorHandler: config.errorHandler,
      subscription: null
    };
    if (config.load) {
      this.refreshCacheItem(cacheItem);
    }
    this.cacheItems = [ ...this.cacheItems, cacheItem ];
  }

  exists(id: string): boolean {
    return !!this.cacheItems.find(i => i.id === id);
  }

  get$<T>(id: string): BehaviorSubject<T> {
    const cacheItem = this.cacheItems.find(i => i.id === id);
    if (cacheItem) {
      if (!cacheItem.loaded$.getValue() && !cacheItem.loading$.getValue()) {
        this.refreshCacheItem(cacheItem);
      }
      return cacheItem.instance$ as BehaviorSubject<T>;
    }
  }

  get<T>(id: string): T {
    const cacheItem = this.cacheItems.find(i => i.id === id);
    if (cacheItem) {
      if (!cacheItem.loaded$.getValue() && !cacheItem.loading$.getValue()) {
        this.refreshCacheItem(cacheItem);
      }
      return cacheItem.instance$.getValue() as T;
    }
  }

  update<T>(id: string, value: T) {
    const cacheItem = this.cacheItems.find(i => i.id === id);
    if (cacheItem) {
      cacheItem.instance$.next(value);
      cacheItem.hasError$.next(false);
      cacheItem.error$.next(undefined);
      cacheItem.loaded$.next(true);
      cacheItem.loading$.next(false);
    }
  }

  refresh(id: string) {
    const cacheItem = this.cacheItems.find(i => i.id === id);
    if (cacheItem) {
      this.refreshCacheItem(cacheItem);
    }
  }

  reload<T>(id: string, construct: () => Observable<T>) {
    const cacheItem = this.cacheItems.find(item => item.id === id);
    if (cacheItem) {
      cacheItem.loaded$.next(false);
      cacheItem.loading$.next(true);
      cacheItem.hasError$.next(false);
      cacheItem.error$.next(undefined);
      if (cacheItem.subscription) {
        cacheItem.subscription.unsubscribe();
      }
      const subscription = construct().subscribe(
        item => {
          cacheItem.instance$.next(item);
          cacheItem.loaded$.next(true);
          cacheItem.loading$.next(false);
        }, (error) => { this.errorHandler(cacheItem, error); }
      );
      this.cacheItems = this.cacheItems.map(item => item.id === id ? { ...item, construct, subscription } : item);
    }
  }

  reset(id: string) {
    const cacheItem = this.cacheItems.find(item => item.id === id);
    if (cacheItem) {
      cacheItem.loaded$.next(false);
      cacheItem.loading$.next(false);
      cacheItem.hasError$.next(false);
      cacheItem.error$.next(undefined);
      cacheItem.instance$.next(undefined);
      if (cacheItem.subscription) {
        cacheItem.subscription.unsubscribe();
        this.cacheItems = this.cacheItems.map(item => item === cacheItem ? { ...item, subscription: null } : item);
      }
    }
  }

  unsubscribe(id: string) {
    const cacheItem = this.cacheItems.find(item => item.id === id);
    if (cacheItem && cacheItem.subscription) {
      cacheItem.subscription.unsubscribe();
      this.cacheItems = this.cacheItems.map(item => item === cacheItem ? { ...item, subscription: null } : item);
    }
  }

  delete(id: string) {
    const cacheItem = this.cacheItems.find(item => item.id === id);
    cacheItem.instance$.complete();
    cacheItem.loading$.complete();
    cacheItem.loaded$.complete();
    cacheItem.error$.complete();
    cacheItem.hasError$.complete();
    if (cacheItem.subscription) {
      cacheItem.subscription.unsubscribe();
    }
    this.cacheItems = this.cacheItems.filter(item => item !== cacheItem);
  }

  private refreshCacheItem(cacheItem: RxCacheItem<any>) {
    if (cacheItem.construct) {
      cacheItem.loaded$.next(false);
      cacheItem.loading$.next(true);
      cacheItem.hasError$.next(false);
      cacheItem.error$.next(undefined);
      if (cacheItem.subscription) {
        cacheItem.subscription.unsubscribe();
      }
      const subscription = cacheItem.construct().subscribe(
        item => {
          cacheItem.instance$.next(item);
          cacheItem.loaded$.next(true);
          cacheItem.loading$.next(false);
        }, (error) => { this.errorHandler(cacheItem, error); }
      );
      this.cacheItems = this.cacheItems.map(item => item === cacheItem ? { ...item, subscription } : item);
    }
  }

  private errorHandler(cacheItem: RxCacheItem<any>, error: any) {
    cacheItem.error$.next(cacheItem.errorHandler ? this.generateErrorMessage(cacheItem, error) : cacheItem.genericError);
    cacheItem.loaded$.next(false);
    cacheItem.loading$.next(false);
    cacheItem.hasError$.next(true);
  }

  private generateErrorMessage(cacheItem, error: any) : string {
    const errorMessage = cacheItem.errorHandler(cacheItem.id, error);
    return errorMessage ? errorMessage : cacheItem.genericError;
  }

  loading(id: string): boolean {
    const cacheItem = this.cacheItems.find(i => i.id === id);
    if (cacheItem) {
      return cacheItem.loading$.getValue();
    }
  }

  loading$(id: string): BehaviorSubject<boolean> {
    return this.cacheItems.find(i => i.id === id).loading$;
  }

  loaded(id: string): boolean {
    const cacheItem = this.cacheItems.find(i => i.id === id);
    if (cacheItem) {
      return cacheItem.loaded$.getValue();
    }
  }

  loaded$(id: string): BehaviorSubject<boolean> {
    return this.cacheItems.find(i => i.id === id).loaded$;
  }

  error(id: string): string {
    const cacheItem = this.cacheItems.find(i => i.id === id);
    if (cacheItem) {
      return cacheItem.error$.getValue();
    }
  }

  error$(id: string): BehaviorSubject<string> {
    return this.cacheItems.find(i => i.id === id).error$;
  }
}
