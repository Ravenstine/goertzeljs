'use strict';

let DTMF     = require('../src/dtmf');
let Goertzel = require('../src/goertzel');

require('jasmine-expect');

describe('DTMF', function() {
  let pairs = [
    {
      low: 697,
      high: 1209,
      char: '1'
    }, {
      low: 697,
      high: 1336,
      char: '2'
    }, {
      low: 697,
      high: 1477,
      char: '3'
    }, {
      low: 697,
      high: 1633,
      char: 'A'
    }, {
      low: 770,
      high: 1209,
      char: '4'
    }, {
      low: 770,
      high: 1336,
      char: '5'
    }, {
      low: 770,
      high: 1477,
      char: '6'
    }, {
      low: 770,
      high: 1633,
      char: 'B'
    }, {
      low: 852,
      high: 1209,
      char: '7'
    }, {
      low: 852,
      high: 1336,
      char: '8'
    }, {
      low: 852,
      high: 1477,
      char: '9'
    }, {
      low: 852,
      high: 1633,
      char: 'C'
    }, {
      low: 941,
      high: 1209,
      char: '*'
    }, {
      low: 941,
      high: 1336,
      char: '0'
    }, {
      low: 941,
      high: 1477,
      char: '#'
    }, {
      low: 941,
      high: 1633,
      char: 'D'
    }
  ];


  describe('#processBuffer', function() {
    it('identifies all dial tones', function() {
      let buffer, dtmf, dualTone, i, len, pair, results, vals;
      dtmf = new DTMF({
        sampleRate: 44100,
        repeatMin: 0
      });
      results = [];
      for (i = 0, len = pairs.length; i < len; i++) {
        pair = pairs[i];
        dualTone = Goertzel.Utilities.generateSineBuffer([pair.low, pair.high], 44100, 512);
        buffer = Goertzel.Utilities.floatBufferToInt(dualTone);
        vals = dtmf.processBuffer(buffer);
        results.push(expect(vals).toContain(pair.char));
      }
      return results;
    });

    it('does not identify dial tones in noise', function() {
      let dtmf, result;
      dtmf = new DTMF({
        sampleRate: 44100,
        peakFilterSensitivity: 1.4,
        repeatMin: 6
      });
      dtmf.processBuffer(Goertzel.Utilities.generateWhiteNoiseBuffer(44100, 512));
      dtmf.processBuffer(Goertzel.Utilities.generateWhiteNoiseBuffer(44100, 512));
      dtmf.processBuffer(Goertzel.Utilities.generateWhiteNoiseBuffer(44100, 512));
      dtmf.processBuffer(Goertzel.Utilities.generateWhiteNoiseBuffer(44100, 512));
      dtmf.processBuffer(Goertzel.Utilities.generateWhiteNoiseBuffer(44100, 512));
      dtmf.processBuffer(Goertzel.Utilities.generateWhiteNoiseBuffer(44100, 512));
      result = dtmf.processBuffer(Goertzel.Utilities.generateWhiteNoiseBuffer(44100, 512));
      return expect(result).toBeEmptyArray();
    });
  });


  describe('#calibrate', function() {
    it('alters the decibelThreshold', function() {
      let dtmf;
      dtmf = new DTMF({
        sampleRate: 44100,
        peakFilterSensitivity: 1.4,
        repeatMin: 6
      });
      expect(dtmf.options.decibelThreshold).toEqual(0);
      dtmf.calibrate();
      dtmf.processBuffer([1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
      return expect(dtmf.options.decibelThreshold).toBeGreaterThan(0);
    });
  });


  describe('decibelThreshold', function() {
    it('allows a louder signal to pass', function() {
      let dtmf, result;
      dtmf = new DTMF({
        sampleRate: 44100,
        repeatMin: 0,
        decibelThreshold: 0
      });
      result = dtmf.processBuffer(Goertzel.Utilities.generateSineBuffer([pairs[0].low, pairs[0].high], 44100, 512));
      return expect(result).not.toBeEmptyArray();
    });

    it('prevents a signal from passing', function() {
      let dtmf, result;
      dtmf = new DTMF({
        sampleRate: 44100,
        repeatMin: 0,
        decibelThreshold: 1000
      });
      result = dtmf.processBuffer(Goertzel.Utilities.generateSineBuffer([pairs[0].low, pairs[0].high], 44100, 512));
      return expect(result).toBeEmptyArray();
    });
  });
});
