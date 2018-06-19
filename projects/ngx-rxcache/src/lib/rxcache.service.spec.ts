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

  it('should unsubscribe from constructor on update', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      load: true,
      construct: () => of(10).pipe(delay(5))
    });
    cacheItem.update(5);
    setTimeout(() => {
      expect(cacheItem.value$.getValue()).toEqual(5);
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

  it('should save non updated value', inject([RxCacheService], (service: RxCacheService) => {
    let test;
    const cacheItem = service.get({
      id: 'test',
      persist: (val) => { test = val; return of('Ok'); }
    });
    cacheItem.save(10);
    expect(test).toEqual(10);
  }));

  it('should save non updated value and run callback function', inject([RxCacheService], (service: RxCacheService) => {
    let test;
    let message;
    const cacheItem = service.get({
      id: 'test',
      persist: (val) => { test = val; return of('Ok'); }
    });
    cacheItem.save(10, (response, value) => { message = `Server responded with ${response} and value was ${value}`; });
    expect(message).toEqual('Server responded with Ok and value was 10');
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
    const cacheItem = service.get({
      id: 'test',
      load: true,
      errorHandler: (error: any) => `${error}`,
      construct: () => throwError('Fail')
    });
    expect(cacheItem.error$.getValue()).toEqual('Fail');
  }));

  it('should error with global error handler', inject([RxCacheService], (service: RxCacheService) => {
    service.errorHandler((id, error, value) => `Item with id: '${id}' caused error: '${error}' and had value '${value}'`);
    const cacheItem = service.get({
      id: 'test',
      load: true,
      construct: () => throwError('Fail')
    });
    service.errorHandler(undefined);
    expect(cacheItem.error$.getValue()).toEqual(`Item with id: 'test' caused error: 'Fail' and had value 'undefined'`);
  }));

  it('should get value from localStorage', inject([RxCacheService], (service: RxCacheService) => {
    const id = 'test';
    localStorage.setItem(id, '10');
    const cacheItem = service.get({
      id: id
    });
    localStorage.removeItem(id);
    expect(cacheItem.value$.getValue()).toEqual(10);
  }));

  it('should save value to localStorage', inject([RxCacheService], (service: RxCacheService) => {
    const id = 'test';
    const cacheItem = service.get({
      id: id,
      localStorage: true
    });
    cacheItem.update(10);
    const localStorageItem = localStorage.getItem(id);
    localStorage.removeItem(id);
    expect(localStorageItem).toEqual('10');
  }));

  it('should parse localStorage item', inject([RxCacheService], (service: RxCacheService) => {
    const id = 'test';
    const date = new Date();
    localStorage.setItem(id, JSON.stringify(date.getTime()));
    const cacheItem = service.get({
      id: id,
      localStorage: true,
      parse: (val) => new Date(val)
    });
    localStorage.removeItem(id);
    expect(cacheItem.value$.getValue().getTime()).toEqual(date.getTime());
  }));

  it('should stringify localStorage item', inject([RxCacheService], (service: RxCacheService) => {
    const id = 'test';
    const cacheItem = service.get({
      id: id,
      localStorage: true,
      stringify: (val: Date) => val.getTime()
    });
    const date = new Date();
    cacheItem.update(date);
    const localStorageItem = localStorage.getItem(id);
    localStorage.removeItem(id);
    expect(localStorageItem).toEqual(JSON.stringify(date.getTime()));
  }));

  it('should get value from sessionStorage', inject([RxCacheService], (service: RxCacheService) => {
    const id = 'test';
    sessionStorage.setItem(id, '10');
    const cacheItem = service.get({
      id: id
    });
    sessionStorage.removeItem(id);
    expect(cacheItem.value$.getValue()).toEqual(10);
  }));

  it('should save value to sessionStorage', inject([RxCacheService], (service: RxCacheService) => {
    const id = 'test';
    const cacheItem = service.get({
      id: id,
      sessionStorage: true
    });
    cacheItem.update(10);
    const sessionStorageItem = sessionStorage.getItem(id);
    sessionStorage.removeItem(id);
    expect(sessionStorageItem).toEqual('10');
  }));

  it('should parse sessionStorage item', inject([RxCacheService], (service: RxCacheService) => {
    const id = 'test';
    const date = new Date();
    sessionStorage.setItem(id, JSON.stringify(date.getTime()));
    const cacheItem = service.get({
      id: id,
      sessionStorage: true,
      parse: (val) => new Date(val)
    });
    sessionStorage.removeItem(id);
    expect(cacheItem.value$.getValue().getTime()).toEqual(date.getTime());
  }));

  it('should stringify sessionStorage item', inject([RxCacheService], (service: RxCacheService) => {
    const id = 'test';
    const cacheItem = service.get({
      id: id,
      sessionStorage: true,
      stringify: (val: Date) => val.getTime()
    });
    const date = new Date();
    cacheItem.update(date);
    const sessionStorageItem = sessionStorage.getItem(id);
    sessionStorage.removeItem(id);
    expect(sessionStorageItem).toEqual(JSON.stringify(date.getTime()));
  }));
});
