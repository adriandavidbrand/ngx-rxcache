import { Observable } from "rxjs";

export interface RxCacheItemConfig<T> {
  id: string;
  construct?: () => Observable<T>;
  persist?: (val: T) => Observable<any>;
  saved?: (val: any) => void;
  load?: boolean;
  initialValue?: T;
  genericError?: string;
  errorHandler?: ( id: string, error?: any ) => string;
}
