'use strict';

const Utilities = {
  floatToIntSample(floatSample) {
    const intSample = ((floatSample * 32768) + 0.5) | 0;
    if (intSample > 32767) {
      return 32767;
    } else if (intSample < -32768) {
      return -32768;
    }
    return intSample;
  },

  downsampleBuffer(buffer, downsampleRate, mapSample) {
    let bufferLength      = buffer.length,
        downsampledBuffer = new Uint8ClampedArray(bufferLength / downsampleRate),
        i = 0;
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
    let i = 0,
        bufferLength            = buffer.length,
        downSampledBufferLength = bufferLength / downSampleRate,
        result                  = [];
    while (i < bufferLength) {
      var sample = buffer[i];
      if(fn) fn(sample, i, downSampledBufferLength);
      result.push(i += downSampleRate);
    }
    return result;
  },

  hamming(sample, sampleIndex, bufferSize) {
    return sample * (0.54 - (0.46 * Math.cos((2 * Math.PI * sampleIndex) / bufferSize)));
  },

  exactBlackman(sample, sampleIndex, bufferSize) {
    return sample * ((0.426591 - (0.496561 * Math.cos((2 * Math.PI * sampleIndex)/bufferSize))) + (0.076848 * Math.cos((4 * Math.PI * sampleIndex)/bufferSize)));
  },

  peakFilter(energies, sensitivity) {
    energies = energies.sort((a, b) => (a - b)).reverse();
    let peak       = energies[0],
        secondPeak = energies[1],
        thirdPeak  = energies[2],
        trough     = energies.reverse()[0];
    return (secondPeak > (peak / sensitivity)) ||
           (thirdPeak > (secondPeak / (sensitivity / 2))) ||
           (trough > (peak / (sensitivity / 2)));
  },

  doublePeakFilter(energies1, energies2, sensitivity) {
    return this.peakFilter(energies1, sensitivity) || this.peakFilter(energies2, sensitivity);
  },

  // useful for testing purposes

  generateSineBuffer(frequencies, sampleRate, numberOfSamples, phase=0) {
    let buffer        = new Float32Array(numberOfSamples),
        volumePerSine = 1 / frequencies.length,
        i             = 0;
    while (i < numberOfSamples) {
      let val = 0;
      for (let frequency of Array.from(frequencies)) {
        val += (Math.sin(Math.PI * 2 * ((i + phase) / sampleRate) * frequency) * volumePerSine);
      }
      buffer[i] = val;
      i++;
    }
    return buffer;
  },

  generateWhiteNoiseBuffer(sampleRate, numberOfSamples) {
    let buffer = new Float32Array(numberOfSamples),
        i      = 0;
    while (i < numberOfSamples) {
      buffer[i] = (Math.random() * 2) - 1;
      i++;
    }
    return buffer;
  },

  floatBufferToInt(floatBuffer) {
    let floatBufferLength = floatBuffer.length,
        intBuffer         = new Uint8ClampedArray(floatBufferLength),
        i                 = 0;
    while (i < floatBufferLength) {
      intBuffer[i] = Utilities.floatToIntSample(floatBuffer[i]);
      i++;
    }
    return intBuffer;
  },

  averageDecibels(buffer) {
    // always returns a positive number, even
    // if a buffer contains negative samples
    let sum          = 0,
        bufferLength = buffer.length,
        i            = 0;
    while (i < bufferLength) {
      sum += Math.abs(buffer[i]);
      i++;
    }
    return sum / bufferLength;
  }
};

module.exports = Utilities;

