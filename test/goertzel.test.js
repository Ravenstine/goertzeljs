'use strict';

const { assert } = require('chai'),
        Goertzel = require('../index'),
      { generateSineBuffer, peakFilter, floatToIntSample, exactBlackman } = Goertzel.Utilities;

describe('Goertzel', function() {
  describe('processSample()', function() {
    let allFrequencies = [697, 852, 1209, 1477];
    it('biases towards the expected frequency', function() {
      let goertzel = new Goertzel({
        frequencies: allFrequencies,
        sampleRate: 8000
      });
      let buffer, f, frequency, i, j, k, len, len1, len2, results, sample;
      allFrequencies.forEach(frequency => {
        const buffer = generateSineBuffer([frequency], 8000, 2000);
        buffer.forEach(sample => goertzel.processSample(sample));
        allFrequencies.forEach(freq => {
          if(freq !== frequency) assert.isFalse(goertzel.energies[f] < goertzel.energies[frequency]);
        });
        goertzel.refresh();
      });
    });
    it('can calculate the phase', function(){
      const buffer1  = generateSineBuffer([1], 10, 10),
            buffer2  = generateSineBuffer([1], 10, 10, 4),
            goertzel1 = new Goertzel({
              frequencies: [1],
              sampleRate: 10,
              getPhase: true
            }),
            goertzel2 = new Goertzel({
              frequencies: [1],
              sampleRate: 10,
              getPhase: true
            });
      buffer1.forEach(sample => goertzel1.processSample(sample));
      buffer2.forEach(sample => goertzel2.processSample(sample));
      assert.isTrue(goertzel1.phases[1] < goertzel2.phases[1]);
    });
  });

  describe('Goertzel.Utilities.peakFilter()', function() {
    it('rejects a bad signal', function() {
      const badsignal = peakFilter([1, 4, 65, 14, 11, 318, 0], 20);
      assert.isTrue(badsignal);
    });
    it('accepts a good signal', function() {
      const goodsignal = peakFilter([0, 0, 1900, 0, 0, 0, 0], 20);
      assert.isFalse(goodsignal);
    });
  });

  describe('Goertzel.Utilities.blackman()', function() {
    it('performs window function on a sample', function() {
      assert.equal(exactBlackman(233, 0, 400), 1.6025740000000053);
      assert.equal(exactBlackman(233, 1, 400), 1.608012138277554);
      assert.equal(exactBlackman(233, 80, 400), 49.15691270548219);
    });
  });

  describe('Goertzel.Utilities.floatToIntSample()', function() {
    it('converts a float32 sample to int16', function() {
      assert.equal(floatToIntSample(0.0225), 737);
    });
  });
});

