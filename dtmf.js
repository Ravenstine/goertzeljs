function DTMF(samplerate,decimation,threshold){
  var self = this
  var samplerate = samplerate / decimation
  var decimation = decimation || 5
  var threshold = threshold || 0.0002
  var frequencyTable = {
    697: {1209: "1", 1336: "2", 1477: "3", 1633: "A"}, 
    770: {1209: "4", 1336: "5", 1477: "6", 1633: "B"},
    852: {1209: "7", 1336: "8", 1477: "9", 1633: "C"},
    941: {1209: "*", 1336: "0", 1477: "#", 1633: "D"}
  }
  var lowFrequencies = []
  for(var key in frequencyTable) lowFrequencies.push(parseInt(key))
  var highFrequencies = []
  for (var key in frequencyTable[lowFrequencies[0]]) highFrequencies.push(parseInt(key))
  var allFrequencies = lowFrequencies.concat(highFrequencies)
  var frequencyData = {
    frequencyTable: frequencyTable,
    lowFrequencies: lowFrequencies,
    highFrequencies: highFrequencies,
    allFrequencies: allFrequencies
  }

  self.repeatCounter = 0
  self.firstPreviousValue = ""
  self.goertzel = new Goertzel(frequencyData,samplerate,threshold)

  self.processBin = function(bin){
    var value = ""
    var register = self.generateFrequencyRegister()
    // Downsample by decimation(choosing every Nth sample).
    for ( var i=0; i< bin.length; i+=decimation ) {
      floatSample = bin[i] * 32768 ;
      if ( floatSample > 32767 ) { 
        floatSample = 32767 
      } else if (floatSample < -32786) {
        floatSample = -32768;
      }

      intSample = Math.round(floatSample)
      register.sample = intSample

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
