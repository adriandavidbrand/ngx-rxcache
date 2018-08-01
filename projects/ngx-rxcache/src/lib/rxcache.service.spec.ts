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
    expect(cacheItem.value).toEqual(10);
  }));

  it('clone$ should copy property', inject([RxCacheService], (service: RxCacheService) => {
    const obj = { prop1: 'prop1' };
    const cacheItem = service.get({
      id: 'test',
      initialValue: obj
    });
    let clone;
    const subscription = cacheItem.clone$.subscribe(item => {
      clone = item;
    });
    subscription.unsubscribe();
    expect(cacheItem.value.prop1).toEqual(clone.prop1);
  }));

  it('clone should not be the same instance', inject([RxCacheService], (service: RxCacheService) => {
    const obj = { prop1: 'prop1' };
    const cacheItem = service.get({
      id: 'test',
      initialValue: obj
    });
    let clone;
    const subscription = cacheItem.clone$.subscribe(item => {
      clone = item;
    });
    subscription.unsubscribe();
    expect(cacheItem.value === clone).toBeFalsy();
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
    expect(cacheItem.value).toEqual(10);
  }));

  it('should update item', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test'
    });
    cacheItem.update(10);
    expect(cacheItem.value).toEqual(10);
  }));

  it(`shouldn't be loaded`, inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      construct: () => of(10)
    });
    expect(cacheItem.loaded).toBeFalsy();
  }));

  it('should load item', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      construct: () => of(10)
    });
    cacheItem.load();
    expect(cacheItem.value).toEqual(10);
  }));

  it('should be loaded', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      construct: () => of(10)
    });
    cacheItem.load();
    expect(cacheItem.loaded).toBeTruthy();
  }));

  it('should be loading for 5ms', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      load: true,
      construct: () => of(10).pipe(delay(5))
    });
    expect(cacheItem.loading).toBeTruthy();
  }));

  it('should be not be loaded for 5ms', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      load: true,
      construct: () => of(10).pipe(delay(5))
    });
    expect(cacheItem.loaded).toBeFalsy();
  }));

  it('should not be loading after 5ms', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      load: true,
      construct: () => of(10).pipe(delay(5))
    });
    setTimeout(() => {
      expect(cacheItem.loading).toBeFalsy();
    }, 6);
  }));

  it('should be loaded after 5ms', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      load: true,
      construct: () => of(10).pipe(delay(5))
    });
    setTimeout(() => {
      expect(cacheItem.loaded).toBeTruthy();
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
      expect(cacheItem.value).toEqual(5);
    }, 6);
  }));

  it('should be saving for 5ms', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      save: val => of(val).pipe(delay(5))
    });
    cacheItem.save();
    expect(cacheItem.saving).toBeTruthy();
  }));

  it('should be not be saved for 5ms', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      save: val => of(val).pipe(delay(5))
    });
    cacheItem.save();
    expect(cacheItem.saved).toBeFalsy();
  }));

  it('should not be saving after 5ms', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      save: val => of(val).pipe(delay(5))
    });
    cacheItem.save();
    setTimeout(() => {
      expect(cacheItem.saving).toBeFalsy();
    }, 6);
  }));

  it('should be saved after 5ms', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      save: val => of(val).pipe(delay(5))
    });
    cacheItem.save();
    setTimeout(() => {
      expect(cacheItem.saved).toBeTruthy();
    }, 6);
  }));

  it('should run saved', inject([RxCacheService], (service: RxCacheService) => {
    let test;
    const cacheItem = service.get({
      id: 'test',
      initialValue: 10,
      save: val => of(val),
      saved: val => {
        test = val;
      }
    });
    cacheItem.save();
    expect(test).toEqual(10);
  }));

  it('should run custom saved', inject([RxCacheService], (service: RxCacheService) => {
    let test;
    const cacheItem = service.get({
      id: 'test',
      initialValue: 10,
      save: val => of(val)
    });
    cacheItem.save(val => {
      test = val;
    });
    expect(test).toEqual(10);
  }));

  it('should run save', inject([RxCacheService], (service: RxCacheService) => {
    let test;
    const cacheItem = service.get({
      id: 'test',
      save: val => {
        test = val;
        return of('Ok');
      }
    });
    cacheItem.save(10);
    expect(test).toEqual(10);
  }));

  it('should run save and callback function', inject([RxCacheService], (service: RxCacheService) => {
    let test;
    let message;
    const cacheItem = service.get({
      id: 'test',
      save: val => {
        test = val;
        return of('Ok');
      }
    });
    cacheItem.save(10, (response, value) => {
      message = `Server responded with ${response} and value was ${value}`;
    });
    expect(message).toEqual('Server responded with Ok and value was 10');
  }));

  it('should be deleting for 5ms', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      delete: val => of(val).pipe(delay(5))
    });
    cacheItem.delete();
    expect(cacheItem.deleting).toBeTruthy();
  }));

  it('should be not be deleted for 5ms', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      delete: val => of(val).pipe(delay(5))
    });
    cacheItem.delete();
    expect(cacheItem.deleted).toBeFalsy();
  }));

  it('should not be deleting after 5ms', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      delete: val => of(val).pipe(delay(5))
    });
    cacheItem.delete();
    setTimeout(() => {
      expect(cacheItem.deleting).toBeFalsy();
    }, 6);
  }));

  it('should be deleted after 5ms', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      delete: val => of(val).pipe(delay(5))
    });
    cacheItem.delete();
    setTimeout(() => {
      expect(cacheItem.deleted).toBeTruthy();
    }, 6);
  }));

  it('should run deleted', inject([RxCacheService], (service: RxCacheService) => {
    let test;
    const cacheItem = service.get({
      id: 'test',
      initialValue: 10,
      delete: val => of(val),
      deleted: (response, val) => {
        test = val;
      }
    });
    cacheItem.delete();
    expect(test).toEqual(10);
  }));

  it('should run custom deleted', inject([RxCacheService], (service: RxCacheService) => {
    let test;
    const cacheItem = service.get({
      id: 'test',
      initialValue: 10,
      delete: val => of(val)
    });
    cacheItem.delete((response, val) => {
      test = val;
    });
    expect(test).toEqual(10);
  }));

  it('should run delete', inject([RxCacheService], (service: RxCacheService) => {
    let test;
    const cacheItem = service.get({
      id: 'test',
      delete: val => {
        test = val;
        return of('Ok');
      }
    });
    cacheItem.delete(10);
    expect(test).toEqual(10);
  }));

  it('should run delete and callback function', inject([RxCacheService], (service: RxCacheService) => {
    let test;
    let message;
    const cacheItem = service.get({
      id: 'test',
      delete: val => {
        test = val;
        return of('Ok');
      }
    });
    cacheItem.delete(10, (response, value) => {
      message = `Server responded with ${response} and value was ${value}`;
    });
    expect(message).toEqual('Server responded with Ok and value was 10');
  }));

  it('should reload item', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test'
    });
    cacheItem.load(() => of(10));
    expect(cacheItem.value).toEqual(10);
  }));

  it('should error with generic error message', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      load: true,
      construct: () => throwError('Fail')
    });
    expect(cacheItem.error).toEqual('An error has occoured');
  }));

  it('should error with generic custom message', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      load: true,
      genericError: 'I failed',
      construct: () => throwError('Fail')
    });
    expect(cacheItem.error).toEqual('I failed');
  }));

  it('should error with error handler', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      load: true,
      errorHandler: (error: any) => `${error}`,
      construct: () => throwError('Fail')
    });
    expect(cacheItem.error).toEqual('Fail');
  }));

  it('should error with global error handler', inject([RxCacheService], (service: RxCacheService) => {
    service.errorHandler(
      (id, error, value) => `Item with id: '${id}' caused error: '${error}' and had value '${value}'`
    );
    const cacheItem = service.get({
      id: 'test',
      load: true,
      construct: () => throwError('Fail')
    });
    service.errorHandler(undefined);
    expect(cacheItem.error).toEqual(`Item with id: 'test' caused error: 'Fail' and had value 'undefined'`);
  }));

  it('should get value from localStorage', inject([RxCacheService], (service: RxCacheService) => {
    const id = 'test';
    localStorage.setItem(id, '10');
    const cacheItem = service.get({
      id: id
    });
    localStorage.removeItem(id);
    expect(cacheItem.value).toEqual(10);
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
      parse: val => new Date(val)
    });
    localStorage.removeItem(id);
    expect(cacheItem.value.getTime()).toEqual(date.getTime());
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
    expect(cacheItem.value).toEqual(10);
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
      parse: val => new Date(val)
    });
    sessionStorage.removeItem(id);
    expect(cacheItem.value.getTime()).toEqual(date.getTime());
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

  it('should not be expired', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      initialValue: 10,
      expires: 5 / 60000 //5ms in minutes
    });
    expect(cacheItem.value).toEqual(10);
  }));

  it('should be expired after 5ms', inject([RxCacheService], (service: RxCacheService) => {
    const cacheItem = service.get({
      id: 'test',
      initialValue: 10,
      expires: 5 / 60000 //5ms in minutes
    });
    setTimeout(() => {
      expect(cacheItem.value).toBeUndefined();
    }, 6);
  }));
});
