#!/usr/bin/env node

const {Eggvm} = require('../lib/eggvm.js');
const process = require('process');

const file = process.argv.slice(2).shift();
if (file && file.length > 0) {
  let eggvm = new Eggvm();
  let output = eggvm.runFromFile(file);
  console.log(output);
}
