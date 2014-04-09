function Goertzel(frequencyTable,samplerate,threshold){
  var self = this
  self.threshold = threshold
  self.samplerate = samplerate
  self.frequencyTable = frequencyTable
  self.lowFrequencies = []
  for(var key in self.frequencyTable) self.lowFrequencies.push(parseInt(key))
  self.highFrequencies = []
  for (var key in self.frequencyTable[self.lowFrequencies[0]]) self.highFrequencies.push(parseInt(key))
  self.allFrequencies = self.lowFrequencies.concat(self.highFrequencies)
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

  self.refresh = function(){
    self.firstPrevious = {}
    self.secondPrevious = {}
    self.totalPower = {}
    self.filterLength = {}

    for ( var i=0; i< self.allFrequencies.length; i++ ){
      var frequency = self.allFrequencies[i]
      self.firstPrevious[frequency] = 0.0
      self.secondPrevious[frequency] = 0.0
      self.totalPower[frequency] = 0.0
      self.filterLength[frequency] = 0.0
    }
  }


  self.peakFilter = function(energies){
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

    if (secondPeak >= peak/10) {
      return true
    } else {
      return false
    }
  }

  self.energyProfileToCharacter = function(register){
    var energies = register.energies

    // Find high frequency.
    var highFrequency = 0.0
    var highFrequencyEngergy = 0.0

    for (var i=0; i<self.highFrequencies.length; i++){
      var f = self.highFrequencies[i]
      if (energies[f] > highFrequencyEngergy && energies[f] > self.threshold){
        highFrequencyEngergy = energies[f]
        highFrequency = f
      }
    }    

    // Find low frequency.
    var lowFrequency = 0.0
    var lowFrequencyEnergy = 0.0

    for (var i=0; i<self.lowFrequencies.length; i++){
      var f = self.lowFrequencies[i]
      if (energies[f] > lowFrequencyEnergy && energies[f] > self.threshold){
        lowFrequencyEnergy = energies[f]
        lowFrequency = f
      }
    }

    // Run peak test to throw out samples with too many energy spectrum peaks.
    var highEnergies = []
    for (var i=0; i<self.highFrequencies.length; i++){
      var f = self.highFrequencies[i]
      highEnergies.push(energies[f])
    }    
    var lowEnergies = []
    for (var i=0; i<self.lowFrequencies.length; i++){
      var freq = self.lowFrequencies[i]
      lowEnergies.push(energies[freq])
    }    
    var badPeaks = false
    if (self.peakFilter(highEnergies) == true){
      badPeaks = true
    } else if (self.peakFilter(highEnergies) == true){
      badPeaks = true
    }

    // Set up the register for garbage collection.
    register = null
    delete register
    if (self.frequencyTable[lowFrequency] != undefined && badPeaks == false){
      return self.frequencyTable[lowFrequency][highFrequency] || null
    }

  }

  self.getEnergyFromSample = function(register){
    for ( var i=0; i< self.allFrequencies.length; i++ ){
        var frequency = self.allFrequencies[i]
        sine = register.sample + (self.coefficient[frequency] * register.firstPrevious[frequency]) - register.secondPrevious[frequency]
        register.rememberSample(sine,frequency)
        register.filterLength[frequency]+=1
        power = (register.secondPrevious[frequency]*register.secondPrevious[frequency]) + (register.firstPrevious[frequency]*register.firstPrevious[frequency]) - (self.coefficient[frequency]*register.firstPrevious[frequency]*register.secondPrevious[frequency])
        register.totalPower[frequency]+=register.sample*register.sample
        if(register.totalPower[frequency] == 0){
            register.totalPower[frequency] = 1
        }
        register.energies[frequency] = power / register.totalPower[frequency] / register.filterLength[frequency]
    }
    return register
  }

  self.refresh()

}
