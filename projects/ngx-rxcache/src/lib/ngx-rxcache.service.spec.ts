import { TestBed, inject } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

import { NgxRxcacheService } from './ngx-rxcache.service';

describe('NgxRxcacheService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NgxRxcacheService]
    });
  });

  it('should be created', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    expect(service).toBeTruthy();
  }));

  it('should not exist', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    expect(service.exists('test')).toBeFalsy();
  }));

  it('should exist', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    service.config({ id: 'test' });
    expect(service.exists('test')).toBeTruthy();
  }));

  it('should equal initial value', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    const cacheItem = service.config({
      id: 'test',
      initialValue: 10
    });
    expect(cacheItem.value$.getValue()).toEqual(10);
  }));

  it('deleted item should not exist', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    service.config({
      id: 'test'
    });
    service.delete('test');
    expect(service.exists('test')).toBeFalsy();
  }));

  it('non existing item', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    expect(service.exists(`Does't Exist`)).toBeFalsy();
  }));

  it('should generate item from constructor function', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    const cacheItem = service.config({
      id: 'test',
      construct: () => of(10)
    });
    expect(cacheItem.value$.getValue()).toEqual(10);
  }));

  it('should update item', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    const cacheItem = service.config({
      id: 'test'
    });
    cacheItem.update(10);
    expect(cacheItem.value$.getValue()).toEqual(10);
  }));

  it('should refresh item', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    let val = 0;
    const cacheItem = service.config({
      id: 'test',
      construct: () => of(val)
    });
    val = 1;
    cacheItem.refresh();
    expect(cacheItem.value$.getValue()).toEqual(val);
  }));

  it('should be loading for 5ms', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    const cacheItem = service.config({
      id: 'test',
      load: true,
      construct: () => of(10).pipe(delay(5))
    });
    expect(cacheItem.loading$.getValue()).toBeTruthy();
  }));

  it('should be not be loaded for 5ms', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    const cacheItem = service.config({
      id: 'test',
      load: true,
      construct: () => of(10).pipe(delay(5))
    });
    expect(cacheItem.loaded$.getValue()).toBeFalsy();
  }));

  it('should not be loading after 5ms', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    const cacheItem = service.config({
      id: 'test',
      load: true,
      construct: () => of(10).pipe(delay(5))
    });
    setTimeout(() => {
      expect(cacheItem.loading$.getValue()).toBeFalsy();
    }, 6);
  }));

  it('should be loaded after 5ms', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    const cacheItem = service.config({
      id: 'test',
      load: true,
      construct: () => of(10).pipe(delay(5))
    });
    setTimeout(() => {
      expect(cacheItem.loaded$.getValue()).toBeTruthy();
    }, 6);
  }));

  it('should be saving for 5ms', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    const cacheItem = service.config({
      id: 'test',
      persist: (val) => of(val).pipe(delay(5))
    });
    cacheItem.save();
    expect(cacheItem.saving$.getValue()).toBeTruthy();
  }));

  it('should be not be saved for 5ms', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    const cacheItem = service.config({
      id: 'test',
      persist: (val) => of(val).pipe(delay(5))
    });
    cacheItem.save();
    expect(cacheItem.saved$.getValue()).toBeFalsy();
  }));

  it('should not be saving after 5ms', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    const cacheItem = service.config({
      id: 'test',
      persist: (val) => of(val).pipe(delay(5))
    });
    cacheItem.save();
    setTimeout(() => {
      expect(cacheItem.saving$.getValue()).toBeFalsy();
    }, 6);
  }));

  it('should be saved after 5ms', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    const cacheItem = service.config({
      id: 'test',
      persist: (val) => of(val).pipe(delay(5))
    });
    cacheItem.save();
    setTimeout(() => {
      expect(cacheItem.saved$.getValue()).toBeTruthy();
    }, 6);
  }));

  it('should run saved', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    let test;
    const cacheItem = service.config({
      id: 'test',
      initialValue: 10,
      persist: (val) => of(val),
      saved: (val) => { test = val; }
    });
    cacheItem.save();
    expect(test).toEqual(10);
  }));

  it('should run custom saved', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    let test;
    const cacheItem = service.config({
      id: 'test',
      initialValue: 10,
      persist: (val) => of(val)
    });
    cacheItem.save((val) => { test = val; });
    expect(test).toEqual(10);
  }));

  it('should reload item', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    const cacheItem = service.config({
      id: 'test'
    });
    cacheItem.reload(() => of(10));
    expect(cacheItem.value$.getValue()).toEqual(10);
  }));

  it('should error with generic error message', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    const cacheItem = service.config({
      id: 'test',
      load: true,
      construct: () => throwError('Fail')
    });
    expect(cacheItem.error$.getValue()).toEqual('An error has occoured');
  }));

  it('should error with generic custom message', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    const cacheItem = service.config({
      id: 'test',
      load: true,
      genericError: 'I failed',
      construct: () => throwError('Fail')
    });
    expect(cacheItem.error$.getValue()).toEqual('I failed');
  }));

  it('should error with error handler', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    const id = 'test';
    const cacheItem = service.config({
      id: id,
      load: true,
      errorHandler: (error: any) => `test ${error}`,
      construct: () => throwError('Fail')
    });
    expect(cacheItem.error$.getValue()).toEqual(`${cacheItem.id} Fail`);
  }));
});
