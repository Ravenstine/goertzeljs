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

  self.getEnergyFromSample = function(sample){
    self.register.sample = sample
    for ( var i=0; i< self.allFrequencies.length; i++ ){
        var frequency = self.allFrequencies[i]
        sine = self.register.sample + (self.coefficient[frequency] * self.register.firstPrevious[frequency]) - self.register.secondPrevious[frequency]
        self.register.rememberSample(sine,frequency)
        self.register.filterLength[frequency]+=1
        power = (self.register.secondPrevious[frequency]*self.register.secondPrevious[frequency]) + (self.register.firstPrevious[frequency]*self.register.firstPrevious[frequency]) - (self.coefficient[frequency]*self.register.firstPrevious[frequency]*self.register.secondPrevious[frequency])
        self.register.totalPower[frequency]+=self.register.sample*self.register.sample
        if(self.register.totalPower[frequency] == 0){
            self.register.totalPower[frequency] = 1
        }
        self.register.energies[frequency] = power / self.register.totalPower[frequency] / self.register.filterLength[frequency]
    }
    return self.register
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


  self.windowFunction = function(sample,sampleIndex,binSize){
    // Exact Blackman
    return sample * (0.426591 - 0.496561 * Math.cos(2 * Math.PI * sampleIndex/binSize) + 0.076848 * Math.cos(4 * Math.PI * sampleIndex/binSize))
  }

  self.peakFilter = function(energies,sensitivity){
    var peak = 0
    var secondPeak = 0

    for (var i=0; i<energies.length; i++){
      if(energies[i] > peak){
        peak = energies[i]
      }
    }

    for (var i=0; i<energies.length; i++){
      if(energies[i] > secondPeak && energies[i] < peak){
        secondPeak = energies[i]
      }
    }

    if (secondPeak >= peak/sensitivity) {
      return true
    } else {
      return false
    }
  }


  self.refresh()

}
