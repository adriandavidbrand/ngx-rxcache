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
    this.observables.instance$ = new BehaviorSubject<T>(
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
    this.observables.instanceExpiredCheck$ = this.observables.instance$.pipe(
      map(instance => (this.expired ? undefined : instance))
    );
    this.lastRefreshed = new Date();
    this.configure(config);
  }

  id: string;
  private subscription: Subscription;
  private autoload: boolean;
  private localStorage: boolean;
  private sessionStorage: boolean;
  private genericError: string;
  private lastRefreshed: Date;
  private expires: number;

  private functions: {
    construct: () => Observable<T>;
    save: (value: T) => Observable<any>;
    saved: (response: any, val?: T) => void;
    delete: (value: T) => Observable<any>;
    deleted: (response: any, val?: T) => void;
    errorHandler: (error: any, value?: T) => string | void;
    stringify: (value: T) => any;
    parse: (value: any) => T;
  } = {
    construct: undefined,
    save: undefined,
    saved: undefined,
    delete: undefined,
    deleted: undefined,
    errorHandler: undefined,
    stringify: undefined,
    parse: undefined
  };

  private observables: {
    instance$: BehaviorSubject<T>;
    instanceExpiredCheck$: Observable<T>;
    clone$: Observable<T>;
    loadedExpiredCheck$: Observable<boolean>;
    loaded$: BehaviorSubject<boolean>;
    loading$: BehaviorSubject<boolean>;
    saving$: BehaviorSubject<boolean>;
    saved$: BehaviorSubject<boolean>;
    deleting$: BehaviorSubject<boolean>;
    deleted$: BehaviorSubject<boolean>;
    hasError$: BehaviorSubject<boolean>;
    error$: BehaviorSubject<string>;
  } = {
    instance$: undefined,
    instanceExpiredCheck$: undefined,
    clone$: undefined,
    loadedExpiredCheck$: undefined,
    loaded$: undefined,
    loading$: undefined,
    saving$: undefined,
    saved$: undefined,
    deleting$: undefined,
    deleted$: undefined,
    hasError$: undefined,
    error$: undefined
  };

  get expired(): boolean {
    return (
      this.expires &&
      this.lastRefreshed &&
      this.lastRefreshed.getTime() < new Date().getTime() - this.expires * 60 * 1000
    );
  }

  get value$(): Observable<T> {
    this.tryAutoload();
    return this.observables.instanceExpiredCheck$;
  }

  get value(): T {
    this.tryAutoload();
    return this.expired ? undefined : this.observables.instance$.getValue();
  }

  get clone$(): Observable<T> {
    if (!this.observables.clone$) {
      this.observables.clone$ = this.value$.pipe(map(value => clone(value)));
    }
    return this.observables.clone$;
  }

  get clone(): T {
    return clone(this.value);
  }

  get loaded$(): Observable<boolean> {
    this.createLoaded();
    return this.observables.loadedExpiredCheck$;
  }

  get loaded(): boolean {
    this.createLoaded();
    return this.observables.loaded$.getValue() && !this.expired;
  }

  private createLoaded() {
    if (!this.observables.loaded$) {
      this.observables.loaded$ = new BehaviorSubject<boolean>(
        typeof this.observables.instance$.getValue() !== 'undefined'
      );
      this.observables.loadedExpiredCheck$ = this.observables.loaded$.pipe(map(loaded => loaded && !this.expired));
    }
  }

  private createBehaviorSubject<BehaviorSubjectType>(
    property: string,
    initialValue?: BehaviorSubjectType
  ): BehaviorSubject<BehaviorSubjectType> {
    const behaviorSubject = this.observables[property];
    if (!behaviorSubject) {
      this.observables[property] = new BehaviorSubject<BehaviorSubjectType>(initialValue);
    }
    return behaviorSubject;
  }

  get loading$(): Observable<boolean> {
    return this.createBehaviorSubject<boolean>('loading$', false);
  }

  get loading(): boolean {
    return this.createBehaviorSubject<boolean>('loading$', false).getValue();
  }

  get saving$(): Observable<boolean> {
    return this.createBehaviorSubject<boolean>('saving$', false);
  }

  get saving(): boolean {
    return this.createBehaviorSubject<boolean>('saving$', false).getValue();
  }

  get saved$(): Observable<boolean> {
    return this.createBehaviorSubject<boolean>('saved$', false);
  }

  get saved(): boolean {
    return this.createBehaviorSubject<boolean>('saved$', false).getValue();
  }

  get deleting$(): Observable<boolean> {
    return this.createBehaviorSubject<boolean>('deleting$', false);
  }

  get deleting(): boolean {
    return this.createBehaviorSubject<boolean>('deleting$', false).getValue();
  }

  get deleted$(): Observable<boolean> {
    return this.createBehaviorSubject<boolean>('deleted$', false);
  }

  get deleted(): boolean {
    return this.createBehaviorSubject<boolean>('deleted$', false).getValue();
  }

  get hasError$(): Observable<boolean> {
    return this.createBehaviorSubject<boolean>('hasError$', false);
  }

  get hasError(): boolean {
    return this.createBehaviorSubject<boolean>('hasError$', false).getValue();
  }

  get error$(): Observable<string> {
    return this.createBehaviorSubject<string>('error$');
  }

  get error(): string {
    return this.createBehaviorSubject<string>('error$').getValue();
  }

  configure(config: RxCacheItemConfig<T>) {
    const hasInitialValue = typeof config.initialValue !== 'undefined';
    const hasValue = typeof this.observables.instance$.getValue() !== 'undefined';
    if (hasInitialValue && !hasValue) {
      this.nextValue(config.initialValue);
      this.next(this.observables.loaded$, true);
    }

    this.autoload = config.autoload || this.autoload;
    this.localStorage = config.localStorage || this.localStorage;
    this.sessionStorage = config.sessionStorage || this.sessionStorage;
    this.genericError = config.genericError || this.genericError;
    this.expires = config.expires || this.expires;

    const functions = this.functions;

    functions.construct = config.construct || functions.construct;
    functions.save = config.save || functions.save;
    functions.saved = config.saved || functions.saved;
    functions.delete = config.delete || functions.delete;
    functions.deleted = config.deleted || functions.deleted;
    functions.errorHandler = config.errorHandler || functions.errorHandler;
    functions.stringify = config.stringify || functions.stringify;
    functions.parse = config.parse || functions.parse;

    if (config.construct) {
      this.unsubscribe();
    }
    if (config.load) {
      this.load();
    }
  }

  private tryAutoload() {
    if (
      this.autoload &&
      this.functions.construct &&
      typeof this.observables.instance$.getValue() === 'undefined' &&
      !this.loaded &&
      !this.loading
    ) {
      this.load();
    }
  }

  private next<ValueType>(bs: BehaviorSubject<ValueType>, value: ValueType, property?: string) {
    if (bs) {
      bs.next(value);
    } else if (property) {
      this.observables[property] = new BehaviorSubject<ValueType>(value);
    }
  }

  private nextValue(value: T) {
    if (this.localStorage) {
      localStorage.setItem(
        this.id,
        this.functions.stringify ? JSON.stringify(this.functions.stringify(value)) : JSON.stringify(value)
      );
    }
    if (this.sessionStorage) {
      sessionStorage.setItem(
        this.id,
        this.functions.stringify ? JSON.stringify(this.functions.stringify(value)) : JSON.stringify(value)
      );
    }
    this.observables.instance$.next(value);
    this.lastRefreshed = new Date();
  }

  update(value: T) {
    this.unsubscribe();
    this.nextValue(value);
    this.next(this.observables.hasError$, false);
    this.next(this.observables.error$, undefined);
    this.next(this.observables.loaded$, typeof value !== 'undefined');
    this.next(this.observables.loading$, false);
  }

  save();
  save(value: T);
  save(saved: (response: any, value?: any) => void);
  save(value: T, saved: (response: any, value?: any) => void);
  save(
    valueOrSaved?: T | ((response: any, value?: any) => void),
    savedOrUndefined?: (response: any, value?: any) => void
  ) {
    const observables = this.observables;
    const valueOrSavedIsFunction = typeof valueOrSaved === 'function';
    const value: T =
      valueOrSavedIsFunction || typeof valueOrSaved === 'undefined'
        ? observables.instance$.getValue()
        : (valueOrSaved as T);
    const saved: (response: any, value?: any) => void = valueOrSavedIsFunction
      ? (valueOrSaved as (response: any, value?: any) => void)
      : savedOrUndefined;
    if (this.functions.save) {
      const next = this.next;
      next(observables.saving$, true, 'saving$');
      next(observables.saved$, false, 'saved$');
      next(observables.hasError$, false);
      next(observables.error$, undefined);
      const finalise = new Subject<boolean>();
      this.functions
        .save(value)
        .pipe(takeUntil(finalise))
        .subscribe(
          response => {
            if (saved) {
              saved(response, value);
            }
            if (this.functions.saved) {
              this.functions.saved(response, value);
            }
            observables.saved$.next(true);
            observables.saving$.next(false);
            finalise.next(true);
            finalise.complete();
          },
          error => {
            this.runErrorHandler(error, value);
            finalise.next(true);
            finalise.complete();
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
    const observables = this.observables;
    const valueOrDeletedIsFunction = typeof valueOrDeleted === 'function';
    const value: T =
      valueOrDeletedIsFunction || typeof valueOrDeleted === 'undefined'
        ? observables.instance$.getValue()
        : (valueOrDeleted as T);
    const deleted: (response: any, value?: any) => void = valueOrDeletedIsFunction
      ? (valueOrDeleted as (response: any, value?: any) => void)
      : deletedOrUndefined;
    if (this.functions.delete) {
      const next = this.next;
      next(observables.deleting$, true, 'deleting$');
      next(observables.deleted$, false, 'deleting$');
      next(observables.hasError$, false);
      next(observables.error$, undefined);
      const finalise = new Subject<boolean>();
      this.functions
        .delete(value)
        .pipe(takeUntil(finalise))
        .subscribe(
          response => {
            if (deleted) {
              deleted(response, value);
            }
            if (this.functions.deleted) {
              this.functions.deleted(response, value);
            }
            observables.deleted$.next(true);
            observables.deleting$.next(false);
            finalise.next(true);
            finalise.complete();
          },
          error => {
            this.runErrorHandler(error, value);
            finalise.next(true);
            finalise.complete();
          }
        );
    }
  }

  load(construct?: () => Observable<T>) {
    if (construct) {
      this.functions.construct = construct;
    }
    if (this.functions.construct) {
      const observables = this.observables;
      const next = this.next;
      next(observables.loading$, true, 'loading$');
      next(observables.loaded$, false, 'loaded$');
      next(observables.hasError$, false);
      next(observables.error$, undefined);
      this.unsubscribe();
      this.subscription = this.functions.construct().subscribe(
        item => {
          this.nextValue(item);
          observables.loaded$.next(true);
          observables.loading$.next(false);
        },
        error => {
          this.runErrorHandler(error);
        }
      );
    }
  }

  reset(value?: T) {
    const observables = this.observables;
    const next = this.next;
    next(observables.loaded$, false);
    next(observables.loading$, false);
    next(observables.hasError$, false);
    next(observables.error$, undefined);
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
    const observables = this.observables;
    observables.instance$.complete();
    const complete = this.complete;
    complete(observables.loading$);
    complete(observables.loaded$);
    complete(observables.saving$);
    complete(observables.saved$);
    complete(observables.deleting$);
    complete(observables.deleted$);
    complete(observables.error$);
    complete(observables.hasError$);
    this.unsubscribe();
  }

  private complete(bs: BehaviorSubject<any>) {
    if (bs) {
      bs.complete();
    }
  }

  private runErrorHandler(error: any, value?: T) {
    const observables = this.observables;
    const errorMsg =
      (this.functions.errorHandler ? this.functions.errorHandler(error, value) : this.genericError) ||
      this.genericError ||
      (globalConfig.errorHandler ? globalConfig.errorHandler(this.id, error, value) : globalConfig.genericError) ||
      globalConfig.genericError;
    if (observables.error$) {
      observables.error$.next(errorMsg);
    } else {
      observables.error$ = new BehaviorSubject<string>(errorMsg);
    }
    if (observables.hasError$) {
      observables.hasError$.next(true);
    } else {
      observables.hasError$ = new BehaviorSubject<boolean>(true);
    }
    const next = this.next;
    next(observables.loaded$, false);
    next(observables.loading$, false);
    next(observables.saved$, false);
    next(observables.saving$, false);
    next(observables.deleting$, false);
    next(observables.deleted$, false);
  }
}
