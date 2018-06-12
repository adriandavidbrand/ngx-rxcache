import { Observable, BehaviorSubject, Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { RxCacheItemConfig } from './rxcache-item-config';
import { globalConfig } from './rxcache-global-config';

export class RxCacheItem<T> {
  constructor (config: RxCacheItemConfig<T>) {
    this.id = config.id;
    const localStorageItem = localStorage.getItem(config.id);
    if (localStorageItem) {
      this.localStorage = true;
    }
    const sessionStorageItem = sessionStorage.getItem(config.id);
    if (sessionStorageItem) {
      this.sessionStorage = true;
    }
    this.instance$ = new BehaviorSubject<T>(
      (localStorageItem && localStorageItem !== 'undefined') ? JSON.parse(localStorageItem) : 
      (sessionStorageItem && sessionStorageItem !== 'undefined') ? JSON.parse(sessionStorageItem) :
      config.initialValue);
    this.configure(config);
  }

  id: string;
  private subscription?: Subscription;
  private autoload?: boolean;
  private localStorage?: boolean;
  private sessionStorage?: boolean;
  private genericError: string;

  private construct?: () => Observable<T>;
  private persist?: (val: T) => Observable<any>;
  private saved?: (val: any) => void;
  private errorHandler?: (id: string, error?: any) => string;

  configure(config: RxCacheItemConfig<T>) {
    const hasInitialValue = typeof config.initialValue !== 'undefined';
    const hasValue = typeof this.instance$.getValue() !== 'undefined';
    if (hasInitialValue && !hasValue) {
      this.nextValue(config.initialValue);
      this.next(this._loaded$, true);
    }

    this.autoload = config.autoload || this.autoload;
    this.localStorage = config.localStorage || this.localStorage;
    this.sessionStorage = config.sessionStorage || this.sessionStorage;
    this.genericError = config.genericError || this.genericError;

    this.construct = config.construct || this.construct;
    this.persist = config.persist || this.persist;
    this.saved = config.saved || this.saved;
    this.errorHandler = config.errorHandler || this.errorHandler;

    if (config.construct) {
      this.unsubscribe();
    }
    if (config.load) {
      this.load();
    }
  }

  private instance$: BehaviorSubject<T>;
  get value$(): BehaviorSubject<T> {
    if (this.autoload && this.construct && typeof this.instance$.getValue() === 'undefined' && !this.loaded$.getValue() && !this.loading$.getValue()) {
      this.load();
    }
    return this.instance$;
  }

  private _loaded$: BehaviorSubject<boolean>;
  get loaded$(): BehaviorSubject<boolean> {
    if (!this._loaded$) {
      this._loaded$ = new BehaviorSubject<boolean>(typeof this.instance$.getValue() !== 'undefined');
    }
    return this._loaded$;
  }
  
  private _loading$: BehaviorSubject<boolean>;
  get loading$(): BehaviorSubject<boolean> {
    if (!this._loading$) {
      this._loading$ = new BehaviorSubject<boolean>(false);
    }
    return this._loading$;
  }

  private _saving$: BehaviorSubject<boolean>;
  get saving$(): BehaviorSubject<boolean> {
    if (!this._saving$) {
      this._saving$ = new BehaviorSubject<boolean>(false);
    }
    return this._saving$;
  }

  private _saved$: BehaviorSubject<boolean>;
  get saved$(): BehaviorSubject<boolean> {
    if (!this._saved$) {
      this._saved$ = new BehaviorSubject<boolean>(false);
    }
    return this._saved$;
  }

  private _hasError$: BehaviorSubject<boolean>;
  get hasError$(): BehaviorSubject<boolean> {
    if (!this._hasError$) {
      this._hasError$ = new BehaviorSubject<boolean>(false);
    }
    return this._hasError$;
  }

  private _error$: BehaviorSubject<string>;
  get error$(): BehaviorSubject<string> {
    if (!this._error$) {
      this._error$ = new BehaviorSubject<string>(undefined);
    }
    return this._error$;
  }

  private next<T>(bs: BehaviorSubject<T>, value: T) {
    if (bs) {
      bs.next(value);
    }
  }

  private nextValue(item: T) {
    if (this.localStorage) {
      localStorage.setItem(this.id, JSON.stringify(item));
    }
    if (this.sessionStorage) {
      sessionStorage.setItem(this.id, JSON.stringify(item));
    }
    this.instance$.next(item);
  }

  update(item: T) {
    this.nextValue(item);
    this.next(this._hasError$, false);
    this.next(this._error$, undefined);
    this.next(this._loaded$, typeof item !== 'undefined');
    this.next(this._loading$, false);
  }

  save(saved?: (val: any) => void) {
    if (this.persist) {
      this.saving$.next(true);
      this.saved$.next(false);
      this.next(this.hasError$, false);
      this.next(this.error$, undefined);
      const finalise = new Subject<boolean>();
      this.persist(this.instance$.getValue()).pipe(takeUntil(finalise)).subscribe(val => {
        if (saved) {
          saved(val);
        }
        if (this.saved) {
          this.saved(val);
        }
        this._saved$.next(true);
        this._saving$.next(false);
        finalise.next(true);
      }, (error) => { this.runErrorHandler(error); finalise.next(true); });
    }
  }

  load(construct?: () => Observable<T>) {
    if (construct) {
      this.construct = construct;
    }
    if (this.construct) {
      this.loading$.next(true);
      this.loaded$.next(false);
      this.next(this.hasError$, false);
      this.next(this.error$, undefined);
      this.unsubscribe();
      this.subscription = this.construct().subscribe(
        item => {
          this.nextValue(item);
          this._loaded$.next(true);
          this._loading$.next(false);
        }, (error) => { this.runErrorHandler(error); }
      );
    }
  }

  reset(item?: T) {
    this.next(this._loaded$, false);
    this.next(this._loading$, false);
    this.next(this._hasError$, false);
    this.next(this._error$, undefined);
    this.nextValue(item);
    this.unsubscribe();
  }

  unsubscribe() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  finish() {
    this.instance$.complete();
    this.complete(this._loading$);
    this.complete(this._loaded$);
    this.complete(this._error$);
    this.complete(this._hasError$);
    this.unsubscribe();
  }

  private complete(bs: BehaviorSubject<any>) {
    if (bs) {
      bs.complete();
    }
  }

  private runErrorHandler(error: any) {
    const globalConfigError = globalConfig.errorHandler ? globalConfig.errorHandler(this.id, error) : globalConfig.genericError;
    this.error$.next((this.errorHandler ? this.generateErrorMessage(error) : this.genericError) || globalConfigError || globalConfig.genericError);
    this.hasError$.next(true);
    this.hasError$.next(true);
    if (this.construct) {
      this.loaded$.next(false);
      this.loading$.next(false);
    }
    if (this.persist) {
      this.saved$.next(false);
      this.saving$.next(false);
    }
  }

  private generateErrorMessage(error: any): string {
    return this.errorHandler(this.id, error) || this.genericError || globalConfig.genericError;
  }
}
