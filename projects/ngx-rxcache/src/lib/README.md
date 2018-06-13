# RxCache

RxCache is a light weight RxJs Behavior Subject based cache designed as a replacement to Redux style stores. It offers much simpler to grasp ways of achieving push based data flow to your components with hardly any boiler plate code at all.

[Testbed on StackBlitz](https://stackblitz.com/edit/angular-3yqpfe)

[A redo of the official ngrx example app can be seen here StackBlitz](https://stackblitz.com/edit/github-tsrf1f)

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

A cache item is a simple light weight object that consists of an instance behaviour subject and optional behaviour subjects to signify the loading, loaded, saving, saved, and error states the item may be in.

```javascript
cache.config({ id: 'key' });
```
Will return a cache item that only has the instance behaviour subject initialised with it's value set to undefined.

```javascript
cache.config({ id: 'key', initialValue: 'Hello' });
```
Will return a cache item that only has the instance behaviour subject initialised with it's value set to a string 'Hello'.

```javascript
cache.config({ id: 'key', construct: () => of('Hello').pipe(delay(1000)) });
```
Will return a cache item that only has the instance behaviour subject initialised with it's value set to undefined. Once the load method is called the construct function will be called and the loading$ and loaded$ behaviour subjects will be initiased with true and false respectively. After the one second delay the instance behavior subject will be set to 'Hello', loading$ will be false$ and loaded will be true.

```javascript
cache.config({ id: 'key', construct: () => of('Hello').pipe(delay(1000)), load: true });
```
Will call the load function as the object is created. For the first second, instance is undefined, loading$ is true and loaded$ is false. Once the construct function is finished the instance is 'Hello', loading$ is false and loaded$ is true.

```javascript
cache.config({ id: 'key', construct: () => of('Hello').pipe(delay(1000)), autoload: true });
```
Will cause the load function to be called when the instance behaviour subject's accessor property value$ is acceessed if the item has not been loaded.

```javascript
cache.config({ id: 'key', construct: () => throwError('An error occoured')), load: true });
```
Will cause an error when constructing the object, the instance behaviour subject will be undefined, loading$ will be false, loaded$ will be false, hasError$ will be true and error$ will be 'An error has occoured', the global eneric error message.

```javascript
cache.config({ id: 'key', genericError: 'Oops', construct: () => throwError('An error occoured')), load: true });
```
Will cause an error when constructing the object, error$ will be 'Oops'.

```javascript
cache.config({ id: 'key', construct: () => throwError('An error occoured')), load: true, errorHandler: (id: string, error: any) => `Item with id '${id}' failed with the error: ${error}` });
```
Will cause an error when constructing the object, error$ will be "Item with id 'key' failed with the error: An error occoured".
