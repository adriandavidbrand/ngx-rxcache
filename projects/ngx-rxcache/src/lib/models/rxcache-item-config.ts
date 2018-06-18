import { Observable } from "rxjs";

export interface RxCacheItemConfig<T> {
  id: string;
  construct?: () => Observable<T>;
  persist?: (value: T) => Observable<any>;
  saved?: (response: any, value?: T) => void;
  stringify?: (value: T) => any;
  parse?: (value: any) => T;
  load?: boolean;
  autoload?: boolean;
  localStorage?: boolean;
  sessionStorage?: boolean;
  initialValue?: T;
  genericError?: string;
  errorHandler?: (error: any, value?: T) => string;
}
