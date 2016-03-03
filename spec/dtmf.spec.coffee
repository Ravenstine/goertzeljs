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

  describe '#processSample', ->
    it 'identifies all dial tones', ->
      dtmf = new DTMF
        sampleRate: 44100
        peakFilterSensitivity: 1.4
        repeatMin: 1
      for pair in pairs
        dualTone = Goertzel.Utilities.generateSineBuffer([pair.low, pair.high], 44100, 512)
        buffer = Goertzel.Utilities.floatBufferToInt(dualTone)
        dtmf.processBuffer(buffer)
        expect(dtmf.processBuffer(buffer)).toContain(pair.char)