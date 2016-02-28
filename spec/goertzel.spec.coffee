Goertzel = require('../build/goertzel')

describe 'Goertzel', ->
  goertzel = undefined
  allFrequencies = [
    697
    770
    852
    941
    1209
    1336
    1477
    1633
  ]
  values = undefined

  describe 'algorithm', ->
    beforeEach ->
      goertzel = new Goertzel(allFrequencies, 8000, 0)
      goertzel.getEnergiesFromSample 0
      goertzel.getEnergiesFromSample 546
      values = goertzel.getEnergiesFromSample(1504)

    it 'remembers previous samples', ->
      expect(values.sample).toEqual 1504

    it 'remembers second previous energies', ->
      expect(values.secondPrevious).toEqual
        697: 546
        770: 546
        852: 546
        941: 546
        1209: 546
        1336: 546
        1477: 546
        1633: 546

    it 'gets the energies of specified frequencies based on samples', ->
      for frequency in allFrequencies
        expect(values.energies[frequency]).not.toEqual(0)

    it 'gets the total power of specified frequencies based on samples', ->
      expect(values.totalPower).toEqual
        697: 2560133
        770: 2560133
        852: 2560133
        941: 2560133
        1209: 2560133
        1336: 2560133
        1477: 2560133
        1633: 2560133

    it 'increments the filter length after receiving samples', ->
      expect(values.filterLength).toEqual
        697: 3
        770: 3
        852: 3
        941: 3
        1209: 3
        1336: 3
        1477: 3
        1633: 3

    # it 'gets the energy of a specific frequency based on a sample', ->
    #   value = goertzel.register.processSample(1337, 697)
    #   expect(value).toEqual 0.5665648144136298

    # it 'remembers a sample that was processed using register.processSample', ->
    #   goertzel.register.processSample 1337, 697
    #   expect(goertzel.register.sample).toEqual 1337

  describe '::FrequencyRegister', ->
    it 'returns a populated frequency register', ->
      register = new Goertzel.FrequencyRegister(allFrequencies)
      expect(register.firstPrevious).toEqual
        697: 0
        770: 0
        852: 0
        941: 0
        1209: 0
        1336: 0
        1477: 0
        1633: 0
      expect(register.secondPrevious).toEqual
        697: 0
        770: 0
        852: 0
        941: 0
        1209: 0
        1336: 0
        1477: 0
        1633: 0
      expect(register.sample).toEqual 0
      expect(register.totalPower).toEqual
        697: 0
        770: 0
        852: 0
        941: 0
        1209: 0
        1336: 0
        1477: 0
        1633: 0
      expect(register.energies).toEqual
        697: 0
        770: 0
        852: 0
        941: 0
        1209: 0
        1336: 0
        1477: 0
        1633: 0
      expect(register.filterLength).toEqual
        697: 0
        770: 0
        852: 0
        941: 0
        1209: 0
        1336: 0
        1477: 0
        1633: 0

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
      expect(Goertzel.Utilities.exactBlackman(233, 0, 400)).toEqual 1.6025740000000053
      expect(Goertzel.Utilities.exactBlackman(233, 1, 400)).toEqual 1.608012138277554
      expect(Goertzel.Utilities.exactBlackman(233, 80, 400)).toEqual 49.15691270548219

  describe '::Utilities#floatToIntSample', ->
    it 'converts a float32 sample to int16', ->
      expect(Goertzel.Utilities.floatToIntSample(0.0225)).toEqual 737
