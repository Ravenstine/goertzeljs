describe("Goertzel", function() {
  var goertzel
  var allFrequencies = [697,770,852,941,1209,1336,1477,1633]
  var values
  beforeEach(function() {
    // goertzel = new Goertzel(allFrequencies,8000,0)
  })

  describe("algorithm", function(){
    beforeEach(function() {
      goertzel = new Goertzel(allFrequencies,8000,0)
      goertzel.getEnergiesFromSample(0)
      goertzel.getEnergiesFromSample(546)
      values = goertzel.getEnergiesFromSample(1504)
    })

    it("should be able to remember previous samples", function() {
      expect(values.sample).toEqual(1504)
    })

    it("should be able to remember previous energies", function() {
      expect(values.firstPrevious).toEqual({ 697 : 2436.4248439044995, 770 : 2402.3234456787786, 852 : 2360.503093191283, 941 : 2311.0996942591355, 1209 : 2139.600796572923, 1336 : 2048.018135030723, 1477 : 1940.0456405177429, 1633 : 1814.4188578992603 })
    })

    it("should be able to remember second previous energies", function() {
      expect(values.secondPrevious).toEqual({ 697 : 546, 770 : 546, 852 : 546, 941 : 546, 1209 : 546, 1336 : 546, 1477 : 546, 1633 : 546 })
    })

    it("should be able to get the energies of specified frequencies based on samples", function() {
      expect(values.energies).toEqual({ 697 : 0.5159235822556053, 770 : 0.5092457387045755, 852 : 0.5010563451403619, 941 : 0.4913820154611419, 1209 : 0.457798559429748, 1336 : 0.43986455327206403, 1477 : 0.41872103823495177, 1633 : 0.3941204047186204 })
    })

    it("should be able to get the total power of specified frequencies based on samples", function() {
      expect(values.totalPower).toEqual({ 697 : 2560133, 770 : 2560133, 852 : 2560133, 941 : 2560133, 1209 : 2560133, 1336 : 2560133, 1477 : 2560133, 1633 : 2560133 })
    })

    it("should increment the filter length after receiving samples", function() {
      expect(values.filterLength).toEqual({ 697 : 3, 770 : 3, 852 : 3, 941 : 3, 1209 : 3, 1336 : 3, 1477 : 3, 1633 : 3 })
    })

    it("should be able to get the energy of a specific frequency based on a sample", function(){
      var value = goertzel.getEnergyFromSample(1337,697)
      expect(value).toEqual(0.5665648144136298)
    })

    it("should be able to remember a sample that was processed using getEnergyFromSample", function(){
      goertzel.getEnergyFromSample(1337,697)
      expect(goertzel.register.sample).toEqual(1337)
    })

  })

  describe("frequency registers", function(){
    beforeEach(function() {
      goertzel = new Goertzel(allFrequencies,8000,0)
    })

    it("should return a populated frequency register", function() {
      expect(goertzel.generateFrequencyRegister().firstPrevious).toEqual({ 697 : 0, 770 : 0, 852 : 0, 941 : 0, 1209 : 0, 1336 : 0, 1477 : 0, 1633 : 0 })
      expect(goertzel.generateFrequencyRegister().secondPrevious).toEqual({ 697 : 0, 770 : 0, 852 : 0, 941 : 0, 1209 : 0, 1336 : 0, 1477 : 0, 1633 : 0 })
      expect(goertzel.generateFrequencyRegister().sample).toEqual(0)
      expect(goertzel.generateFrequencyRegister().totalPower).toEqual({ 697 : 0, 770 : 0, 852 : 0, 941 : 0, 1209 : 0, 1336 : 0, 1477 : 0, 1633 : 0 })
      expect(goertzel.generateFrequencyRegister().energies).toEqual({ 697 : 0, 770 : 0, 852 : 0, 941 : 0, 1209 : 0, 1336 : 0, 1477 : 0, 1633 : 0 })
      expect(goertzel.generateFrequencyRegister().filterLength).toEqual({ 697 : 0, 770 : 0, 852 : 0, 941 : 0, 1209 : 0, 1336 : 0, 1477 : 0, 1633 : 0 })
    })

  })


  describe("peak filter", function(){
    beforeEach(function() {
      goertzel = new Goertzel(allFrequencies,8000,0)
    })

    it("should reject a bad signal", function() {
      var badsignal = goertzel.peakFilter([1,4,65,14,11,318,0],20)
      expect(badsignal).toEqual(true)
    })

    it("should accept a good signal", function() {
      var goodsignal = goertzel.peakFilter([0,0,1900,0,0,0,0],20)
      expect(goodsignal).toEqual(false)
    })

  })


  describe("window function", function(){
    beforeEach(function() {
      goertzel = new Goertzel(allFrequencies,8000,0)
    })

    it("should perform window function on a sample", function() {
      expect(goertzel.windowFunction(233,0,400)).toEqual(1.6025740000000053)
      expect(goertzel.windowFunction(233,1,400)).toEqual(1.608012138277554)
      expect(goertzel.windowFunction(233,80,400)).toEqual(49.15691270548219)
    })

  })


  describe("float to int sample conversion", function(){
    beforeEach(function() {
      goertzel = new Goertzel(allFrequencies,8000,0)
    })

    it("should convert a float32 sample to int16", function() {
      expect(goertzel.floatToIntSample(0.0225)).toEqual(737)
    })

  })



})
