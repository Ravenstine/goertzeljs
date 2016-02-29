Goertzel = require('../build/goertzel')

describe 'Goertzel', ->
  goertzel = undefined
  allFrequencies = [
    697
    852
    1209
    1477
  ]

  describe '#processSample', ->
    beforeEach ->
      goertzel = new Goertzel
        frequencies: allFrequencies
        sampleRate: 8000
        threshold: 0

    it 'biases towards the expected frequency', ->
      for frequency in allFrequencies
        buffer = Goertzel.Utilities.generateSine(frequency, 8000, 2000)
        for sample in buffer
          goertzel.processSample sample
        for f in allFrequencies
          unless f == frequency
            expect(goertzel.energies[f] < goertzel.energies[frequency])
        goertzel.refresh()


  describe '::Utilities#peakFilter', ->
    it 'rejects a bad signal', ->
      badsignal = Goertzel.Utilities.peakFilter([
        1
        4
        65
        14
        11
        318
        0
      ], 20)
      expect(badsignal).toEqual true

    it 'accepts a good signal', ->
      goodsignal = Goertzel.Utilities.peakFilter([
        0
        0
        1900
        0
        0
        0
        0
      ], 20)
      expect(goodsignal).toEqual false

  describe '::Utilities#blackman', ->
    it 'performs window function on a sample', ->
      # Lousy test, but the output is predictable
      expect(Goertzel.Utilities.exactBlackman(233, 0, 400)).toEqual 1.6025740000000053
      expect(Goertzel.Utilities.exactBlackman(233, 1, 400)).toEqual 1.608012138277554
      expect(Goertzel.Utilities.exactBlackman(233, 80, 400)).toEqual 49.15691270548219

  describe '::Utilities#floatToIntSample', ->
    it 'converts a float32 sample to int16', ->
      expect(Goertzel.Utilities.floatToIntSample(0.0225)).toEqual 737
