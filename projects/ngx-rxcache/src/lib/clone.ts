export const clone = obj =>
  Array.isArray(obj)
    ? obj.map(item => clone(item))
    : obj instanceof Date
      ? new Date(obj.getTime())
      : (typeof obj === 'object') && obj
        ? Object.getOwnPropertyNames(obj).reduce((copy, prop) => ({ ...copy, [prop]: clone(obj[prop]) }), {})
        : obj;