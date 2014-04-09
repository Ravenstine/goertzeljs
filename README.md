goertzel.js
==========

A pure JavaScript implementation of the Goertzel algorithm.  

The algorithm is used for detecting if specific frequencies are present in a sound(similar to a Discrete Fourier Transform).  It has been most commonly used to detect DTMF(aka Touch-tone) from phone keypads, but it can also be used for a variety of other projects(instrument tuning, decoding FSK, detecting ultrasound, etc).

This particular project is all vanilla JavaScript and uses no outside libraries.  Practical use, however, may require a browser that supports AudioContext and getUserMedia.  Because of this, the demo will only work on recent versions of Chrome and Firefox since it is processing in real-time.

demo
==========
[goertzel.herokuapp.com](http://goertzel.herokuapp.com/)

The demo is a DTMF detector that uses a microphone input.  To test the demo, you must have a microphone set up on your computer(and configured in your browser settings) and a source to play DTMF(Audacity or an actual phone).

Simply play some DTMF sounds and the detected characters will appear on the page.

limitations
==========
This library currently doesn't have a good way of filtering out background sound.  The only way right now is to increase the detection threshold(minimum energy needed to be considered a valid signal).

Features currently lacking:

* Window function
* Normal/reverse twist
* Sliding Goertzel
* Signal-to-noise test

Since Goertzel.js doesn't do much to get rid of noise, it will sometimes "mistake" a sound pattern for a DTMF sound.  It may also have a difficult time detecting DTMF tones if there is too much noise.  This means that it should not be used for serious use unless modified.

how to use
==========
To create a Goertzel instance:
```
var goertzel = new Goertzel(frequencyTable, samplerate, threshold)
```

frequencyTable is an object containing information about what frequencies are to be detected and what combinations of those frequencies need to return(letters or true/false).  

In the case of DTMF:

```javascript
var frequencyTable = {
    697: {1209: "1", 1336: "2", 1477: "3", 1633: "A"}, 
    770: {1209: "4", 1336: "5", 1477: "6", 1633: "B"},
    852: {1209: "7", 1336: "8", 1477: "9", 1633: "C"},
    941: {1209: "*", 1336: "0", 1477: "#", 1633: "D"}
  }
```
The samplerate should be the sample rate of whatever sample bins are being given to the goertzel object.  Most of the time this is either 44100 or 48000 hz.  This can be set as high or as low as necessary, though higher samplerates will create more overhead.  Consider downsampling your audio for faster processing time.  See dtmf.js on how samples can be downsampled.

The threshold is used to filter out noise mistaken for found frequency combinations when the DTMF tones are quiet.  I've found that a threshold of 0.0002 works well for DTMF, but your results may vary.

```javascript
var goertzel = new Goertzel(frequencyData, 8000, 0.0002)
```

To process a sample, you need to create a register, populate it with keys for every frequency you wish to detect, and pass it to getEnergyFromSample.

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

dtmf.js
==========
Here's a quick how-to on using dtmf.js with goertzel.js.

```
var dtmf = new DTMF(samplerate,downsampleRate,threshold)
```

* The sample rate is the sample rate of the audio bin being given to the dtmf object.
* The downsampleRate value decides how much the bins are downsampled(by skipping every Nth sample).  I've found so far that a value of 5 works best for this.
* The threshold value gets passed to the goertzel object that gets created by the dtmf object.  This is the noise threshold value.  I usually set this at 0.0002, but this value may need to be adjusted(or not used at all by setting it to zero).

First create the object:

```javascript
var dtmf = new DTMF(44100,5,0.0002)
```

Then every time you need to process a new sample bin:
```javascript
dtmf.processBin(bin)
dtmf.refresh()
```

A bin should be an array of float samples, which the dtmf object will convert to integer samples for goertzel.

To subscribe to a DTMF detection:
```
dtmf.onDecode = function(value){ // do something // }
```

The value is whatever DTMF was detected.  So to insert that value on to your page:

```javascript
dtmf.onDecode = function(value){
  document.querySelector('#output').innerHTML = outputElement.innerHTML + value
}
```

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
