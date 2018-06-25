import { clone } from './clone';

describe('clone', () => {
  it('clone undefined should be undefined', () => {
    let val = clone(undefined);
    expect(val).toBeUndefined();
  });

  it('clone null should be null', () => {
    let val = clone(null);
    expect(val).toBeNull();
  });
});