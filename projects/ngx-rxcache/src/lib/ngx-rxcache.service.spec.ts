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
    const val = service.get('test');
    expect(val).toEqual(10);
  }));

  it('deleted item should not exist', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    service.add({
      id: 'test'
    });
    service.delete('test');
    expect(service.exists('test')).toBeFalsy();
  }));

  it('non existing item', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    expect(service.exists(`Does't Exist`)).toBeFalsy();
  }));

  it('should generate item from constructor function', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    service.add({
      id: 'test',
      construct: () => of(10)
    });
    expect(service.get('test')).toEqual(10);
  }));

  it('should update item', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    service.add({
      id: 'test'
    });
    service.update('test', 10);
    expect(service.get('test')).toEqual(10);
  }));

  it('should refresh item', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    let val = 0;
    service.add({
      id: 'test',
      construct: () => of(val)
    });
    const obs = service.get$('test');
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
    expect(service.loading('test')).toBeTruthy();
  }));

  it('should be not be loaded for 5ms', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    service.add({
      id: 'test',
      load: true,
      construct: () => of(10).pipe(delay(5))
    });
    expect(service.loaded('test')).toBeFalsy();
  }));

  it('should not be loading after 5ms', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    service.add({
      id: 'test',
      load: true,
      construct: () => of(10).pipe(delay(5))
    });
    const obs = service.loading$('test');

    setTimeout(() => {
      expect(obs.getValue()).toBeFalsy();
    }, 6);
  }));

  it('should be loaded after 5ms', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    service.add({
      id: 'test',
      load: true,
      construct: () => of(10).pipe(delay(5))
    });
    const obs = service.loaded$('test');

    setTimeout(() => {
      expect(obs.getValue()).toBeTruthy();
    }, 6);
  }));

  it('should be saving for 5ms', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    service.add({
      id: 'test',
      persist: (val) => of(val).pipe(delay(5))
    });
    service.save('test');
    expect(service.saving('test')).toBeTruthy();
  }));

  it('should be not be saved for 5ms', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    service.add({
      id: 'test',
      persist: (val) => of(val).pipe(delay(5))
    });
    service.save('test');
    expect(service.saved('test')).toBeFalsy();
  }));

  it('should not be saving after 5ms', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    service.add({
      id: 'test',
      persist: (val) => of(val).pipe(delay(5))
    });
    service.save('test');

    setTimeout(() => {
      expect(service.saving('test')).toBeFalsy();
    }, 6);
  }));

  it('should be saved after 5ms', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    service.add({
      id: 'test',
      persist: (val) => of(val).pipe(delay(5))
    });
    service.save('test');

    setTimeout(() => {
      expect(service.saved('test')).toBeTruthy();
    }, 6);
  }));

  it('should run saved', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    var test;
    service.add({
      id: 'test',
      initialValue: 10,
      persist: (val) => of(val),
      saved: (val) => { test = val; }
    });
    service.save('test');

    expect(test).toEqual(10);
  }));

  it('should run custom saved', inject([NgxRxcacheService], (service: NgxRxcacheService) => {
    var test;
    service.add({
      id: 'test',
      initialValue: 10,
      persist: (val) => of(val)
    });
    service.save('test', (val) => { test = val; });

    expect(test).toEqual(10);
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
