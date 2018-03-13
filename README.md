# goertzel.js
A pure JavaScript implementation of the Goertzel algorithm.

The algorithm is used for detecting if specific frequencies are present in a sound(similar to a Discrete Fourier Transform).  It has been most commonly used to detect DTMF(aka Touch-tone) from phone keypads, but it can also be used for a variety of other projects(instrument tuning, decoding FSK, creating spectrograms, etc).

This particular project can be used with no outside libraries, but requires a browser that supports AudioContext and getUserMedia.  Because of this, the demo will only work with recent versions of Chrome and Firefox.


## demo
You can run the demo locally by running `gulp demo`.  This uses BrowserSync and spawns the demo in a new browser tab/window.  Because it reloads automatically on changes, this is also a useful tool for development.

The demo is a DTMF detector that uses a microphone input.  To test the demo, you must have a microphone set up on your computer(and configured in your browser settings) and a source to play DTMF.  There are plenty of mobile apps that will play DTMF tones.

[An outdated demo](https://goertzel.herokuapp.com/) exists on Heroku.  I don't want to support it anymore because, well, Heroku, but it is still a good demonstration of what this library does.  **NOTE:** This demo only works over HTTPS.


## installation

`npm install goertzeljs`

If you want to use Goertzel in the browser, you should use a tool like [Browserify](https://github.com/substack/node-browserify) to include Node modules into your browser application.  The demo in the repo provide a good example of how to use Browserify & [Gulp](https://github.com/gulpjs/gulp) to compile Goertzel for the browser.


## usage
Example:
```javascript
  let buffer = [...]; // array of int samples

  const targetFrequencies = [697,770,852,941,1209,1336,1477,1633];

  let goertzel = new Goertzel({
    frequencies: targetFrequencies,
    sampleRate: 8000
  });

  buffer.forEach(function(sample){
    goertzel.processSample(sample);
  });
```

You would then look at each of the frequency keys under the `goertzel` object's `energies` attribute, and compare each of the energy levels to determine the frequencies dominant in the samples passed.

The samplerate should be the sample rate of whatever sample buffers are being given to the goertzel object.  Most of the time this is either 44100 or 48000 hz.  This can be set as high or as low as necessary, though higher samplerates will create more overhead.  Consider downsampling your audio for faster processing time.  See dtmf.js on how samples can be downsampled.


#### Testing
Tests are written with Jasmine.  Run the tests with ```gulp test```.  Note that the tests are perfect "laboratory" conditions.  Performance between an air gap(i.e. from speaker to microphone) varies drastically.


## DTMF
As noted above, I included a DTMF library that for demo purposes; while I'll occasionally develop it, it's not officially supported so at the moment I won't include any specs on it.

At this time, frequencies need to occur for at least 0.11 seconds long to be detected consistently with a 512 sample buffer.  Unfortunately, this is more than twice the minimum duration specified by ITU-T(0.043 seconds).

Goertzel.js by itself does not get rid of noise, provided are some helpful utilities for eliminating noise.  Usually I can get rid of most of background noise, and unless you are implementing something similar to a phone system where button-presses mute the microphone, it may occasionally "mistake" minute noise for a DTMF tone.

The longer the buffer, the more the algorithm biases against noise.  Implementing a sliding buffer helps too.

Here's a quick how-to on using dtmf.js with goertzel.js.

```javascript
  var dtmf = new DTMF({
    sampleRate: 44100,
    peakFilterSensitivity: 1.4,
    repeatMin: 6,
    downsampleRate: 1,
    threshold: 0.005
  });
```

* The sample rate is the sample rate of the audio buffer being given to the dtmf object.
* peakFilterSensitivity filters out "bad" energy peaks.  Can be any number between 1 and infinity.
* repeatMin requires that a DTMF character be repeated enough times across buffers to be considered a valid DTMF tone.
* The downsampleRate value decides how much the buffers are downsampled(by skipping every Nth sample).  Default setting is 1.
* The threshold value gets passed to the goertzel object that gets created by the dtmf object.  This is the noise threshold value.  Default setting is 0.

All of these values need to be adjusted depending on buffer-size, noise level, tone duration, etc.

Then every time you need to process a new sample buffer:
```javascript
dtmf.processBuffer([...]);
```

The dtmf object is expecting a buffer to be an array of float samples, which it converts to integers.

To subscribe to a DTMF detection:
```javascript
dtmf.on("decode", function(value){ // do something // });
```

The value is whatever character that was detected.

## extra features
I included some useful utility methods with goertzel.js that I found useful with DTMF detection that could also be used for other forms of detection.


To convert a float sample to an integer sample, pass it to floatToIntSample and you will be returned an integer sample.
```javascript
Goertzel.Utilities.floatToIntSample(floatSample)
```

For applying the Hamming window function to a sample, use #hamming:
```javascript
Goertzel.Utilities.hamming(sample,sampleIndex,bufferSize)
```

You can also use #exactBlackman to use the Exact Blackman window function.

Practical use of DTMF requires significant noise reduction.  If you have control over the signal, it would be best to mute audio that can interfere; phone systems mute microphone input to accurately receive DTMF.  On the other hand, you may want to decode frequencies from the same input where other sounds/noise may be received so you will need to filter the noise.  Because other methods I tried did not seem to work very well, I came up with my own noise filtration by finding the peak energy in a given spectrum of frequencies, then finding the second highest energy and throwing out the sample if secondHighestEnergy >= peakEnergy/peakFilterSensitivity.  

```javascript
Goertzel.Utilities.peakFilter(energies,sensitivity)
```

Energies needs to be a simple array of energies, and sensitivity needs to be an integer from 1 to infinity.

peakFilter will return true if the amount of surrounding energy is too great, the peak isn't high enough, or there are multiple peaks.  Samples that pass return false.  I've found this to be a very effective means of reducing errors, and a peakFilterSensitivity value of 20 seems to work well.  The more specific you want your frequency detection to be, the higher the sensitivity you may need.

```javascript
Goertzel.Utilities.doublePeakFilter(energies1,energies2,sensitivity)
```

doublePeakFilter does the same thing as the normal peak filter but with two arrays at the same time.  

```javascript
Goertzel.Utilities.generateSineBuffer(frequencies=[], sampleRate, numberOfSamples)
```
generateSineBuffer lets you create an artificial buffer of any number of combined sine waves.  Added for testing purposes, but could have any number of uses.  If you needed to create an oscillator to generate DTMF or other tones without access to a browser's audio API, that's your function.  I actually intend on replacing this with my other library called [Soundrive](https://github.com/Ravenstine/soundrive), which does a better job at creating and mixing a variety of waveforms.


## conclusion
I hope this project will be useful for anyone who wants to understand the Goertzel algorithm or basic signal processing with the HTML5 Audio API.

Thanks are in order to Texas Instruments for the best explanation of the Goertzel algorithm I could find.
[http://www.ti.com/lit/an/spra066/spra066.pdf](http://www.ti.com/lit/an/spra066/spra066.pdf)


## author
* Ben Titcomb [@Ravenstine](https://github.com/Ravenstine)

## license
**The MIT License (MIT)**
Copyright (c) 2018 Ben Titcomb

See the `LICENSE` file for more details.
