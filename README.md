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
