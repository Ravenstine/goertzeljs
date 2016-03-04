class DTMF 
  constructor: (options={}) ->
    @options =
      downsampleRate:   1
      energyThreshold:  0
      decibelThreshold: 0
      repeatMin:        0
      sampleRate:       44100
    for option of options
      @options[option] = options[option]
    @sampleRate = @options.sampleRate / @options.downsampleRate
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
    @repeatCounter = 0
    @firstPreviousValue = ''
    @goertzel = new Goertzel
      frequencies: @allFrequencies
      sampleRate:  @sampleRate
    @decodeHandlers = []
    @jobs = 
      beforeProcess:  []

  processBuffer: (buffer) ->
    value = ''
    result = []
    @_runJobs('beforeProcess', buffer)
    return result if @options.decibelThreshold and (Goertzel.Utilities.averageDecibels(buffer) < @options.decibelThreshold)
    # Downsample by choosing every Nth sample.
    Goertzel.Utilities.eachDownsample buffer, @options.downsampleRate, (sample,i,downSampledBufferLength)=>
      windowedSample = Goertzel.Utilities.exactBlackman(sample, i, downSampledBufferLength)
      @goertzel.processSample(windowedSample)
    energies =
      high: []
      low:  []
    for fType in ['high', 'low']
      i = 0
      while i < @["#{fType}Frequencies"].length
        f = @["#{fType}Frequencies"][i]
        energies[fType].push @goertzel.energies[f]
        i++
    if (@options.filter && @options.filter({goertzel: @goertzel, energies: energies})) or !@options.filter
      value = @_energyProfileToCharacter(@goertzel)
      if ((value == @firstPreviousValue) or (@options.repeatMin == 0)) and value != undefined
        @repeatCounter += 1 unless @options.repeatMin == 0
        if @repeatCounter == @options.repeatMin
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

  calibrate: (multiplier=1)->
    @jobs.beforeProcess ||= []
    @jobs.beforeProcess.push (buffer, dtmf) ->
      dtmf.options.decibelThreshold = Goertzel.Utilities.averageDecibels(buffer) * multiplier

  # private

  _energyProfileToCharacter: (register) ->
    energies = register.energies
    # Find high frequency.
    highFrequency = 0.0
    highFrequencyEngergy = 0.0
    for f in @highFrequencies
      if energies[f] > highFrequencyEngergy and energies[f] > @options.energyThreshold
        highFrequencyEngergy = energies[f]
        highFrequency = f
    # Find low frequency.
    lowFrequency = 0.0
    lowFrequencyEnergy = 0.0
    for f in @lowFrequencies
      if energies[f] > lowFrequencyEnergy and energies[f] > @options.energyThreshold
        lowFrequencyEnergy = energies[f]
        lowFrequency = f
    if @frequencyTable[lowFrequency] != undefined
      return @frequencyTable[lowFrequency][highFrequency] or null
    return

  _runJobs: (jobName, buffer) ->
    if @jobs[jobName]
      queueLength = @jobs[jobName].length
      i = 0
      while i < queueLength
        @jobs[jobName].pop()(buffer, @)
        i++

if typeof module != 'undefined' and module.exports # if node.js
  module.exports = DTMF
else if typeof define == 'function' and define.amd # if require.js
  define ->
    DTMF
else
  window.DTMF = DTMF