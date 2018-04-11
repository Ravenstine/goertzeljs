Goertzel.js
===========
A pure JavaScript implementation of the Goertzel algorithm.

The algorithm is used for detecting if specific frequencies are present audio.  It has been most commonly used to detect DTMF(aka Touch-tone) in telephony, but it can also be used for a variety of other projects(instrument tuning, decoding FSK, creating spectrograms, etc).

I originally wrote it for the purposes of learning, but it's very performant and can be useful in Node.js and browsers that do not supply [AnalyserNode](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode).

## demo
The demo is a DTMF detector that uses microphone input.  It is *very* unsophisticated, so it will sometimes pick up erroneous characters.  You will need to use a separate app(or hey, an actual phone) to produce DTMF tones.

You can run the demo locally by running `npm run demo`.  This uses BrowserSync and spawns the demo in a new browser tab/window.  Because it reloads automatically on changes, this is also a useful tool for development.

## installation

`npm install --save goertzeljs`

If you want to use Goertzel in the browser, you should use a tool like [Browserify](https://github.com/substack/node-browserify) to include Node modules into your browser application.  The demo in the repo provide a good example of how to use Browserify & [Gulp](https://github.com/gulpjs/gulp) to compile Goertzel for the browser.


## usage
Example:
```javascript
  const buffer = [...]; // array of int samples

  const goertzel = new Goertzel({
    frequencies: [697,770,852,941,1209,1336,1477,1633]
  });

  buffer.forEach(function(sample){
    goertzel.processSample(sample);
  });
```

You would then look at each of the frequency keys under the `goertzel` object's `energies` attribute, and compare each of the energy levels to determine the frequencies dominant in the samples passed.

The samplerate should be the sample rate of whatever sample buffers are being given to the goertzel object.  Most of the time this is either 44100 or 48000 hz.  This can be set as high or as low as necessary, though higher samplerates will create more overhead.  Consider downsampling your audio for faster processing time.  See dtmf.js on how samples can be downsampled.


#### Testing
Tests are written with Mocha.  To perform the tests, simply run `npm run test`.


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
