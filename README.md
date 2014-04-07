goertzel.js
==========

A pure JavaScript implementation of the Goertzel algorithm.  

The algorithm is used for detecting if specific frequencies are present in a sound(similar to a Discrete Fourier Transform).  It has been most commonly used to detect DTMF(aka Touch-tone) from phone keypads, but it can also be used for a variety of other projects(instrument tuning, decoding FSK, etc).

This particular project is all vanilla JavaScript and uses no outside libraries.  Practical use, however, may require a browser that supports AudioContext and getUserMedia.  Because of this, the demo will only work on recent versions of Chrome and Firefox since it is processing in real-time.

demo
==========
[goertzel.herokuapp.com](http://goertzel.herokuapp.com/)

The demo is a DTMF detector that uses a microphone input.  To test the demo, you must have a microphone set up on your computer(and configured in your browser settings) and a source to play DTMF(Audacity or an actual phone).

Simply play some DTMF sounds and the detected characters will appear on the page.

limitations
==========
This library currently doesn't have a good way of filtering out background sound.  The only way right now is to increase the detection threshold.  It would be highly appreciated if someone were to add a window function.

Since Goertzel.js doesn't do much to get rid of noise, it will sometimes "mistake" a sound pattern for a DTMF sound.  It may also have a difficult time detecting DTMF tones if there is too much noise.  This means that it should not be used for serious use unless modified.

how to use
==========
To create a Goertzel instance:
```
var goertzel = new Goertzel(frequencyData, samplerate, threshold)
```

frequencyData is an object containing information about what frequencies are to be detected and what combinations of those frequencies need to return(letters or true/false).  

In the case of DTMF:

```javascript
var frequencyData = {
  frequencyTable: {
    697: {1209: "1", 1336: "2", 1477: "3", 1633: "A"}, 
    770: {1209: "4", 1336: "5", 1477: "6", 1633: "B"},
    852: {1209: "7", 1336: "8", 1477: "9", 1633: "C"},
    941: {1209: "*", 1336: "0", 1477: "#", 1633: "D"}
  },
  lowFrequencies: [697 ,770, 852, 941],
  highFrequencies: [1209, 1336, 1477, 1633],
  allFrequencies: [697 ,770, 852, 941,1209, 1336, 1477, 1633]
}
```
I plan on making this more concise in the future, but this information can be pre-processed.  See dtmf.js for an example.

The samplerate should be the sample rate of whatever sample bins are being given to the goertzel object.  This can be as high or as low as necessary, though higher samplerates will create more overhead.  Consider downsampling your audio for faster processing time.  See dtmf.js on how samples can be downsampled.

The threshold is used to filter out noise mistaken for found frequency combinations.  I've found that a threshold of 0.0002 works well for DTMF, but your results may vary.

```javascript
var goertzel = new Goertzel(frequencyData, 8000, 0.0002)
```

To process a sample, you need to create a register and pass it to getEnergyFromSample.

```javascript
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

registerResult = goertzel.getEnergyFromSample(register)
```

The resulting register contains the energies for every frequency that the sample was filtered through.

To finally test to see if two frequencies are present, pass the register you just filtered to energyProfileToCharacter.

```javascript
var value = goertzel.energyProfileToCharacter(registerResult)
```

See dtmf.js on how to process bins from microphone audio with goertzel.js.

notes
==========
Since this is a new project, the documentation here may become outdated quickly.

Testing for the presence of a single frequency hasn't been implemented yet, though it would be very easy to(just eliminate one of the conditions needed to decode).

conclusion
==========
I hope this project will be useful for anyone who wants to understand the Goertzel algorithm or basic signal processing with the HTML5 Audio API.  

author
==========
* Ben Titcomb [@Ravenstine](https://github.com/Ravenstine)
