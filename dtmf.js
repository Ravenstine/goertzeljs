function DTMF(samplerate,downsampleRate,threshold){
  var self = this
  var samplerate = samplerate / downsampleRate
  var downsampleRate = downsampleRate || 5
  var threshold = threshold || 0.0002
  var frequencyTable = {
    697: {1209: "1", 1336: "2", 1477: "3", 1633: "A"}, 
    770: {1209: "4", 1336: "5", 1477: "6", 1633: "B"},
    852: {1209: "7", 1336: "8", 1477: "9", 1633: "C"},
    941: {1209: "*", 1336: "0", 1477: "#", 1633: "D"}
  }
  var allFrequencies = []
  for(var key in frequencyTable) allFrequencies.push(parseInt(key))
  for (var key in frequencyTable[allFrequencies[0]]) allFrequencies.push(parseInt(key))
  self.repeatCounter = 0
  self.firstPreviousValue = ""
  self.goertzel = new Goertzel(frequencyTable,samplerate,threshold)

  self.windowFunction = function(sample,sampleIndex,binSize){
    // sample = sample * (0.54 - 0.46*Math.cos(2 * 3.14 * sampleIndex/binSize))
    // return sample 
    return sample * (0.426591 - 0.496561 * Math.cos(2 * Math.PI * sampleIndex/binSize) + 0.076848 * Math.cos(4 * Math.PI * sampleIndex/binSize))
  }


  self.processBin = function(bin){
    var value = ""
    var register = self.generateFrequencyRegister()

    // Downsample by choosing every Nth sample.
    for ( var i=0; i< bin.length; i+=downsampleRate ) {
      floatSample = bin[i] * 32768 ;
      if ( floatSample > 32767 ) { 
        floatSample = 32767 
      } else if (floatSample < -32786) {
        floatSample = -32768;
      }

      intSample = Math.round(floatSample)
      windowedSample = self.windowFunction(intSample,i,(bin.length/downsampleRate))
      register.sample = windowedSample
      register = self.goertzel.getEnergyFromSample(register)
      value = self.goertzel.energyProfileToCharacter(register)
    }
      if (value == self.firstPreviousValue && value != undefined ){
        self.repeatCounter+=1
        if (self.repeatCounter == 4 && typeof this.onDecode === "function"){
          // outputElement.innerHTML = outputElement.innerHTML + value
          setTimeout(this.onDecode(value), 1);
        }
      } else {
        self.repeatCounter = 0
        self.firstPreviousValue = value
      }

  }

  self.generateFrequencyRegister = function(){
    var register = {
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
    for ( var i=0; i< allFrequencies.length; i++ ){
      var frequency = allFrequencies[i]
      register.firstPrevious[frequency] = 0.0
      register.secondPrevious[frequency] = 0.0
      register.totalPower[frequency] = 0.0
      register.filterLength[frequency] = 0.0
      register.energies[frequency] = 0.0
    }
    return register
  }

  self.refresh = function(){
    self.goertzel.refresh()
  }

}
