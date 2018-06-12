# RxCache

RxCache is a light weight RxJs Behavior Subject based cache designed as a replacement to Redux style stores. It offers much simpler to grasp ways of achieving push based data flow to your components with hardly any boiler plate code at all.

[Testbed on StackBlitz](https://stackblitz.com/edit/angular-3yqpfe)

## Usage

npm install --save ngx-rxcache

Inject the service into your service.

```javascript
import { Injectable } from '@angular/core';
import { RxCacheService, RxCacheItem } from 'ngx-rxcache';

@Injectable()
export class YourService {
  constructor(public cache: RxCacheService) {
    this.item = cache.config({ id: 'key', construct: functionThatReturnsObservableOfYourType });
    // or
    this.item = cache.config({ id: 'key', initialValue : instanceOfYourType });
  }

  item: RxCacheItem<any>;

  data$ = this.item.value$;

  update = (value) => { this.item.update(value); };
}
```

The config method takes in an object with the interface

```javascript
export interface RxCacheItemConfig<T> {
  id: string; // A unique string that is used to identify and retrive the item from the cache
  construct?: () => Observable<T>; // An optional constructor function that returns an observable of your type
  persist?: (val: T) => Observable<any>; // An optional save function that persists the current instance
  saved?: (val: any) => void; // An optional save callback function that is called after the persist method succeeds
  load?: boolean; // An optional flag to call the constructor function as soon as the item is created
  autoload?: boolean; // An optional flag to call the constructor function when the value$ accessor property is called if it is not already loaded
  localStorage?: boolean; // A optional flag to persist the value in localStorage to survive across browser sessions
  sessionStorage?: boolean; // An optional flag to persist the value in sessionStorage to survive browser refresh
  initialValue?: T; // An optional initial value for the item
  genericError?: string; // An optional generic error message to be returned on persist and construct failures
  errorHandler?: (id: string, error?: any) => string; // An error handler to be run on persist and construct failures, if it returns a string it will be used as the error message
}
```

A cache item is a simple light weight object the consists of an instance behaviour subject and optional behaviour subjects to signal if loading, loaded, saving, saved, and error states that the item may be in.

```javascript
cache.config({ id: 'key' });
```
Will return a cache item that only has the behaviour subject initialised with it's value set to undefined.
