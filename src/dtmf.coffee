class DTMF 
  constructor: (options={}) ->
    @peakFilterSensitivity = options.peakFilterSensitivity
    @downsampleRate = options.downsampleRate or 1
    @sampleRate = options.sampleRate / @downsampleRate
    @frequencyTable =
      697:
        1209: '1'
        1336: '2'
        1477: '3'
        1633: 'A'
      770:
        1209: '4'
        1336: '5'
        1477: '6'
        1633: 'B'
      852:
        1209: '7'
        1336: '8'
        1477: '9'
        1633: 'C'
      941:
        1209: '*'
        1336: '0'
        1477: '#'
        1633: 'D'
    @lowFrequencies = []
    for key of @frequencyTable
      @lowFrequencies.push parseInt(key)
    @highFrequencies = []
    for key of @frequencyTable[@lowFrequencies[0]]
      @highFrequencies.push parseInt(key)
    @allFrequencies = @lowFrequencies.concat(@highFrequencies)
    @threshold = options.threshold or 0
    @repeatCounter = 0
    @firstPreviousValue = ''
    @goertzel = new Goertzel
      frequencies: @allFrequencies
      sampleRate:  @sampleRate
      threshold:   @threshold
    @repeatMin = options.repeatMin
    @decodeHandlers = []

  energyProfileToCharacter: (register) ->
    energies = register.energies
    # Find high frequency.
    highFrequency = 0.0
    highFrequencyEngergy = 0.0
    for f in @highFrequencies
      if energies[f] > highFrequencyEngergy and energies[f] > @threshold
        highFrequencyEngergy = energies[f]
        highFrequency = f
    # Find low frequency.
    lowFrequency = 0.0
    lowFrequencyEnergy = 0.0
    for f in @lowFrequencies
      if energies[f] > lowFrequencyEnergy and energies[f] > @threshold
        lowFrequencyEnergy = energies[f]
        lowFrequency = f

    if @frequencyTable[lowFrequency] != undefined
      return @frequencyTable[lowFrequency][highFrequency] or null
    return

  processBuffer: (buffer) ->
    value = ''
    intSample = undefined
    register = undefined
    windowedSample = undefined
    energy = undefined
    highEnergies = []
    lowEnergies = []
    frequency = undefined
    result = []
    # Downsample by choosing every Nth sample.
    i = 0
    while i < buffer.length
      intSample = buffer[i]
      windowedSample = Goertzel.Utilities.exactBlackman(intSample, i, buffer.length / @downsampleRate)
      register = @goertzel.processSample(windowedSample)
      value = @energyProfileToCharacter(register)
      i += @downsampleRate
    # END DOWNSAMPLE 
    # Run peak test to throw out samples with too many energy spectrum peaks or where the difference between energies is not great enough.
    highEnergies = []
    while i < @highFrequencies.length
      f = @highFrequencies[i]
      highEnergies.push register.energies[f]
      i++
    lowEnergies = []
    while i < @lowFrequencies.length
      freq = @lowFrequencies[i]
      lowEnergies.push register.energies[freq]
      i++
    badPeaks = Goertzel.Utilities.doublePeakFilter(highEnergies, lowEnergies, @peakFilterSensitivity)
    if badPeaks == false
      if value == @firstPreviousValue and value != undefined
        @repeatCounter += 1
        if @repeatCounter == @repeatMin
          result.push value
          for handler in @decodeHandlers
            setTimeout handler(value), 0
      else
        @repeatCounter = 0
        @firstPreviousValue = value
    @goertzel.refresh()
    result

  on: (eventName, handler) ->
    switch eventName
      when "decode" then @decodeHandlers.push(handler)


module.exports = DTMF if module?.exports