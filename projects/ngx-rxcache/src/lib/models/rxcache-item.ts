import { Observable, BehaviorSubject, Subscription, Subject } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';

import { RxCacheItemConfig } from './rxcache-item-config';
import { globalConfig } from './rxcache-global-config';
import { clone } from '../clone';

export class RxCacheItem<T> {
  constructor(config: RxCacheItemConfig<T>) {
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
      localStorageItem && localStorageItem !== 'undefined'
        ? config.parse
          ? config.parse(JSON.parse(localStorageItem))
          : JSON.parse(localStorageItem)
        : sessionStorageItem && sessionStorageItem !== 'undefined'
          ? config.parse
            ? config.parse(JSON.parse(sessionStorageItem))
            : JSON.parse(sessionStorageItem)
          : config.initialValue
    );
    this.configure(config);
  }

  id: string;
  private subscription?: Subscription;
  private autoload?: boolean;
  private localStorage?: boolean;
  private sessionStorage?: boolean;
  private genericError: string;

  private construct?: () => Observable<T>;
  private _save?: (value: T) => Observable<any>;

  private saved?: (response: any, val?: T) => void;
  private errorHandler?: (error: any, value?: T) => string | void;

  private stringify?: (value: T) => any;
  private parse?: (value: any) => T;

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
    this._save = config.save || this._save;
    this.saved = config.saved || this.saved;
    this.errorHandler = config.errorHandler || this.errorHandler;
    this.stringify = config.stringify || this.stringify;
    this.parse = config.parse || this.parse;

    if (config.construct) {
      this.unsubscribe();
      this.next(this._loading$, false);
    }
    if (config.load) {
      this.load();
    }
  }

  private instance$: BehaviorSubject<T>;
  get value$(): BehaviorSubject<T> {
    if (
      this.autoload &&
      this.construct &&
      typeof this.instance$.getValue() === 'undefined' &&
      !this.loaded$.getValue() &&
      !this.loading$.getValue()
    ) {
      this.load();
    }
    return this.instance$;
  }

  private _clone$: Observable<T>;
  get clone$(): Observable<T> {
    if (!this._clone$) {
      this._clone$ = this.value$.pipe(map(value => clone(value)));
    }
    return this._clone$;
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

  private nextValue(value: T) {
    if (this.localStorage) {
      localStorage.setItem(this.id, this.stringify ? JSON.stringify(this.stringify(value)) : JSON.stringify(value));
    }
    if (this.sessionStorage) {
      sessionStorage.setItem(this.id, this.stringify ? JSON.stringify(this.stringify(value)) : JSON.stringify(value));
    }
    this.instance$.next(value);
  }

  update(value: T) {
    this.unsubscribe();
    this.nextValue(value);
    this.next(this._hasError$, false);
    this.next(this._error$, undefined);
    this.next(this._loaded$, typeof value !== 'undefined');
    this.next(this._loading$, false);
  }

  save();
  save(value: T);
  save(saved: (value: any) => void);
  save(value: T, saved: (response: any, value: any) => void);
  save(
    valueOrSaved?: T | ((response: any, value?: any) => void),
    savedOrUndefined?: (response: any, value?: any) => void
  ) {
    const valueOrSavedIsFunction = typeof valueOrSaved === 'function';
    const value: T =
      valueOrSavedIsFunction || typeof valueOrSaved === 'undefined' ? this.instance$.getValue() : (valueOrSaved as T);
    const saved: (response: any, value?: any) => void = valueOrSavedIsFunction
      ? (valueOrSaved as (response: any, value?: any) => void)
      : savedOrUndefined;
    if (this._save) {
      this.saving$.next(true);
      this.saved$.next(false);
      this.next(this.hasError$, false);
      this.next(this.error$, undefined);
      const finalise = new Subject<boolean>();
      this._save(value)
        .pipe(takeUntil(finalise))
        .subscribe(
          response => {
            if (saved) {
              saved(response, value);
            }
            if (this.saved) {
              this.saved(response, value);
            }
            this._saved$.next(true);
            this._saving$.next(false);
            finalise.next(true);
          },
          error => {
            this.runErrorHandler(error, value);
            finalise.next(true);
          }
        );
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
        },
        error => {
          this.runErrorHandler(error);
        }
      );
    }
  }

  reset(value?: T) {
    this.next(this._loaded$, false);
    this.next(this._loading$, false);
    this.next(this._hasError$, false);
    this.next(this._error$, undefined);
    this.nextValue(value);
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

  private runErrorHandler(error: any, value?: T) {
    const globalConfigError = globalConfig.errorHandler
      ? globalConfig.errorHandler(this.id, error, value)
      : globalConfig.genericError;
    this.error$.next(
      (this.errorHandler ? this.generateErrorMessage(error, value) : this.genericError) ||
        globalConfigError ||
        globalConfig.genericError
    );
    this.hasError$.next(true);
    this.hasError$.next(true);
    this.next(this._loaded$, false);
    this.next(this._loading$, false);
    this.next(this._saved$, false);
    this.next(this._saving$, false);
  }

  private generateErrorMessage(error: any, value?: T): string {
    return this.errorHandler(error, value) || this.genericError || globalConfig.genericError;
  }
}
