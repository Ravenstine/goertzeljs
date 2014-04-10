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
This library currently doesn't have a good way of filtering out background sound.  

Currently, noise is filtered out through both energy detection threshold(minimum energy needed to be considered a valid signal) and multiple peak detection, the latter of which is more effective.

Features currently lacking:

* Sliding Goertzel(not sure how necessary this is considering how well the current version works)
* Twist/reverse-twist detection.

Since Goertzel.js doesn't do much to get rid of noise, it may occasionally "mistake" a sound pattern for a DTMF tone.  It may also have a difficult time detecting DTMF tones if there is too much noise.

At this time, frequencies need to occur for at least 0.3 seconds long to be detected consistently.

how to use
==========
To create a Goertzel instance:
```
var goertzel = new Goertzel(allFrequencies, samplerate, threshold)
```

allFrequencies is an array of every frequency that will be detected.

In the case of DTMF:

```javascript
var allFrequencies = [697,770,852,941,1209,1336,1477,1633]
```
The samplerate should be the sample rate of whatever sample bins are being given to the goertzel object.  Most of the time this is either 44100 or 48000 hz.  This can be set as high or as low as necessary, though higher samplerates will create more overhead.  Consider downsampling your audio for faster processing time.  See dtmf.js on how samples can be downsampled.

The threshold is used to filter out noise mistaken for found frequency combinations when the DTMF tones are quiet.  I've found that a threshold of 0.0002 works well for DTMF, but your results may vary.

The peakFilterSensitivity determines how much the peak filter discriminates against multiple frequency peaks and weak peaks.  If the second-highest energy to the peak energy is greater than 1/x of the highest frequency peak, the sample is discounted.  peakFilterSensitivity determines x.  This value is unlimited, but I found that at least 20 works well at filtering out noise when detecting DMTF.

```javascript
var goertzel = new Goertzel(allFrequencies, 8000, 0.0002)
```

To process a sample, give your integer sample to getEnergyFromSample.

```javascript
register = goertzel.getEnergyFromSample(sample)
```
This will return a frequency register, which is just an object that contains the energy level of every frequency at a given sample

```
// An unpopulated register.
{
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
```

At this point, the Goertzel algorithm is finished.  The simplest way to detect if a frequency is present is by looking at which frequency has the highest energy in contrast to the otehr frequencies in the register.

See dtmf.js on how to process bins from microphone audio with goertzel.js.

dtmf.js
==========
I included a DTMF library that depends on goertzel.js for demonstration purposes; while I'll occasionally develop it, it's not officially supported so at the moment I won't include any specs on it.

Here's a quick how-to on using dtmf.js with goertzel.js.

```
var dtmf = new DTMF(samplerate,downsampleRate,peakFilterSensitivity,threshold)
```

* The sample rate is the sample rate of the audio bin being given to the dtmf object.
* The downsampleRate value decides how much the bins are downsampled(by skipping every Nth sample).  I've found so far that a value of 5 works best for this.
* peakFilterSensitivity filters out "bad" energy peaks.
* The threshold value gets passed to the goertzel object that gets created by the dtmf object.  This is the noise threshold value.  I usually set this at 0.0002, but this value may need to be adjusted(or not used at all by setting it to zero).

First create the object:

```javascript
var dtmf = new DTMF(44100,5,0.0002)
```

Then every time you need to process a new sample bin:
```javascript
dtmf.processBin(bin)
```

A bin should be an array of float samples, which will be converted to integer samples for goertzel.

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

extra features
==========
I included some useful utility methods with goertzel.js that I found useful with DTMF detection that could also be used for other forms of detection.


To convert a float sample to an integer sample, pass it to floatToIntSample and you will be returned an integer sample.
```
goertzel.floatToIntSample(floatSample)
```

For applying the Exact Blackman window function to a sample, use windowFunction:
```
goertzel.windowFunction(sample,sampleIndex,binSize)
```

Practical use of DTMF requires significant noise reduction.  Because other methods I tried did not seem to work very well, I came up with my own noise filtration.  It works by finding the peak energy in a given spectrum of frequencies, then finding the second highest energy and throwing out the sample if secondHighestEnergy >= peakEnergy/peakFilterSensitivity.  

peakFilter will return true if the amount of surrounding energy is too great, the peak isn't high enough, or there are multiple peaks.  Samples that pass return false.  I've found this to be a very effective means of reducing errors, and a peakFilterSensitivity value of 20 seems to work well.

notes
==========
Since this is a new project, the documentation here may become outdated quickly.

Testing for the presence of a single frequency hasn't been implemented yet, though it would be very easy to(just eliminate one of the conditions needed to decode).

contribution
==========
To contribute, fork the project and make a pull-request!

conclusion
==========
I hope this project will be useful for anyone who wants to understand the Goertzel algorithm or basic signal processing with the HTML5 Audio API/WebRTC.  

author
==========
* Ben Titcomb [@Ravenstine](https://github.com/Ravenstine)
