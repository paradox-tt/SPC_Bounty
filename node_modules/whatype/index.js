'use strict';

function whatype(val) {
  const typeOf = typeof val;
  const strType = Object.prototype.toString.call(val);


  if (val === void 0) return 'undefined';

  if (strType === '[object GeneratorFunction]') return 'generator-function';
  if (strType === '[object AsyncFunction]') return 'async-function';
  if (['function', 'string', 'boolean'].indexOf(typeOf) > -1) return typeOf;
  if (val === null) return 'null';


  // primitive type wrappers
  if (val instanceof String) return 'string';
  if (val instanceof Boolean) return 'boolean';
  if (val instanceof Number) return 'number';


  // other native types
  if (strType === '[object Symbol]') return 'symbol';
  if (strType === '[object RegExp]') return 'regexp';
  if (strType === '[object Date]') return 'date';
  if (strType === '[object Error]') return 'error';
  if (strType === '[object Map]') return 'map';
  if (strType === '[object WeakMap]') return 'weak-map';
  if (strType === '[object Set]') return 'set';
  if (strType === '[object WeakSet]') return 'weak-set';
  if (strType === '[object ArrayBuffer]') return 'array-buffer';
  if (strType === '[object Promise]') return 'promise';
  if (strType === '[object DataView]') return 'data-view';
  if (strType === '[object Arguments]') return 'arguments';


  // Typed arrays
  const typedArrayTypes = ['Float32Array', 'Float64Array', 'Int16Array', 'Int32Array',
    'Int8Array', 'Uint16Array', 'Uint32Array', 'Uint8Array', 'UInt8ClampedArray'];
  if (typedArrayTypes.some((t) => strType.indexOf(t) > -1)) return 'typed-array';


  if ((Array.isArray && Array.isArray(val)) || val.constructor === Array) return 'array';
  if (val === Object(val)) return 'object';
  if (Number.isNaN(val)) return 'not-a-number';
  if (!Number.isNaN(parseFloat(val)) && Number.isFinite(val)) return 'number';
  if (val === Infinity) return 'infinity';
  if (val === -Infinity) return '-infinity';
}

whatype.is = function is(val, type) {
  const strType = Object.prototype.toString.call(val);
  const detectedType = whatype(val);
  let booleanValue;

  // "== null" matches null or undefined
  if (val == null) {
    // 'nil' =>>> null || undefined
    if (type === 'nil') return true;

    booleanValue = false;
  } else {
    booleanValue = val.valueOf ? !!val.valueOf() : !!val;
  }

  // Falsy and truthy values
  if (type === 'falsy' && !booleanValue) return true;
  if (type === 'truthy' && !!booleanValue) return true;

  // If type is equal to detectedType...
  if (type === detectedType) return true;

  // string-object, number-object and boolean-object types
  if (type === `${detectedType}-object` &&
    ['string', 'number', 'boolean'].indexOf(detectedType) > -1 &&
    typeof val === 'object') return true;

  // string-primitive, number-primitive and boolean-primitive types
  if (type === `${detectedType}-primitive` &&
    ['string', 'number', 'boolean'].indexOf(detectedType) > -1 &&
    typeof val !== 'object') return true;

  // numeric type, which englobes NaN, Infinity and -Infinity
  if (type === 'numeric' &&
    ['number', 'not-a-number', 'infinity', '-infinity'].indexOf(detectedType) > -1) return true;

  // Errors, dates, arguments and promises are also... objects!
  if (type === 'object' &&
    ['arguments', 'error', 'date', 'promise'].indexOf(detectedType) > -1) return true;

  // A literal object (whose constructor is Object)
  if (type === 'literal-object' && val.constructor === Object) return true;

  // Empty objects
  if (type === 'empty-literal-object' &&
    Object.keys(val).length === 0 && val.constructor === Object) return true;

  // "Pure" objects (objects created with Object.create(null), which haven't a constructor)
  if (type === 'pure-object'
    && detectedType === 'object' && val.constructor === undefined) return true;

  // Empty arrays
  if (type === 'empty-array' && detectedType === 'array' && val.length === 0) return true;

  // Common functions cannot be async functions or generators
  if (type === 'common-function' && detectedType === 'function') return true;

  // Although async functions and generators are NOT common functions, they ARE functions
  if (type === 'function' &&
    ['async-function', 'generator-function'].indexOf(detectedType) > -1) return true;

  // More specific error type checking
  if (/-error$/.test(type) && detectedType === 'error') {
    const foundErrorType = val.constructor.name.replace(/Error$/, '').toLowerCase();
    const expectedErrorType = type.replace(/-error$/, '');

    if (foundErrorType === expectedErrorType) return true;
  }

  if (/-array/.test(type) && detectedType === 'typed-array') {
    const foundType = strType.replace(/^\[object (.*)Array\]$/, '$1').toLowerCase();
    const expectedType = type.replace(/-array$/, '');

    if (foundType === expectedType) return true;
  }

  return false;
};

module.exports = whatype;
