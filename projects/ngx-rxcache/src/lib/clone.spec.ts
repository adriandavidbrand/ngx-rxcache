import { clone } from './clone';

describe('clone', () => {
  it('clone undefined should be undefined', () => {
    const val = clone(undefined);
    expect(val).toBeUndefined();
  });

  it('clone null should be null', () => {
    const val = clone(null);
    expect(val).toBeNull();
  });

  it('clone number should be equal', () => {
    const val = clone(1);
    expect(val).toEqual(1);
  });

  it('clone string should be equal', () => {
    const val = clone('text');
    expect(val).toEqual('text');
  });

  it('clone object should not be the same instance', () => {
    const obj = { prop1: 'prop1' };
    const copy = clone(obj);
    expect(obj === copy).toBeFalsy();
  });

  it('clone should copy property', () => {
    const obj = { prop1: 'prop1' };
    const copy = clone(obj);
    expect(obj.prop1).toEqual(copy.prop1);
  });

  it('clone array should not be the same instance', () => {
    const array = [1,2,3,4,5];
    const copy = clone(array);
    expect(array === copy).toBeFalsy();
  });

  it('clone should copy array', () => {
    const array = [1,2,3,4,5];
    const copy = clone(array);
    expect(array.length).toEqual(copy.length);
  });

  it('clone date should not be the same instance', () => {
    const date = new Date();
    const copy = clone(date);
    expect(date === copy).toBeFalsy();
  });

  it('clone date should have the same time', () => {
    const date = new Date();
    const copy = clone(date);
    expect(date.getTime()).toEqual(copy.getTime());
  });
});