export const clone = (obj: any) =>
  Array.isArray(obj)
    ? obj.map(item => clone(item))
    : obj instanceof Date
    ? new Date(obj.getTime())
    : obj && typeof obj === 'object'
    ? Object.getOwnPropertyNames(obj).reduce((o, prop) => {
        o[prop] = clone(obj[prop]);
        return o;
      }, {})
    : obj;