const xRegExp = require('xregexp');

const utils = require('../utils.js');

// specialForms and topEnv maps
const SpecialForms = Object.create(null);
const TopEnv = Object.create(null);

SpecialForms['if'] = (args, env) => {
  if(args.length !== 3) {
    throw new SyntaxError('Bad number of args passed to if');
  }

  if(args[0].evaluate(env) === true) {
    return args[1].evaluate(env);
  } else {
    return args[2].evaluate(env);
  }
};

SpecialForms['while'] = (args, env) => {
  if(args.length !== 2) {
    throw new SyntaxError('Bad number of args passed to while');
  }

  while(args[0].evaluate(env) === true) {
    args[1].evaluate(env);
  }

  // Egg has no undefined so we return false when there's no meaningful result
  return false;
};

SpecialForms['for'] = (args, env) => {
  if(args.length !== 4) {
    throw new SyntaxError('Bad number of args passed to for');
  }

  const forEnv = Object.create(env);

  // Variable
  args[0].evaluate(forEnv);

  // Condition
  while(args[1].evaluate(forEnv) === true) {
    // Body
    args[3].evaluate(forEnv);

    // Increment
    args[2].evaluate(forEnv);
  }

  return false;
};

SpecialForms['foreach'] = (args, env) => {
  if(args.length !== 3) {
    throw new SyntaxError('Bad number of args passed to foreach');
  }

  if(args[0].type !== 'word') {
    throw new SyntaxError('The first argument to foreach must be a valid word');
  }

  const localEnv = Object.create(env);

  const iterable = args[1].evaluate(localEnv);
  for(const val of iterable) {
    localEnv[args[0].name] = val;
    args[2].evaluate(localEnv);
  }

  return false;
};

SpecialForms['do'] = (args, env) => {
  let value = false;

  args.forEach((arg) => {
    value = arg.evaluate(env);
  });

  return value;
};

SpecialForms['def'] = SpecialForms['define'] = SpecialForms[':='] = (args, env) => {
  if(args.length !== 2 || args[0].type !== 'word') {
    throw new SyntaxError('Bad use of define');
  }

  let value = args[1].evaluate(env);
  env[args[0].name] = value;
  return value;
};

SpecialForms['fun'] = SpecialForms['->'] = (args, env) => {
  if (!args.length) {
    throw new SyntaxError('Functions need a body.');
  }

  function name(expr) {
    if (expr.type !== 'word') {
      throw new SyntaxError('Arg names must be words');
    }

    return expr.name;
  }

  let argNames = args.slice(0, args.length - 1).map(name);
  let body = args[args.length - 1];

  return function() {
    if (arguments.length !== argNames.length) {
      throw new TypeError('Wrong number of arguments');
    }

    let localEnv = Object.create(env);
    for (let i = 0; i < arguments.length; i++) {
      localEnv[argNames[i]] = arguments[i];
    }

    return body.evaluate(localEnv);
  };
};

SpecialForms['set'] = SpecialForms['='] = (args, env) => {
  if (args[0].type !== 'word') {
    throw new SyntaxError('Bad use of set');
  }

  let valName = args[0].name;

  let indices = args.slice(1, -1).map((arg) =>
                      arg.evaluate(env));

  let value = args[args.length - 1].evaluate(env);

  for (let scope = env; scope; scope = Object.getPrototypeOf(scope)) {
    if (Object.prototype.hasOwnProperty.call(scope, valName)) {

      if(indices.length === 0) {
        scope[valName] = value;
      } else {
        scope[valName].setelem(value, ...indices);
      }

      return value;
    }
  }

  throw new ReferenceError(`Tried setting an undefined variable: ${valName}`);
};

SpecialForms['object'] = (args, env) => {
  // Create a new object and a new scope
  const object = {};
  const objectEnv = Object.create(env);

  // Add the variable 'this' as a reference to the current object
  objectEnv['this'] = object;

  // Evaluate the arguments and add the methods/properties to the object
  const evArgs = args.map((arg) => arg.evaluate(objectEnv));

  for(const pair of utils.chunk(evArgs, 2)) {
    const name = pair[0];
    const value = pair[1];

    object[name] = value;
  }

  return object;
};

// TODO: Continue implementing class?
//
// SpecialForms['class'] = (args, env) => {
//   // const evArgs = args.map((arg) => evaluate(arg, env));
//
//   const newClass = function(x, y) {
//     this.x = x;
//     this.y = y;
//   }
//
//   return newClass;
// }

[
  '+',
  '-',
  '*',
  '/',
  '==',
  '!=',
  '<',
  '>',
  '>=',
  '<=',
  '&&',
  '||'
].forEach((op) => {
  TopEnv[op] = new Function('a, b', `return a ${op} b;`);
});

TopEnv['true'] = true;
TopEnv['false'] = false;
TopEnv['null'] = null;

TopEnv['print'] = (value) => {
  console.log(value);
  return value;
};

TopEnv['arr'] = TopEnv['array'] = (...args) => {
  return args;
};

TopEnv['map'] = TopEnv['dict'] = (...args) => {
  return new Map(utils.chunk(args, 2));
};

TopEnv['<-'] = TopEnv['[]'] = TopEnv['element'] = (object, ...indices) => {
  return object.sub(...indices);
};

TopEnv['length'] = (array) => {
  return array.length;
};

TopEnv['RegExp'] = (method, ...args) => {
  return xRegExp[method](...args);
};

// WIP: Continue implementing class?
// TopEnv['new'] = (...args) => {
//   const className = args[0];
//
//   // TODO: Check for more exceptions
//   if(typeof className !== "function") {
//     throw new SyntaxError(`${className} must be a class with a constructor.`) // SyntaxError?
//   }
//
//   return new className(...args.slice(1));
//

module.exports = {
  SpecialForms,
  TopEnv
};