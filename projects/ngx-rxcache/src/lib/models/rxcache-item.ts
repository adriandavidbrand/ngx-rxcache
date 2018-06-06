import { Observable, BehaviorSubject, Subscription } from "rxjs";

export interface RxCacheItem<T> {
  id: string;
  instance$: BehaviorSubject<T>;
  loaded$: BehaviorSubject<boolean>;
  loading$: BehaviorSubject<boolean>;
  saving$: BehaviorSubject<boolean>;
  saved$: BehaviorSubject<boolean>;
  hasError$: BehaviorSubject<boolean>;
  error$: BehaviorSubject<string>;
  genericError: string
  construct?: () => Observable<T>;
  persist?: (val: T) => Observable<any>;
  saved?: (val: any) => void;
  errorHandler: (id: string, error?: any) => string;
  subscription: Subscription;
}
