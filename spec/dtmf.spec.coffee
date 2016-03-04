`Goertzel = require('../build/goertzel');`
DTMF     = require('../build/dtmf')
require('jasmine-expect')

describe 'DTMF', ->

  pairs = [
    {low: 697, high: 1209, char: '1'}
    {low: 697, high: 1336, char: '2'}
    {low: 697, high: 1477, char: '3'}
    {low: 697, high: 1633, char: 'A'}
    {low: 770, high: 1209, char: '4'}
    {low: 770, high: 1336, char: '5'}
    {low: 770, high: 1477, char: '6'}
    {low: 770, high: 1633, char: 'B'}
    {low: 852, high: 1209, char: '7'}
    {low: 852, high: 1336, char: '8'}
    {low: 852, high: 1477, char: '9'}
    {low: 852, high: 1633, char: 'C'}
    {low: 941, high: 1209, char: '*'}
    {low: 941, high: 1336, char: '0'}
    {low: 941, high: 1477, char: '#'}
    {low: 941, high: 1633, char: 'D'}
  ]

  describe '#processBuffer', ->
    it 'identifies all dial tones', ->
      dtmf = new DTMF
        sampleRate: 44100
        repeatMin: 0 # since we only need to test a single buffer
      for pair in pairs
        dualTone = Goertzel.Utilities.generateSineBuffer([pair.low, pair.high], 44100, 512)
        buffer = Goertzel.Utilities.floatBufferToInt(dualTone)
        vals = dtmf.processBuffer(buffer)
        expect(vals).toContain(pair.char)

    it 'does not identify dial tones in noise', ->
      dtmf = new DTMF
        sampleRate: 44100
        peakFilterSensitivity: 1.4
        repeatMin: 6
      dtmf.processBuffer Goertzel.Utilities.generateWhiteNoiseBuffer(44100, 512)
      dtmf.processBuffer Goertzel.Utilities.generateWhiteNoiseBuffer(44100, 512)
      dtmf.processBuffer Goertzel.Utilities.generateWhiteNoiseBuffer(44100, 512)
      dtmf.processBuffer Goertzel.Utilities.generateWhiteNoiseBuffer(44100, 512)
      dtmf.processBuffer Goertzel.Utilities.generateWhiteNoiseBuffer(44100, 512)
      dtmf.processBuffer Goertzel.Utilities.generateWhiteNoiseBuffer(44100, 512)
      result = dtmf.processBuffer Goertzel.Utilities.generateWhiteNoiseBuffer(44100, 512)
      expect(result).toBeEmptyArray()

  describe '#calibrate', ->
    it 'alters the decibelThreshold', ->
      dtmf = new DTMF
        sampleRate: 44100
        peakFilterSensitivity: 1.4
        repeatMin: 6
      expect(dtmf.options.decibelThreshold).toEqual(0)
      dtmf.calibrate()
      dtmf.processBuffer([1,2,3,4,5,4,3,2,1,2,3,4,5,6,7,8,9,8,7,6,5,4,3,2,1])
      expect(dtmf.options.decibelThreshold).toBeGreaterThan(0)