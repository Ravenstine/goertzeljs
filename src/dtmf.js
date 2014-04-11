function DTMF(samplerate,downsampleRate,peakFilterSensitivity,threshold){
  var self = this
  self.peakFilterSensitivity = peakFilterSensitivity
  self.downsampleRate = downsampleRate || 5
  self.samplerate = samplerate / self.downsampleRate
  self.frequencyTable = {
    697: {1209: "1", 1336: "2", 1477: "3", 1633: "A"}, 
    770: {1209: "4", 1336: "5", 1477: "6", 1633: "B"},
    852: {1209: "7", 1336: "8", 1477: "9", 1633: "C"},
    941: {1209: "*", 1336: "0", 1477: "#", 1633: "D"}
  }
  self.lowFrequencies = []
  for(var key in self.frequencyTable) self.lowFrequencies.push(parseInt(key))
  self.highFrequencies = []
  for (var key in self.frequencyTable[self.lowFrequencies[0]]) self.highFrequencies.push(parseInt(key))
  self.allFrequencies = self.lowFrequencies.concat(self.highFrequencies)  
  self.threshold = threshold || 0.0002
  self.repeatCounter = 0
  self.firstPreviousValue = ""
  self.goertzel = new Goertzel(self.allFrequencies,self.samplerate,self.threshold)

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

    // Set up the register for garbage collection.
    register = null
    delete register
    if (self.frequencyTable[lowFrequency] != undefined){
      return self.frequencyTable[lowFrequency][highFrequency] || null
    }

  }

  self.processBin = function(bin){
    var value = ""
    var intSample
    var register
    var windowedSample

    // Downsample by choosing every Nth sample.
    for ( var i=0; i< bin.length; i+=self.downsampleRate ) {
        intSample = self.goertzel.floatToIntSample(bin[i])
        windowedSample = self.goertzel.windowFunction(intSample,i,(bin.length/self.downsampleRate))
        register = self.goertzel.getEnergyFromSample(windowedSample)
        value = self.energyProfileToCharacter(register)
    } // END DOWNSAMPLE 

    // Run peak test to throw out samples with too many energy spectrum peaks or where the difference between energies is not great enough.
    var highEnergies = []
    for (var i=0; i<self.highFrequencies.length; i++){
      var f = self.highFrequencies[i]
      highEnergies.push(register.energies[f])
    }    
    var lowEnergies = []
    for (var i=0; i<self.lowFrequencies.length; i++){
      var freq = self.lowFrequencies[i]
      lowEnergies.push(register.energies[freq])
    }    
    var badPeaks = false
    if (self.goertzel.peakFilter(highEnergies,self.peakFilterSensitivity) == true){
      badPeaks = true
    } else if (self.goertzel.peakFilter(lowEnergies,self.peakFilterSensitivity) == true){
      badPeaks = true
    } // END PEAK TEST

    if (badPeaks == false){
        if (value == self.firstPreviousValue && value != undefined ){
          self.repeatCounter+=1
          if (self.repeatCounter == 4 && typeof this.onDecode === "function"){
            setTimeout(this.onDecode(value), 0);
          }
        } else {
          self.repeatCounter = 0
          self.firstPreviousValue = value
        }
    }
    self.goertzel.refresh()
  }

}
