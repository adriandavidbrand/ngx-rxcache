import { Observable, BehaviorSubject, Subscription, Subject } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';

import { RxCacheItemConfig } from './rxcache-item-config';
import { globalConfig } from './rxcache-global-config';
import { clone } from '@app/shared/functions/clone';

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
  private lastRefreshed: Date;
  private expires?: number;

  private construct?: () => Observable<T>;
  private _save?: (value: T) => Observable<any>;
  private _saved?: (response: any, val?: T) => void;
  private _delete?: (value: T) => Observable<any>;
  private _deleted?: (response: any, val?: T) => void;
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
    this.expires = config.expires || this.expires;

    this.construct = config.construct || this.construct;
    this._save = config.save || this._save;
    this._saved = config.saved || this._saved;
    this._delete = config.delete || this._delete;
    this._deleted = config.deleted || this._deleted;
    this.errorHandler = config.errorHandler || this.errorHandler;
    this.stringify = config.stringify || this.stringify;
    this.parse = config.parse || this.parse;

    if (config.construct) {
      this.unsubscribe();
    }
    if (config.load) {
      this.load();
    }
  }

  get expired(): boolean {
    return (
      this.expires &&
      this.lastRefreshed &&
      this.lastRefreshed.getTime() < new Date().getTime() - this.expires * 60 * 1000
    );
  }

  private instance$: BehaviorSubject<T>;
  get value$(): Observable<T> {
    this.tryAutoload();
    return this.instance$.pipe(map(instance => (this.expired ? undefined : instance)));
  }

  get value(): T {
    this.tryAutoload();
    return this.expired ? undefined : this.instance$.getValue();
  }

  private tryAutoload() {
    if (
      this.autoload &&
      this.construct &&
      typeof this.instance$.getValue() === 'undefined' &&
      !this.loaded &&
      !this.loading
    ) {
      this.load();
    }
  }

  private _clone$: Observable<T>;
  get clone$(): Observable<T> {
    if (!this._clone$) {
      this._clone$ = this.value$.pipe(map(value => clone(value)));
    }
    return this._clone$;
  }

  get clone(): T {
    return clone(this.value);
  }

  private _loaded$: BehaviorSubject<boolean>;
  get loaded$(): Observable<boolean> {
    this.createLoaded();
    return this._loaded$.pipe(map(loaded => (this.expired ? false : loaded)));
  }

  get loaded(): boolean {
    this.createLoaded();
    return this.expired ? false : this._loaded$.getValue();
  }

  private createLoaded() {
    if (!this._loaded$) {
      this._loaded$ = new BehaviorSubject<boolean>(typeof this.instance$.getValue() !== 'undefined');
    }
  }

  private _loading$: BehaviorSubject<boolean>;
  get loading$(): Observable<boolean> {
    this.createLoading();
    return this._loading$;
  }

  get loading(): boolean {
    this.createLoading();
    return this._loading$.getValue();
  }

  private createLoading() {
    if (!this._loading$) {
      this._loading$ = new BehaviorSubject<boolean>(false);
    }
  }

  private _saving$: BehaviorSubject<boolean>;
  get saving$(): Observable<boolean> {
    this.createSaving();
    return this._saving$;
  }

  get saving(): boolean {
    this.createSaving();
    return this._saving$.getValue();
  }

  private createSaving() {
    if (!this._saving$) {
      this._saving$ = new BehaviorSubject<boolean>(false);
    }
  }

  private _saved$: BehaviorSubject<boolean>;
  get saved$(): Observable<boolean> {
    this.createSaved();
    return this._saved$;
  }

  get saved(): boolean {
    this.createSaved();
    return this._saved$.getValue();
  }

  private createSaved() {
    if (!this._saved$) {
      this._saved$ = new BehaviorSubject<boolean>(false);
    }
  }

  private _deleting$: BehaviorSubject<boolean>;
  get deleting$(): Observable<boolean> {
    this.createDeleting();
    return this._deleting$;
  }

  get deleting(): boolean {
    this.createDeleting();
    return this._deleting$.getValue();
  }

  private createDeleting() {
    if (!this._deleting$) {
      this._deleting$ = new BehaviorSubject<boolean>(false);
    }
  }

  private _deleted$: BehaviorSubject<boolean>;
  get deleted$(): Observable<boolean> {
    this.createDeleted();
    return this._deleted$;
  }

  get deleted(): boolean {
    this.createDeleted();
    return this._deleted$.getValue();
  }

  private createDeleted() {
    if (!this._deleted$) {
      this._deleted$ = new BehaviorSubject<boolean>(false);
    }
  }

  private _hasError$: BehaviorSubject<boolean>;
  get hasError$(): Observable<boolean> {
    this.createHasError();
    return this._hasError$;
  }

  get hasError(): boolean {
    this.createHasError();
    return this._hasError$.getValue();
  }

  private createHasError() {
    if (!this._hasError$) {
      this._hasError$ = new BehaviorSubject<boolean>(false);
    }
  }

  private _error$: BehaviorSubject<string>;
  get error$(): Observable<string> {
    this.createError();
    return this._error$;
  }

  get error(): string {
    this.createError();
    return this._error$.getValue();
  }

  private createError() {
    if (!this._error$) {
      this._error$ = new BehaviorSubject<string>(undefined);
    }
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
    this.lastRefreshed = new Date();
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
  save(saved: (response: any, value?: any) => void);
  save(value: T, saved: (response: any, value?: any) => void);
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
      if (this._saving$) {
        this._saving$.next(true);
      } else {
        this._saving$ = new BehaviorSubject<boolean>(true);
      }
      if (this._saved$) {
        this._saved$.next(false);
      } else {
        this._saved$ = new BehaviorSubject<boolean>(false);
      }
      this.next(this._hasError$, false);
      this.next(this._error$, undefined);
      const finalise = new Subject<boolean>();
      this._save(value)
        .pipe(takeUntil(finalise))
        .subscribe(
          response => {
            if (saved) {
              saved(response, value);
            }
            if (this._saved) {
              this._saved(response, value);
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

  delete();
  delete(value: T);
  delete(deleted: (response: any, value?: any) => void);
  delete(value: T, deleted: (response: any, value?: any) => void);
  delete(
    valueOrDeleted?: T | ((response: any, value?: any) => void),
    deletedOrUndefined?: (response: any, value?: any) => void
  ) {
    const valueOrDeletedIsFunction = typeof valueOrDeleted === 'function';
    const value: T =
      valueOrDeletedIsFunction || typeof valueOrDeleted === 'undefined'
        ? this.instance$.getValue()
        : (valueOrDeleted as T);
    const deleted: (response: any, value?: any) => void = valueOrDeletedIsFunction
      ? (valueOrDeleted as (response: any, value?: any) => void)
      : deletedOrUndefined;
    if (this._delete) {
      if (this._deleting$) {
        this._deleting$.next(true);
      } else {
        this._deleting$ = new BehaviorSubject<boolean>(true);
      }
      if (this._deleted$) {
        this._deleted$.next(false);
      } else {
        this._deleted$ = new BehaviorSubject<boolean>(false);
      }
      this.next(this._hasError$, false);
      this.next(this._error$, undefined);
      const finalise = new Subject<boolean>();
      this._delete(value)
        .pipe(takeUntil(finalise))
        .subscribe(
          response => {
            if (deleted) {
              deleted(response, value);
            }
            if (this._deleted) {
              this._deleted(response, value);
            }
            this._deleted$.next(true);
            this._deleting$.next(false);
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
      if (this._loading$) {
        this._loading$.next(true);
      } else {
        this._loading$ = new BehaviorSubject<boolean>(true);
      }
      if (this._loaded$) {
        this._loaded$.next(false);
      } else {
        this._loaded$ = new BehaviorSubject<boolean>(false);
      }
      this.next(this._hasError$, false);
      this.next(this._error$, undefined);
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
    this.complete(this._saving$);
    this.complete(this._saved$);
    this.complete(this._deleting$);
    this.complete(this._deleted$);
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
    const errorMsg =
      (this.errorHandler ? this.errorHandler(error, value) : this.genericError) ||
      (globalConfig.errorHandler ? globalConfig.errorHandler(this.id, error, value) : globalConfig.genericError) ||
      this.genericError ||
      globalConfig.genericError;
    if (this._error$) {
      this._error$.next(errorMsg);
    } else {
      this._error$ = new BehaviorSubject<string>(errorMsg);
    }
    if (this._hasError$) {
      this._hasError$.next(true);
    } else {
      this._hasError$ = new BehaviorSubject<boolean>(true);
    }
    this.next(this._loaded$, false);
    this.next(this._loading$, false);
    this.next(this._saved$, false);
    this.next(this._saving$, false);
    this.next(this._deleting$, false);
    this.next(this._deleted$, false);
  }
}
