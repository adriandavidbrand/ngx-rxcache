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
    service.add({ id: 'test' });
    expect(service.exists('test')).toBeTruthy();
  }));

  it('should find added item as an observable', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    service.add({
      id: 'test',
      initialValue: 10
    });
    const obs = service.get$('test');
    expect(obs.getValue()).toEqual(10);
  }));

  it('should find added item', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    service.add({
      id: 'test',
      initialValue: 10
    });
    const obs = service.get('test');
    expect(obs).toEqual(10);
  }));

  it('should not find deleted item', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    service.add({
      id: 'test'
    });
    service.delete('test');
    const obs = service.get$('test');
    expect(obs).toBeUndefined();
  }));

  it('should not find non existing item', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    expect(service.get$(`Does't Exist`)).toBeUndefined();
  }));

  it('should generate item from constructor function', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    service.add({
      id: 'test',
      construct: () => of(10)
    });
    const obs = service.get$('test');
    expect(obs.getValue()).toEqual(10);
  }));

  it('should update item', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    service.add({
      id: 'test'
    });
    service.update('test', 10);
    const obs = service.get$('test');
    expect(obs.getValue()).toEqual(10);
  }));

  it('should refresh item', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    let val = 0;
    service.add({
      id: 'test',
      construct: () => of(val)
    });
    const obs = service.get$('test');
    const firstVal = obs.getValue();
    val = 1;
    service.refresh('test');
    expect(obs.getValue()).toEqual(val);
  }));

  it('should be loading for 5ms', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    service.add({
      id: 'test',
      load: true,
      construct: () => of(10).pipe(delay(5))
    });
    const obs = service.loading$('test');
    expect(obs.getValue()).toBeTruthy();
  }));

  it('should be not be loaded for 5ms', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    service.add({
      id: 'test',
      load: true,
      construct: () => of(10).pipe(delay(5))
    });
    const obs = service.loaded$('test');
    expect(obs.getValue()).toBeFalsy();
  }));

  it('should not be loading after 5ms', inject([NgxRxcacheService], (service: NgxRxcacheService, done: DoneFn) => {
    service.add({
      id: 'test',
      load: true,
      construct: () => of(10).pipe(delay(5))
    });
    const obs = service.loading$('test');

    setTimeout(() => {
      expect(obs.getValue()).toBeFalsy();
      done();
    }, 6);
  }));

  it('should be loaded after 5ms', inject([NgxRxcacheService], (service: NgxRxcacheService, done: DoneFn) => {
    service.add({
      id: 'test',
      load: true,
      construct: () => of(10).pipe(delay(5))
    });
    const obs = service.loaded$('test');

    setTimeout(() => {
      expect(obs.getValue()).toBeTruthy();
      done();
    }, 6);
  }));

  it('should reload item', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    service.add({
      id: 'test'
    });
    service.reload('test', () => of(10));
    const obs = service.get$('test');
    expect(obs.getValue()).toEqual(10);
  }));

  it('should error with generic error message', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    service.add({
      id: 'test',
      load: true,
      construct: () => throwError('Fail')
    });
    const obs = service.error$('test');
    expect(obs.getValue()).toEqual('An error has occoured');
  }));

  it('should error with generic custom message', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    service.add({
      id: 'test',
      load: true,
      genericError: 'I failed',
      construct: () => throwError('Fail')
    });
    const obs = service.error$('test');
    expect(obs.getValue()).toEqual('I failed');
  }));

  it('should error with error handler', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    const id = 'test';
    service.add({
      id: id,
      load: true,
      errorHandler: (id: string, error: any) => `${id} ${error}`,
      construct: () => throwError('Fail')
    });
    const obs = service.error$('test');
    expect(obs.getValue()).toEqual(`${id} Fail`);
  }));
});
