class Goertzel 
  constructor: (allFrequencies, samplerate, threshold) ->
    @threshold      = threshold
    @samplerate     = samplerate
    @allFrequencies = allFrequencies
    @refresh()

  getEnergiesFromSample: (sample) ->
    for frequency in @allFrequencies
      @getEnergyFromSample(sample, frequency)
    @register

  getEnergyFromSample: (sample, frequency) ->
    @register.sample = sample
    sine = @register.sample + @coefficient[frequency] * @register.firstPrevious[frequency] - (@register.secondPrevious[frequency])
    @register.rememberSample sine, frequency
    @register.filterLength[frequency] += 1
    power = @register.secondPrevious[frequency] * @register.secondPrevious[frequency] + @register.firstPrevious[frequency] * @register.firstPrevious[frequency] - (@coefficient[frequency] * @register.firstPrevious[frequency] * @register.secondPrevious[frequency])
    @register.totalPower[frequency] += @register.sample * @register.sample
    if @register.totalPower[frequency] == 0
      @register.totalPower[frequency] = 1
    @register.energies[frequency] = power / @register.totalPower[frequency] / @register.filterLength[frequency]
    @register.energies[frequency]

  refresh: () ->
    @firstPrevious = @secondPrevious = @totalPower = @filterLength = @coefficient = {}
    for frequency in @allFrequencies
      normalizedFrequency = frequency / @samplerate
      @coefficient[frequency] = 2.0 * Math.cos(2.0 * Math.PI * normalizedFrequency)
    @register = new @.constructor.FrequencyRegister(@allFrequencies)


  @Utilities:
    floatToIntSample: (floatSample) ->
      intSample = floatSample * 32768
      if intSample > 32767
        return 32767
      else if intSample < -32786
        return -32768
      Math.round intSample

    downsampleBuffer: (buffer, downsampleRate, mapSample) ->
      downsampledBuffer = []
      i = 0
      while i < buffer.length
        sample = buffer[i]
        if mapSample
          downsampledBuffer.push mapSample(sample, i, buffer.length, downsampleRate)
        else
          downsampledBuffer.push sample
        i += downsampleRate
      downsampledBuffer

    eachDownsample: (buffer, downsampleRate, fn) ->
      i = 0
      while i < buffer.length
        sample = buffer[i]
        fn?(sample, i, buffer.length, downsampleRate)
        i += downsampleRate

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


  class @FrequencyRegister
    constructor: (frequencies) ->
      @allFrequencies = frequencies
      @firstPrevious = @secondPrevious = @totalPower = @filterLength = @energies = {}
      @sample = 0
      for frequency in @allFrequencies
        @firstPrevious[frequency] = @secondPrevious[frequency] = @totalPower[frequency] = @filterLength[frequency] = @energies[frequency] = 0.0

    rememberSample: (sample, frequency) ->
      @secondPrevious[frequency] = @firstPrevious[frequency]
      @firstPrevious[frequency]  = sample 




