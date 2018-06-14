import { TestBed, inject } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

import { RxCacheService } from './rxcache.service';

describe('RxCacheService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RxCacheService]
    });
  });

  it('should be created', inject([RxCacheService], (service: RxCacheService) => {
    expect(service).toBeTruthy();
  }));

  it('should not exist', inject([RxCacheService], (service: RxCacheService) => {
    expect(service.exists('test')).toBeFalsy();
  }));

  it('should exist', inject([RxCacheService], (service: RxCacheService) => {
    service.get({ id: 'test' });
    expect(service.exists('test')).toBeTruthy();
  }));

  it('should equal initial value', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      initialValue: 10
    });
    expect(cacheItem.value$.getValue()).toEqual(10);
  }));

  it('deleted item should not exist', inject([RxCacheService], (service: RxCacheService) => {
    service.get({
      id: 'test'
    });
    service.delete('test');
    expect(service.exists('test')).toBeFalsy();
  }));

  it('should autoload item from constructor function', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      autoload: true,
      construct: () => of(10)
    });
    expect(cacheItem.value$.getValue()).toEqual(10);
  }));

  it('should update item', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test'
    });
    cacheItem.update(10);
    expect(cacheItem.value$.getValue()).toEqual(10);
  }));

  it(`shouldn't be loaded`, inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      construct: () => of(10)
    });
    expect(cacheItem.loaded$.getValue()).toBeFalsy();
  }));

  it('should load item', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      construct: () => of(10)
    });
    cacheItem.load();
    expect(cacheItem.value$.getValue()).toEqual(10);
  }));

  it('should be loaded', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      construct: () => of(10)
    });
    cacheItem.load();
    expect(cacheItem.loaded$.getValue()).toBeTruthy();
  }));

  it('should be loading for 5ms', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      load: true,
      construct: () => of(10).pipe(delay(5))
    });
    expect(cacheItem.loading$.getValue()).toBeTruthy();
  }));

  it('should be not be loaded for 5ms', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      load: true,
      construct: () => of(10).pipe(delay(5))
    });
    expect(cacheItem.loaded$.getValue()).toBeFalsy();
  }));

  it('should not be loading after 5ms', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      load: true,
      construct: () => of(10).pipe(delay(5))
    });
    setTimeout(() => {
      expect(cacheItem.loading$.getValue()).toBeFalsy();
    }, 6);
  }));

  it('should be loaded after 5ms', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      load: true,
      construct: () => of(10).pipe(delay(5))
    });
    setTimeout(() => {
      expect(cacheItem.loaded$.getValue()).toBeTruthy();
    }, 6);
  }));

  it('should be saving for 5ms', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      persist: (val) => of(val).pipe(delay(5))
    });
    cacheItem.save();
    expect(cacheItem.saving$.getValue()).toBeTruthy();
  }));

  it('should be not be saved for 5ms', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      persist: (val) => of(val).pipe(delay(5))
    });
    cacheItem.save();
    expect(cacheItem.saved$.getValue()).toBeFalsy();
  }));

  it('should not be saving after 5ms', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      persist: (val) => of(val).pipe(delay(5))
    });
    cacheItem.save();
    setTimeout(() => {
      expect(cacheItem.saving$.getValue()).toBeFalsy();
    }, 6);
  }));

  it('should be saved after 5ms', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      persist: (val) => of(val).pipe(delay(5))
    });
    cacheItem.save();
    setTimeout(() => {
      expect(cacheItem.saved$.getValue()).toBeTruthy();
    }, 6);
  }));

  it('should run saved', inject([RxCacheService], (service: RxCacheService) => {
    let test;
    const cacheItem = service.get({
      id: 'test',
      initialValue: 10,
      persist: (val) => of(val),
      saved: (val) => { test = val; }
    });
    cacheItem.save();
    expect(test).toEqual(10);
  }));

  it('should run custom saved', inject([RxCacheService], (service: RxCacheService) => {
    let test;
    const cacheItem = service.get({
      id: 'test',
      initialValue: 10,
      persist: (val) => of(val)
    });
    cacheItem.save((val) => { test = val; });
    expect(test).toEqual(10);
  }));

  it('should reload item', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test'
    });
    cacheItem.load(() => of(10));
    expect(cacheItem.value$.getValue()).toEqual(10);
  }));

  it('should error with generic error message', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      load: true,
      construct: () => throwError('Fail')
    });
    expect(cacheItem.error$.getValue()).toEqual('An error has occoured');
  }));

  it('should error with generic custom message', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      load: true,
      genericError: 'I failed',
      construct: () => throwError('Fail')
    });
    expect(cacheItem.error$.getValue()).toEqual('I failed');
  }));

  it('should error with error handler', inject([RxCacheService], (service: RxCacheService) => {
    const id = 'test';
    const cacheItem = service.get({
      id: id,
      load: true,
      errorHandler: (id: string, error: any) => `${id} ${error}`,
      construct: () => throwError('Fail')
    });
    expect(cacheItem.error$.getValue()).toEqual(`${cacheItem.id} Fail`);
  }));
});
