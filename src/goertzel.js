'use strict';

class Goertzel {

  constructor(options) {
    if (options == null) { options = {}; }
    this.sampleRate     = options.sampleRate;
    this.frequencies    = options.frequencies;
    this.refresh();
  }

  refresh() {
    //# Re-initializes Goertzel when we are taking in a new buffer
    for (var attr of ['firstPrevious', 'secondPrevious', 'totalPower', 'filterLength', 'energies']) { this[attr] = {}; }
    if (!this.coefficient) { this._initializeCoefficients(this.frequencies); }
    return Array.from(this.frequencies).map((frequency) =>
      (() => {
        let result = [];
        for (attr of ['firstPrevious', 'secondPrevious', 'totalPower', 'filterLength', 'energies']) {           result.push(this[attr][frequency] = 0.0);
        }
        return result;
      })());
  }

  processSample(sample) {
    this.currentSample = sample;
    for (let frequency of Array.from(this.frequencies)) {
      this._getEnergyOfFrequency(sample, frequency);
    }
    return this; // returning self would be most useful here
  }

  //# private
  _getEnergyOfFrequency(sample, frequency) {
    //# Main algorithm
    let f1 = this.firstPrevious[frequency];
    let f2 = this.secondPrevious[frequency];
    let coefficient = this.coefficient[frequency];
    let sine = (sample + (coefficient * f1)) - f2;
    f2 = f1;
    f1  = sine;
    this.filterLength[frequency] += 1;
    let power = ((f2 * f2) + (f1 * f1)) - (coefficient * f1 * f2);
    let totalPower = this.totalPower[frequency] += sample * sample;
    if (totalPower === 0) { this.totalPower[frequency] = 1; }
    this.energies[frequency] = power / totalPower / this.filterLength[frequency];
    this.firstPrevious[frequency]  = f1;  //
    this.secondPrevious[frequency] = f2;  // This is just a means to reduce the amount of property calling.
    return this.energies[frequency];
  }

  _initializeCoefficients(frequencies) {
    let normalizedFrequency;
    this.coefficient = {};
    return Array.from(frequencies).map((frequency) =>
      (normalizedFrequency = frequency / this.sampleRate,
      this.coefficient[frequency] = 2.0 * Math.cos(2.0 * Math.PI * normalizedFrequency)));
  }


  static initClass() {

    this.Utilities = {
      floatToIntSample(floatSample) {
        let intSample = floatSample * 32768;
        if (intSample > 32767) {
          return 32767;
        } else if (intSample < -32768) {
          return -32768;
        }
        return Math.round(intSample);
      },
  
      downsampleBuffer(buffer, downsampleRate, mapSample) {
        let bufferLength = buffer.length;
        // Prefer Uint8ClampedArray for performance
        let downsampledBuffer = new (Uint8ClampedArray || Array)(bufferLength / downsampleRate);
        let i = 0;
        while (i < bufferLength) {
          let sample = buffer[i];
          if (mapSample) {
            downsampledBuffer[i] = mapSample(sample, i, buffer.length, downsampleRate);
          } else {
            downsampledBuffer[i] = sample;
          }
          i += downsampleRate;
        }
        return downsampledBuffer;
      },
  
      eachDownsample(buffer, downSampleRate, fn) {
        let i = 0;
        let bufferLength = buffer.length;
        let downSampledBufferLength = bufferLength / downSampleRate;
        return (() => {
          let result = [];
          while (i < bufferLength) {
            var sample = buffer[i];
            __guardFunc__(fn, f => f(sample, i, downSampledBufferLength));
            result.push(i += downSampleRate);
          }
          return result;
        })();
      },
  
      hamming(sample, sampleIndex, bufferSize) {
        return sample * (0.54 - (0.46 * Math.cos((2 * Math.PI * sampleIndex) / bufferSize)));
      },
  
      exactBlackman(sample, sampleIndex, bufferSize) {
        return sample * ((0.426591 - (0.496561 * Math.cos((2 * Math.PI * sampleIndex)/bufferSize))) + (0.076848 * Math.cos((4 * Math.PI * sampleIndex)/bufferSize)));
      },
  
      peakFilter(energies, sensitivity) {
        energies = energies.sort().reverse();
        let peak = energies[0];
        let secondPeak = energies[1];
        let thirdPeak = energies[2];
        let trough = energies.reverse()[0];
        if ((secondPeak > (peak / sensitivity)) ||
         (thirdPeak > (secondPeak / (sensitivity / 2))) ||
         (trough > (peak / (sensitivity / 2)))) {
          return true;
        } else {
          return false;
        }
      },
  
      doublePeakFilter(energies1, energies2, sensitivity) {
        if ((this.peakFilter(energies1, sensitivity) === true) || (this.peakFilter(energies2, sensitivity) === true)) {
          return true;
        } else {
          return false;
        }
      },
  
      //# useful for testing purposes
  
      generateSineBuffer(frequencies, sampleRate, numberOfSamples) {
        let buffer = new (Float32Array || Array)(numberOfSamples);
        let volumePerSine = 1 / frequencies.length;
        let i = 0;
        while (i < numberOfSamples) {
          let val = 0;
          for (let frequency of Array.from(frequencies)) {
            val += (Math.sin(Math.PI * 2 * (i / sampleRate) * frequency) * volumePerSine);
          }
          buffer[i] = val;
          i++;
        }
        return buffer;
      },
  
      generateWhiteNoiseBuffer(sampleRate, numberOfSamples) {
        let buffer = new (Float32Array || Array)(numberOfSamples);
        let i = 0;
        while (i < numberOfSamples) {
          buffer[i] = (Math.random() * 2) - 1;
          i++;
        }
        return buffer;
      },
  
      floatBufferToInt(floatBuffer) {
        let floatBufferLength = floatBuffer.length;
        let intBuffer = new (Uint8ClampedArray || Array)(floatBufferLength);
        let i = 0;
        while (i < floatBufferLength) {
          intBuffer[i] = Goertzel.Utilities.floatToIntSample(floatBuffer[i]);
          i++;
        }
        return intBuffer;
      },
  
      averageDecibels(buffer) {
        // always returns a positive number, even
        // if a buffer contains negative samples
        let sum = 0;
        let bufferLength = buffer.length;
        let i   = 0;
        while (i < bufferLength) {
          sum += Math.abs(buffer[i]);
          i++;
        }
        return sum / bufferLength;
      }
    };
  }
}

Goertzel.initClass();

module.exports = Goertzel;

function __guardFunc__(func, transform) {
  return typeof func === 'function' ? transform(func) : undefined;
}

