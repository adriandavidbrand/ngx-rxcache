import { Observable } from "rxjs";

export interface RxCacheItemConfig<T> {
    id: string;
    construct?: () => Observable<T>;
    load?: boolean;    
    initialValue?: T;
    genericError?: string;
    errorHandler?: (id: string, error?: any) => string;
}