goertzel.js
==========

A pure JavaScript implementation of the Goertzel algorithm.  The source is written in CoffeeScript.

The algorithm is used for detecting if specific frequencies are present in a sound(similar to a Discrete Fourier Transform).  It has been most commonly used to detect DTMF(aka Touch-tone) from phone keypads, but it can also be used for a variety of other projects(instrument tuning, decoding FSK, detecting ultrasound, sonar, etc).

This particular project is all vanilla and uses no outside libraries, but requires a browser that supports AudioContext and getUserMedia.  Because of this, the demo will only work with recent versions of Chrome and Firefox.

demo
==========
[goertzel.herokuapp.com](https://goertzel.herokuapp.com/)

* **NOTE:** Chrome(and possibly other browsers) now require the use of HTTPS when the getUserMedia API is used.  I'm uncertain if the effects the sever file I included in the project but, if my demo link above exhibits an error, be sure you are using HTTPS and not plain HTTP*

The demo is a DTMF detector that uses a microphone input.  To test the demo, you must have a microphone set up on your computer(and configured in your browser settings) and a source to play DTMF(Audacity or an actual phone).

Simply play some DTMF tones and the detected characters will appear on the page.

You can run the demo yourself by installing finalhandler and serve-static with NPM(you do have NPM installed, right?):

```sudo npm install finalhandler serve-static```

Then run the server:

```node server.js```

And the page will be accessible at *http://localhost:8000/demo.html*.


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
The samplerate should be the sample rate of whatever sample buffers are being given to the goertzel object.  Most of the time this is either 44100 or 48000 hz.  This can be set as high or as low as necessary, though higher samplerates will create more overhead.  Consider downsampling your audio for faster processing time.  See dtmf.js on how samples can be downsampled.

Noise can be filtered out through both energy detection threshold(minimum energy needed to be considered a valid signal) and multiple peak detection, the latter of which is more effective.  Some window functions(Hamming, Exact Blackman) are provided as well.

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

At this point, the Goertzel algorithm is finished.  The simplest way to detect if a frequency is present is by looking at which frequency has the highest energy in contrast to the other frequencies in the register.

See dtmf.js on how to process buffers from microphone audio with goertzel.js.

#### Compilation
Make sure you have Coffeescript installed first:

```sudo npm install -g coffee-script```

Compile your changes to the CoffeeScript source by running *compile.sh*.  The changes will appear in the **build** directory.


dtmf.js
==========
I included a DTMF library that depends on goertzel.js for demonstration purposes; while I'll occasionally develop it, it's not officially supported so at the moment I won't include any specs on it.

At this time, frequencies need to occur for at least 0.11 seconds long to be detected consistently with a 512 sample buffer.  Unfortunately, this is more than twice the minimum duration specified by ITU-T(0.043 seconds).

Goertzel.js by itself does not get rid of noise, provided are some helpful utilities for eliminating noise.  Usually I can get rid of 95% of background noise, and unless you are implementing a system similar to a phone system where button-presses mute the microphone, it may occasionally "mistake" a sound pattern for a DTMF tone.

The longer the buffer, the easier it is to filter out noise; this also means that the duration of a DTMF tone must be longer.  Implementing a sliding buffer helps too.

Here's a quick how-to on using dtmf.js with goertzel.js.

```
var dtmf = new DTMF(samplerate,peakFilterSensitivity,repeatMin,downsampleRate,threshold)
```

* The sample rate is the sample rate of the audio buffer being given to the dtmf object.
* peakFilterSensitivity filters out "bad" energy peaks.  Can be any number between 1 and infinity.
* repeatMin requires that a DTMF character be repeated enough times across buffers to be considered a valid DTMF tone.
* The downsampleRate value decides how much the buffers are downsampled(by skipping every Nth sample).  Default setting is 1.
* The threshold value gets passed to the goertzel object that gets created by the dtmf object.  This is the noise threshold value.  Default setting is 0.

All of these values need to be adjusted depending on buffer-size, noise level, tone duration, etc.

First create the object:

```javascript
var dtmf = new DTMF(44100,1.2,10,1,0)
```

Then every time you need to process a new sample buffer:
```javascript
dtmf.processBin(buffer)
```

A buffer should be an array of float samples, which will be converted to integer samples for goertzel.

To subscribe to a DTMF detection:
```
dtmf.on("decode", function(value){ // do something // })
```

The value is whatever DTMF was detected.  So to insert that value on to your page:

```javascript
dtmf.on("decode", function(value){
  document.querySelector('#output').innerHTML = outputElement.innerHTML + value
})
```

extra features
==========
I included some useful utility methods with goertzel.js that I found useful with DTMF detection that could also be used for other forms of detection.


To convert a float sample to an integer sample, pass it to floatToIntSample and you will be returned an integer sample.
```
Goertzel.Utilities.floatToIntSample(floatSample)
```

For applying the Hamming window function to a sample, use #hamming:
```
Goertzel.Utilities.hamming(sample,sampleIndex,bufferSize)
```

You can also use #exactBlackman to use the Exact Blackman window function.

Practical use of DTMF requires significant noise reduction.  If you have control over the signal, it would be best to mute audio that can interfere; phone systems mute microphone input to accurately receive DTMF.  On the other hand, you may want to decode frequencies from the same input where other sounds/noise may be received so you will need to filter the noise.  Because other methods I tried did not seem to work very well, I came up with my own noise filtration by finding the peak energy in a given spectrum of frequencies, then finding the second highest energy and throwing out the sample if secondHighestEnergy >= peakEnergy/peakFilterSensitivity.  

```
Goertzel.Utilities.peakFilter(energies,sensitivity)
```

Energies needs to be a simple array of energies, and sensitivity needs to be an integer from 1 to infinity.

peakFilter will return true if the amount of surrounding energy is too great, the peak isn't high enough, or there are multiple peaks.  Samples that pass return false.  I've found this to be a very effective means of reducing errors, and a peakFilterSensitivity value of 20 seems to work well.  The more specific you want your frequency detection to be, the higher the sensitivity you may need.

```
Goertzel.Utilities.doublePeakFilter(energies1,energies2,sensitivity)
```

doublePeakFilter does the same thing as the normal peak filter but with two arrays at the same time.  


conclusion
==========
I hope this project will be useful for anyone who wants to understand the Goertzel algorithm or basic signal processing with the HTML5 Audio API.  

Special thanks to Texas Instruments for the best explanation of the Goertzel algorithm I could find.
[http://www.ti.com/lit/an/spra066/spra066.pdf](http://www.ti.com/lit/an/spra066/spra066.pdf)


author
==========
* Ben Titcomb [@Ravenstine](https://github.com/Ravenstine)
