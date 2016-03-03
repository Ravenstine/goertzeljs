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
    result = []
    # Downsample by choosing every Nth sample.
    Goertzel.Utilities.eachDownsample buffer, @downsampleRate, (sample,i,downSampledBufferLength)=>
      windowedSample = Goertzel.Utilities.exactBlackman(sample, i, downSampledBufferLength)
      @goertzel.processSample(windowedSample)
    value = @energyProfileToCharacter(@goertzel)
    # END DOWNSAMPLE 
    # Run peak test to throw out samples with too many energy spectrum peaks or where the difference between energies is not great enough.
    energies =
      high: []
      low:  []
    for fType in ['high', 'low']
      i = 0
      while i < @["#{fType}Frequencies"].length
        f = @["#{fType}Frequencies"][i]
        energies[fType].push @goertzel.energies[f]
        i++
    badPeaks = Goertzel.Utilities.doublePeakFilter(energies['high'], energies['low'], @peakFilterSensitivity)
    if badPeaks == false
      if ((value == @firstPreviousValue) or (@repeatMin == 0)) and value != undefined
        @repeatCounter += 1 unless @repeatMin == 0
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

if typeof module != 'undefined' and module.exports # if node.js
  module.exports = DTMF
else if typeof define == 'function' and define.amd # if require.js
  define ->
    DTMF
else
  window.DTMF = DTMF