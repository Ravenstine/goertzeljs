class Goertzel
  constructor: (options={}) ->
    @threshold      = options.threshold || 0
    @sampleRate     = options.sampleRate
    @frequencies    = options.frequencies
    @refresh()

  refresh: ->
    ## Re-initializes Goertzel when we are taking in a new buffer
    @[attr] = {} for attr in ['firstPrevious', 'secondPrevious', 'totalPower', 'filterLength', 'energies']
    @_initializeCoefficients(@frequencies) unless @coefficient
    # @register = new @.constructor.Processor(@frequencies)
    for frequency in @frequencies
      @[attr][frequency] = 0.0 for attr in ['firstPrevious', 'secondPrevious', 'totalPower', 'filterLength', 'energies']

  processSample: (sample) ->
    for frequency in @frequencies
      @_getEnergyOfFrequency sample, frequency
    @ # returning self would be most useful here

  ## private
  _getEnergyOfFrequency: (sample, frequency) ->
    ## Main algorithm
    @currentSample = sample
    coefficient = @coefficient[frequency]
    sine = sample + coefficient * @firstPrevious[frequency] - (@secondPrevious[frequency])
    @_queueSample sine, frequency
    @filterLength[frequency] += 1
    power = @secondPrevious[frequency] * @secondPrevious[frequency] + @firstPrevious[frequency] * @firstPrevious[frequency] - (coefficient * @firstPrevious[frequency] * @secondPrevious[frequency])
    @totalPower[frequency] += sample * sample
    if @totalPower[frequency] == 0
      @totalPower[frequency] = 1
    @energies[frequency] = power / @totalPower[frequency] / @filterLength[frequency]
    @energies[frequency]

  _initializeCoefficients: (frequencies) ->
    @coefficient = {}
    for frequency in frequencies
      normalizedFrequency = frequency / @sampleRate
      @coefficient[frequency] = 2.0 * Math.cos(2.0 * Math.PI * normalizedFrequency)

  _queueSample: (sample, frequency) ->
    @secondPrevious[frequency] = @firstPrevious[frequency]
    @firstPrevious[frequency]  = sample 
  ## /private



  @Utilities:
    floatToIntSample: (floatSample) ->
      intSample = floatSample * 32768
      if intSample > 32767
        return 32767
      else if intSample < -32786
        return -32768
      Math.round intSample

    downsampleBuffer: (buffer, downsampleRate, mapSample) ->
      bufferLength = buffer.length
      # Prefer Uint8ClampedArray for performance
      downsampledBuffer = new (Uint8ClampedArray or Array)(bufferLength / downsampleRate)
      i = 0
      while i < bufferLength
        sample = buffer[i]
        if mapSample
          downsampledBuffer[i] = mapSample(sample, i, buffer.length, downsampleRate)
        else
          downsampledBuffer[i] = sample
        i += downsampleRate
      downsampledBuffer

    eachDownsample: (buffer, downSampleRate, fn) ->
      i = 0
      bufferLength = buffer.length
      downSampledBufferLength = bufferLength / downSampleRate
      while i < bufferLength
        sample = buffer[i]
        fn?(sample, i, downSampledBufferLength)
        i += downSampleRate

    hamming: (sample, sampleIndex, bufferSize) ->
      sample * (0.54 - 0.46 * Math.cos(2 * Math.PI * sampleIndex / bufferSize))

    exactBlackman: (sample, sampleIndex, bufferSize) ->
      sample * (0.426591 - 0.496561 * Math.cos(2 * Math.PI * sampleIndex/bufferSize) + 0.076848 * Math.cos(4 * Math.PI * sampleIndex/bufferSize))

    peakFilter: (energies, sensitivity) ->
      energies = energies.sort().reverse()
      peak = energies[0]
      secondPeak = energies[1]
      thirdPeak = energies[2]
      trough = energies.reverse()[0]
      if secondPeak > peak / sensitivity or 
       thirdPeak > secondPeak / (sensitivity / 2) or 
       trough > peak / (sensitivity / 2)
        true
      else
        false

    doublePeakFilter: (energies1, energies2, sensitivity) ->
      if (@peakFilter(energies1, sensitivity) == true) or (@peakFilter(energies2, sensitivity) == true)
        true
      else
        false

    ## useful for testing purposes
    generateSine: (frequency, sampleRate, numberOfSamples) ->
      buffer = []
      i = 0
      while i < numberOfSamples
        v = Math.sin(Math.PI * 2 * (i / sampleRate) * frequency)
        buffer.push v
        i++
      buffer

    floatBufferToInt: (floatBuffer) ->
      intBuffer = []
      i = 0
      while i < floatBuffer.length
        intBuffer.push Goertzel.Utilities.floatToIntSample(floatBuffer[i])
        i++
      intBuffer

module.exports = Goertzel if module?.exports