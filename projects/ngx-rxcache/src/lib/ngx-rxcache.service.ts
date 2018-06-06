import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from "rxjs";

import { RxCacheItem } from '../models/ngx-rxcache/rxcache-item';
import { RxCacheItemConfig } from '../models/ngx-rxcache/rxcache-item-config';

@Injectable()
export class NgxRxcacheService {
  readonly genericError = 'An error has occoured';

  constructor () { }

  private cacheItems: RxCacheItem<any>[] = [];

  add<T>(config: RxCacheItemConfig<T>) {
    const cacheItem = this.find<T>(config.id);
    if (typeof config.initialValue !== 'undefined' && typeof cacheItem.instance$.getValue() === 'undefined') {
      cacheItem.instance$.next(config.initialValue);
      cacheItem.loaded$.next(true);
    }
    const newCacheItem: RxCacheItem<T> = {
      ...cacheItem,
      genericError: config.genericError || cacheItem.genericError,
      construct: config.construct || cacheItem.construct,
      persist: config.persist || cacheItem.persist,
      saved: config.saved || cacheItem.saved,
      errorHandler: config.errorHandler || cacheItem.errorHandler,
      subscription: config.construct ? null : cacheItem.subscription
    };
    if (config.construct && cacheItem.subscription) {
      cacheItem.subscription.unsubscribe();
    }
    if (config.load) {
      this.refreshCacheItem(cacheItem);
    }
    this.cacheItems = this.cacheItems.map(item => item === cacheItem ? newCacheItem : item);
  }

  find<T>(id: string): RxCacheItem<T> {
    var cacheItem = this.cacheItems.find(i => i.id === id);
    if (!cacheItem) {
      cacheItem = {
        id: id,
        instance$: new BehaviorSubject<T>(undefined),
        loading$: new BehaviorSubject<boolean>(false),
        loaded$: new BehaviorSubject<boolean>(false),
        saving$: new BehaviorSubject<boolean>(false),
        saved$: new BehaviorSubject<boolean>(false),
        hasError$: new BehaviorSubject<boolean>(false),
        error$: new BehaviorSubject<string>(undefined),
        genericError: this.genericError,
        errorHandler: undefined,
        subscription: null
      };
      this.cacheItems = [ ...this.cacheItems, cacheItem ];
    }
    return cacheItem;
  }

  exists (id: string): boolean {
    return !!this.cacheItems.find(i => i.id === id);
  }

  get$<T>(id: string): BehaviorSubject<T> {
    const cacheItem = this.find(id);
    if (!cacheItem.loaded$.getValue() && !cacheItem.loading$.getValue()) {
      this.refreshCacheItem(cacheItem);
    }
    return cacheItem.instance$ as BehaviorSubject<T>;
  }

  get<T>(id: string): T {
    return this.get$(id).getValue() as T;
  }

  update<T>(id: string, value: T) {
    const cacheItem = this.find(id);
    cacheItem.instance$.next(value);
    cacheItem.hasError$.next(false);
    cacheItem.error$.next(undefined);
    cacheItem.loaded$.next(true);
    cacheItem.loading$.next(false);
  }

  refresh(id: string) {
    this.refreshCacheItem(this.find(id));
  }

  save<T>(id: string, saved?: (val: any) => void) {
    const cacheItem = this.find(id);
    if (cacheItem.persist) {
      cacheItem.saved$.next(false);
      cacheItem.saving$.next(true);
      cacheItem.persist(cacheItem.instance$.getValue() as T).subscribe(val => {
        if (saved) {
          saved(val);
        }
        if (cacheItem.saved) {
          cacheItem.saved(val);
        }
        cacheItem.saved$.next(true);
        cacheItem.saving$.next(false);
      }, (error) => { this.errorHandler(cacheItem, error); });
    }
  }

  reload<T>(id: string, construct: () => Observable<T>) {
    const cacheItem = this.find(id);
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

  reset(id: string) {
    const cacheItem = this.cacheItems.find(item => item.id === id);
    if ( cacheItem ) {
      cacheItem.loaded$.next(false);
      cacheItem.loading$.next(false);
      cacheItem.hasError$.next(false);
      cacheItem.error$.next(undefined);
      cacheItem.instance$.next(undefined);
      this.unsubscribeItem(cacheItem);
    }
  }

  unsubscribe(id: string) {
    this.unsubscribeItem(this.cacheItems.find(item => item.id === id));
  }

  private unsubscribeItem(cacheItem: RxCacheItem<any>) {
    if (cacheItem && cacheItem.subscription) {
      cacheItem.subscription.unsubscribe();
      this.cacheItems = this.cacheItems.map(item => item === cacheItem ? { ...item, subscription: null } : item);
    }
  }

  delete(id: string) {
    const cacheItem = this.cacheItems.find(item => item.id === id);
    if (cacheItem) {
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

  private generateErrorMessage(cacheItem, error: any): string {
    return cacheItem.errorHandler(cacheItem.id, error) || cacheItem.genericError;
  }

  loading(id: string): boolean {
    return this.find(id).loading$.getValue();
  }

  loading$(id: string): BehaviorSubject<boolean> {
    return this.find(id).loading$;
  }

  loaded(id: string): boolean {
    return this.find(id).loaded$.getValue();
  }

  loaded$(id: string): BehaviorSubject<boolean> {
    return this.find(id).loaded$;
  }

  saving(id: string): boolean {
    return this.find(id).saving$.getValue();
  }

  saving$(id: string): BehaviorSubject<boolean> {
    return this.find(id).saving$;
  }

  saved(id: string): boolean {
    return this.find(id).saved$.getValue();
  }

  saved$(id: string): BehaviorSubject<boolean> {
    return this.find(id).saved$;
  }

  error(id: string): string {
    return this.find(id).error$.getValue();
  }

  error$(id: string): BehaviorSubject<string> {
    return this.find(id).error$;
  }
}
