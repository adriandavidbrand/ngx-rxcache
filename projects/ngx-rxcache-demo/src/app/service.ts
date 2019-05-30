import { Injectable } from '@angular/core';
import { RxCacheService } from 'ngx-rxcache';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class Service {

  constructor(private cache: RxCacheService) { }

  // Get one that doesn't exist will return one with only the instance Behaviour Subject initialised
  private cacheMessage = this.cache.get<string>('savedMessage');

  // Get allows you to finely tune the cache item with, constructors and persistence methods
  // and configure initial state, whether to persist to localStorage and error handlers.
  // It can config an existing one or will return a new one if one isn't found
  private cacheItem = this.cache.get<string[]>({
      id: 'items',
      errorHandler: error => `Loading failed with the error: ${error}`,
      construct: () => of(['Item 1', 'Item 2', 'Item 3', 'Item 4']).pipe(delay(1000)),
      initialValue: [],
      save: val => of('ok').pipe(delay(1000)),
      saved: response => { this.cacheMessage.update(`Save function returned: ${response}`); }
    });

  items$ = this.cacheItem.value$;
  loading$ = this.cacheItem.loading$;
  error$ = this.cacheItem.error$;
  saving$ = this.cacheItem.saving$;
  saved$ = this.cacheItem.saved$;
  message$ = this.cacheMessage.value$;

  clear = () => { this.cacheMessage.update(null); };
  update = values => { this.cacheItem.update(values); };
  refresh = () => { this.cacheItem.load(); };
  reload = () => { this.cacheItem.load(() => of(['Item 4', 'Item 3', 'Item 2', 'Item 1']).pipe(delay(1000))); };
  error = () => { this.cacheItem.load(() => throwError('I made a boo boo')); };
  save = () => { this.cacheItem.save(); };
  add = text => { this.cacheItem.update([ ...this.cacheItem.value, text ]); };
}
