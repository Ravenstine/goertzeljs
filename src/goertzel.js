function Goertzel(allFrequencies,samplerate,threshold){
  var self = this
  self.threshold = threshold
  self.samplerate = samplerate
  self.allFrequencies = allFrequencies
  self.firstPrevious = {}
  self.secondPrevious = {}
  self.totalPower = {}
  self.filterLength = {}
  self.coefficient = {}

  for ( var i=0; i< self.allFrequencies.length; i++ ){
    var frequency = self.allFrequencies[i]
    normalizedFrequency = frequency / self.samplerate
    self.coefficient[frequency] = 2.0*Math.cos(2.0 * Math.PI * normalizedFrequency)
  }

  ////
  // Main Goertzel algorithm methods.
  ////

  self.getEnergiesFromSample = function(sample){
    for ( var i=0; i< self.allFrequencies.length; i++ ){
        var frequency = self.allFrequencies[i]
        self.getEnergyFromSample(sample,frequency)
    }
    return self.register
  }

  self.getEnergyFromSample = function(sample,frequency){
    var power
    self.register.sample = sample
    sine = self.register.sample + (self.coefficient[frequency] * self.register.firstPrevious[frequency]) - self.register.secondPrevious[frequency]
    self.register.rememberSample(sine,frequency)
    self.register.filterLength[frequency]+=1
    power = (self.register.secondPrevious[frequency]*self.register.secondPrevious[frequency]) + (self.register.firstPrevious[frequency]*self.register.firstPrevious[frequency]) - (self.coefficient[frequency]*self.register.firstPrevious[frequency]*self.register.secondPrevious[frequency])
    self.register.totalPower[frequency]+=self.register.sample*self.register.sample
    if(self.register.totalPower[frequency] == 0){
        self.register.totalPower[frequency] = 1
    }
    self.register.energies[frequency] = power / self.register.totalPower[frequency] / self.register.filterLength[frequency]
    return self.register.energies[frequency]
  }

  self.generateFrequencyRegister = function(){
    var newRegister = {
      firstPrevious: {}, 
      secondPrevious: {}, 
      totalPower: {}, 
      filterLength: {}, 
      sample: 0, 
      energies: {},
      rememberSample: function(sample,frequency){
        this.secondPrevious[frequency] = this.firstPrevious[frequency]
        this.firstPrevious[frequency] = sample
      }
    }
    for ( var i=0; i< self.allFrequencies.length; i++ ){
      var frequency = self.allFrequencies[i]
      newRegister.firstPrevious[frequency] = 0.0
      newRegister.secondPrevious[frequency] = 0.0
      newRegister.totalPower[frequency] = 0.0
      newRegister.filterLength[frequency] = 0.0
      newRegister.energies[frequency] = 0.0
    }
    return newRegister
  }

  self.refresh = function(){
    self.firstPrevious = {}
    self.secondPrevious = {}
    self.totalPower = {}
    self.filterLength = {}
    self.register = self.generateFrequencyRegister()

    for ( var i=0; i< self.allFrequencies.length; i++ ){
      var frequency = self.allFrequencies[i]
      self.firstPrevious[frequency] = 0.0
      self.secondPrevious[frequency] = 0.0
      self.totalPower[frequency] = 0.0
      self.filterLength[frequency] = 0.0
    }
  }


  ////
  // Extra utilities 
  ////

  self.floatToIntSample = function(floatSample){
    var intSample = floatSample * 32768
    if ( intSample > 32767 ) { 
      return 32767 
    } else if (intSample < -32786) {
      return -32768;
    }
    return Math.round(intSample)
  }


  self.windowFunction = function(sample,sampleIndex,bufferSize){
    // Exact Blackman
    return sample * (0.426591 - 0.496561 * Math.cos(2 * Math.PI * sampleIndex/bufferSize) + 0.076848 * Math.cos(4 * Math.PI * sampleIndex/bufferSize))
  }

  self.peakFilter = function(energies,sensitivity){
    var energies = energies.sort().reverse()
    var peak = energies[0]
    var secondPeak = energies[1]
    var thirdPeak = energies[2]
    var trough = energies.reverse()[0]

    if (secondPeak > peak/sensitivity 
      || 
      thirdPeak > secondPeak/(sensitivity/2) 
      || 
      trough > peak/(sensitivity/2)
      ) {
      return true
    } else {
      return false
    }

  }

  self.doublePeakFilter = function(energies1,energies2,sensitivity){
    if (self.peakFilter(energies1,sensitivity) == true || self.peakFilter(energies2,sensitivity) == true){
      return true
    }
    return false
  }

  self.refresh()

}
