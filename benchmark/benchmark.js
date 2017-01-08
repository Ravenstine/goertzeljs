'use strict';

const Benchmark = require('benchmark');
const Goertzel  = require('../src/goertzel');

let frequencies = [123,456,789,101112,131415,161718,192021];
let buffer      = Goertzel.Utilities.generateSineBuffer(frequencies, 44100, 2000);

let goertzel = new Goertzel({
  frequencies,
  sampleRate: 44100
});

console.log(Benchmark);

let suite = new Benchmark.Suite();

suite.add('#processSample', () =>
  Array.from(buffer).map((sample) =>
    goertzel.processSample(sample))
);

suite.on('complete', function() {
  return console.log(`Fastest is ${this.filter('fastest').map('name')}`);
});