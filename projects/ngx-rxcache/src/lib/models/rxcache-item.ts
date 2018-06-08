import { Observable, BehaviorSubject, Subscription } from "rxjs";

import { RxCacheItemConfig } from "./rxcache-item-config";
import { globalConfig } from './global-config';

export class RxCacheItem<T> {
  constructor (config: RxCacheItemConfig<T>) {
    this.id = config.id;
    this.instance$ = new BehaviorSubject<T>(config.initialValue);
    this.configure(config);
  }

  configure(config: RxCacheItemConfig<T>) {
    const hasInitialValue = typeof config.initialValue !== 'undefined';
    const hasValue = typeof this.instance$.getValue() !== 'undefined';
    if (hasInitialValue && !hasValue) {
      this.instance$.next(config.initialValue);
      if (this._loaded$) {
        this._loaded$.next(true);
      }
    }

    this.genericError = config.genericError || this.genericError;
    this.construct = config.construct || this.construct;
    this.persist = config.persist || this.persist;
    this.saved = config.saved || this.saved;
    this.errorHandler = config.errorHandler || this.errorHandler;

    if (config.construct && this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    if (config.load) {
      this.refresh();
    }
  }

  id: string;

  private instance$: BehaviorSubject<T>;
  get value$(): BehaviorSubject<T> {
    if (this.construct && !this.loaded$.getValue()) {
      this.refresh();
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

  private genericError: string;
  private construct?: () => Observable<T>;
  private persist?: (val: T) => Observable<any>;
  private saved?: (val: any) => void;
  private errorHandler: (error?: any) => string;
  private subscription: Subscription;

  private next<T>(bs: BehaviorSubject<T>, value: T) {
    if (bs) {
      bs.next(value);
    }
  }

  update(value) {
    this.instance$.next(value);
    this.next(this._hasError$, false);
    this.next(this._error$, undefined);
    this.next(this._loaded$, true);
    this.next(this._loading$, false);
  }

  save<T>(saved?: (val: any) => void) {
    if (this.persist) {
      this.saving$.next(true);
      this.saved$.next(false);
      this.persist(this.instance$.getValue()).subscribe(val => {
        if (saved) {
          saved(val);
        }
        if (this.saved) {
          this.saved(val);
        }
        this._saved$.next(true);
        this._saving$.next(false);
      }, (error) => { this.runErrorHandler(error); });
    }
  }

  reload(construct: () => Observable<T>) {
    this.next(this.loaded$, false);
    this.next(this.loading$, true);
    this.next(this.hasError$, false);
    this.next(this.error$, undefined);
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.subscription = construct().subscribe(
      item => {
        this.instance$.next(item);
        this.next(this.loaded$, true);
        this.next(this.loading$, false);
      }, (error) => { this.runErrorHandler(error); }
    );
  }

  reset() {
    this.next(this.loaded$, false);
    this.next(this.loading$, false);
    this.next(this.hasError$, false);
    this.next(this.error$, undefined);
    this.instance$.next(undefined);
    this.unsubscribeItem();
  }

  unsubscribe() {
    this.unsubscribeItem();
  }

  private unsubscribeItem() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  finish() {
    this.instance$.complete();
    this.complete(this._loading$);
    this.complete(this._loaded$);
    this.complete(this._error$);
    this.complete(this._hasError$);
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private complete(bs: BehaviorSubject<any>) {
    if (bs) {
      bs.complete();
    }
  }

  refresh() {
    if (this.construct) {
      this.loading$.next(true);
      this.next(this.loaded$, false);
      this.next(this.hasError$, false);
      this.next(this.error$, undefined);
      if (this.subscription) {
        this.subscription.unsubscribe();
      }
      this.subscription = this.construct().subscribe(
        item => {
          this.instance$.next(item);
          this.next(this.loaded$, true);
          this.next(this.loading$, false);
        }, (error) => { this.runErrorHandler(error); }
      );
    }
  }

  private runErrorHandler(error: any) {
    this.error$.next((this.errorHandler ? this.generateErrorMessage(error) : this.genericError) || globalConfig.genericError);
    this.loaded$.next(false);
    this.loading$.next(false);
    this.hasError$.next(true);
  }

  private generateErrorMessage(error: any): string {
    return this.errorHandler(error) || this.genericError || globalConfig.genericError;
  }
}
