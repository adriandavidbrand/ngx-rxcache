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
    this.configure(config);
  }

  id: string;
  private subscription: Subscription;
  private autoload: boolean;
  private localStorage: boolean;
  private sessionStorage: boolean;
  private genericError: string;

  private functions: {
    construct: () => Observable<T>;
    save: (value: T) => Observable<any>;
    saved: (response: any, value?: T) => void;
    delete: (value: T) => Observable<any>;
    deleted: (response: any, value?: T) => void;
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
    clone$: Observable<T>;
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
    clone$: undefined,
    loaded$: undefined,
    loading$: undefined,
    saving$: undefined,
    saved$: undefined,
    deleting$: undefined,
    deleted$: undefined,
    hasError$: undefined,
    error$: undefined
  };

  get value$(): Observable<T> {
    this.tryAutoload();
    return this.observables.instance$;
  }

  get value(): T {
    this.tryAutoload();
    return this.observables.instance$.getValue();
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

  private createBehaviorSubject<BehaviorSubjectType>(
    property: string,
    initialValue?: BehaviorSubjectType
  ): BehaviorSubject<BehaviorSubjectType> {
    const behaviorSubject = this.observables[property];
    if (!behaviorSubject) {
      return this.observables[property] = new BehaviorSubject<BehaviorSubjectType>(initialValue);
    }
    return behaviorSubject;
  }

  get loaded$(): Observable<boolean> {
    return this.createBehaviorSubject<boolean>('loaded$', false);
  }

  get loaded(): boolean {
    return this.createBehaviorSubject<boolean>('loaded$', false).getValue();
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
  }

  update(value: T) {
    this.unsubscribe();
    this.nextValue(value);
    const observables = this.observables;
    this.next(observables.hasError$, false);
    this.next(observables.error$, undefined);
    this.next(observables.loaded$, typeof value !== 'undefined');
    this.next(observables.loading$, false);
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
      this.next(observables.saving$, true, 'saving$');
      this.next(observables.saved$, false, 'saved$');
      this.next(observables.hasError$, false);
      this.next(observables.error$, undefined);
      const finalise = new Subject<void>();
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
            finalise.next();
            finalise.complete();
          },
          error => {
            this.runErrorHandler(error, value);
            finalise.next();
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
      this.next(observables.deleting$, true, 'deleting$');
      this.next(observables.deleted$, false, 'deleted$');
      this.next(observables.hasError$, false);
      this.next(observables.error$, undefined);
      const finalise = new Subject<void>();
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
            finalise.next();
            finalise.complete();
          },
          error => {
            this.runErrorHandler(error, value);
            finalise.next();
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
      this.next(observables.loading$, true, 'loading$');
      this.next(observables.loaded$, false, 'loaded$');
      this.next(observables.hasError$, false);
      this.next(observables.error$, undefined);
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

  unsubscribe() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  reset(value?: T) {
    this.unsubscribe();
    const observables = this.observables;
    this.next(observables.loaded$, false);
    this.next(observables.loading$, false);
    this.next(observables.hasError$, false);
    this.next(observables.error$, undefined);
    this.nextValue(value);
  }

  finish() {
    this.unsubscribe();
    const observables = this.observables;
    observables.instance$.complete();
    this.complete(observables.loading$);
    this.complete(observables.loaded$);
    this.complete(observables.saving$);
    this.complete(observables.saved$);
    this.complete(observables.deleting$);
    this.complete(observables.deleted$);
    this.complete(observables.error$);
    this.complete(observables.hasError$);
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
    this.next(observables.loaded$, false);
    this.next(observables.loading$, false);
    this.next(observables.saved$, false);
    this.next(observables.saving$, false);
    this.next(observables.deleting$, false);
    this.next(observables.deleted$, false);
  }
}
