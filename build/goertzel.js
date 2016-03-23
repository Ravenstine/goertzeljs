var Goertzel;

Goertzel = (function() {
  function Goertzel(options) {
    if (options == null) {
      options = {};
    }
    this.sampleRate = options.sampleRate;
    this.frequencies = options.frequencies;
    this.refresh();
  }

  Goertzel.prototype.refresh = function() {
    var attr, frequency, j, k, len, len1, ref, ref1, results;
    ref = ['firstPrevious', 'secondPrevious', 'totalPower', 'filterLength', 'energies'];
    for (j = 0, len = ref.length; j < len; j++) {
      attr = ref[j];
      this[attr] = {};
    }
    if (!this.coefficient) {
      this._initializeCoefficients(this.frequencies);
    }
    ref1 = this.frequencies;
    results = [];
    for (k = 0, len1 = ref1.length; k < len1; k++) {
      frequency = ref1[k];
      results.push((function() {
        var l, len2, ref2, results1;
        ref2 = ['firstPrevious', 'secondPrevious', 'totalPower', 'filterLength', 'energies'];
        results1 = [];
        for (l = 0, len2 = ref2.length; l < len2; l++) {
          attr = ref2[l];
          results1.push(this[attr][frequency] = 0.0);
        }
        return results1;
      }).call(this));
    }
    return results;
  };

  Goertzel.prototype.processSample = function(sample) {
    var frequency, j, len, ref;
    ref = this.frequencies;
    for (j = 0, len = ref.length; j < len; j++) {
      frequency = ref[j];
      this._getEnergyOfFrequency(sample, frequency);
    }
    return this;
  };

  Goertzel.prototype._getEnergyOfFrequency = function(sample, frequency) {
    var coefficient, power, sine;
    this.currentSample = sample;
    coefficient = this.coefficient[frequency];
    sine = sample + coefficient * this.firstPrevious[frequency] - this.secondPrevious[frequency];
    this.secondPrevious[frequency] = this.firstPrevious[frequency];
    this.firstPrevious[frequency] = sine;
    this.filterLength[frequency] += 1;
    power = this.secondPrevious[frequency] * this.secondPrevious[frequency] + this.firstPrevious[frequency] * this.firstPrevious[frequency] - (coefficient * this.firstPrevious[frequency] * this.secondPrevious[frequency]);
    this.totalPower[frequency] += sample * sample;
    if (this.totalPower[frequency] === 0) {
      this.totalPower[frequency] = 1;
    }
    this.energies[frequency] = power / this.totalPower[frequency] / this.filterLength[frequency];
    return this.energies[frequency];
  };

  Goertzel.prototype._initializeCoefficients = function(frequencies) {
    var frequency, j, len, normalizedFrequency, results;
    this.coefficient = {};
    results = [];
    for (j = 0, len = frequencies.length; j < len; j++) {
      frequency = frequencies[j];
      normalizedFrequency = frequency / this.sampleRate;
      results.push(this.coefficient[frequency] = 2.0 * Math.cos(2.0 * Math.PI * normalizedFrequency));
    }
    return results;
  };

  Goertzel.prototype._queueSine = function(sample, frequency) {
    this.secondPrevious[frequency] = this.firstPrevious[frequency];
    return this.firstPrevious[frequency] = sample;
  };

  Goertzel.Utilities = {
    floatToIntSample: function(floatSample) {
      var intSample;
      intSample = floatSample * 32768;
      if (intSample > 32767) {
        return 32767;
      } else if (intSample < -32768) {
        return -32768;
      }
      return Math.round(intSample);
    },
    downsampleBuffer: function(buffer, downsampleRate, mapSample) {
      var bufferLength, downsampledBuffer, i, sample;
      bufferLength = buffer.length;
      downsampledBuffer = new (Uint8ClampedArray || Array)(bufferLength / downsampleRate);
      i = 0;
      while (i < bufferLength) {
        sample = buffer[i];
        if (mapSample) {
          downsampledBuffer[i] = mapSample(sample, i, buffer.length, downsampleRate);
        } else {
          downsampledBuffer[i] = sample;
        }
        i += downsampleRate;
      }
      return downsampledBuffer;
    },
    eachDownsample: function(buffer, downSampleRate, fn) {
      var bufferLength, downSampledBufferLength, i, results, sample;
      i = 0;
      bufferLength = buffer.length;
      downSampledBufferLength = bufferLength / downSampleRate;
      results = [];
      while (i < bufferLength) {
        sample = buffer[i];
        if (typeof fn === "function") {
          fn(sample, i, downSampledBufferLength);
        }
        results.push(i += downSampleRate);
      }
      return results;
    },
    hamming: function(sample, sampleIndex, bufferSize) {
      return sample * (0.54 - 0.46 * Math.cos(2 * Math.PI * sampleIndex / bufferSize));
    },
    exactBlackman: function(sample, sampleIndex, bufferSize) {
      return sample * (0.426591 - 0.496561 * Math.cos(2 * Math.PI * sampleIndex / bufferSize) + 0.076848 * Math.cos(4 * Math.PI * sampleIndex / bufferSize));
    },
    peakFilter: function(energies, sensitivity) {
      var peak, secondPeak, thirdPeak, trough;
      energies = energies.sort().reverse();
      peak = energies[0];
      secondPeak = energies[1];
      thirdPeak = energies[2];
      trough = energies.reverse()[0];
      if (secondPeak > peak / sensitivity || thirdPeak > secondPeak / (sensitivity / 2) || trough > peak / (sensitivity / 2)) {
        return true;
      } else {
        return false;
      }
    },
    doublePeakFilter: function(energies1, energies2, sensitivity) {
      if ((this.peakFilter(energies1, sensitivity) === true) || (this.peakFilter(energies2, sensitivity) === true)) {
        return true;
      } else {
        return false;
      }
    },
    generateSineBuffer: function(frequencies, sampleRate, numberOfSamples) {
      var buffer, frequency, i, j, len, val, volumePerSine;
      buffer = new (Float32Array || Array)(numberOfSamples);
      volumePerSine = 1 / frequencies.length;
      i = 0;
      while (i < numberOfSamples) {
        val = 0;
        for (j = 0, len = frequencies.length; j < len; j++) {
          frequency = frequencies[j];
          val += Math.sin(Math.PI * 2 * (i / sampleRate) * frequency) * volumePerSine;
        }
        buffer[i] = val;
        i++;
      }
      return buffer;
    },
    generateWhiteNoiseBuffer: function(sampleRate, numberOfSamples) {
      var buffer, i;
      buffer = new (Float32Array || Array)(numberOfSamples);
      i = 0;
      while (i < numberOfSamples) {
        buffer[i] = Math.random() * 2 - 1;
        i++;
      }
      return buffer;
    },
    floatBufferToInt: function(floatBuffer) {
      var floatBufferLength, i, intBuffer;
      floatBufferLength = floatBuffer.length;
      intBuffer = new (Uint8ClampedArray || Array)(floatBufferLength);
      i = 0;
      while (i < floatBufferLength) {
        intBuffer[i] = Goertzel.Utilities.floatToIntSample(floatBuffer[i]);
        i++;
      }
      return intBuffer;
    },
    averageDecibels: function(buffer) {
      var bufferLength, i, sum;
      sum = 0;
      bufferLength = buffer.length;
      i = 0;
      while (i < bufferLength) {
        sum += Math.abs(buffer[i]);
        i++;
      }
      return sum / bufferLength;
    }
  };

  return Goertzel;

})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Goertzel;
} else if (typeof define === 'function' && define.amd) {
  define(function() {
    return Goertzel;
  });
} else {
  window.Goertzel = Goertzel;
}
