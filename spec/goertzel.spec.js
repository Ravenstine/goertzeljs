'use strict';

let Goertzel = require('../index');

describe('Goertzel', function() {
  let allFrequencies = [697, 852, 1209, 1477], 
      goertzel;

  describe('#processSample', function() {
    beforeEach(function() {
      return goertzel = new Goertzel({
        frequencies: allFrequencies,
        sampleRate: 8000,
        threshold: 0
      });
    });
    it('biases towards the expected frequency', function() {
      let buffer, f, frequency, i, j, k, len, len1, len2, results, sample;
      allFrequencies.forEach(frequency => {
        const buffer = Goertzel.Utilities.generateSineBuffer([frequency], 8000, 2000);
        buffer.forEach(sample => goertzel.processSample(sample));
        allFrequencies.forEach(freq => {
          if(freq !== frequency) expect(goertzel.energies[f] < goertzel.energies[frequency]);
        });
        goertzel.refresh();
      });
    });
  });

  describe('Goertzel.Utilities.peakFilter()', function() {
    it('rejects a bad signal', function() {
      const badsignal = Goertzel.Utilities.peakFilter([1, 4, 65, 14, 11, 318, 0], 20);
      expect(badsignal).toEqual(true);
    });
    it('accepts a good signal', function() {
      const goodsignal = Goertzel.Utilities.peakFilter([0, 0, 1900, 0, 0, 0, 0], 20);
      expect(goodsignal).toEqual(false);
    });
  });

  describe('Goertzel.Utilities.blackman()', function() {
    it('performs window function on a sample', function() {
      expect(Goertzel.Utilities.exactBlackman(233, 0, 400)).toEqual(1.6025740000000053);
      expect(Goertzel.Utilities.exactBlackman(233, 1, 400)).toEqual(1.608012138277554);
      expect(Goertzel.Utilities.exactBlackman(233, 80, 400)).toEqual(49.15691270548219);
    });
  });

  describe('Goertzel.Utilities.floatToIntSample()', function() {
    it('converts a float32 sample to int16', function() {
      expect(Goertzel.Utilities.floatToIntSample(0.0225)).toEqual(737);
    });
  });
});

