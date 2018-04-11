'use strict';

const GOERTZEL_ATTRIBUTES = ['firstPrevious', 'secondPrevious', 'totalPower', 'filterLength', 'energies', 'phases'],
      GOERTZEL_ATTRIBUTES_LENGTH = GOERTZEL_ATTRIBUTES.length,
      { atan2, cos, sin, PI } = Math;
/**
 * A pure JavaScript implementation of the Goertzel algorithm, a means of efficient DFT signal processing.
 * @param {object}        options
 * @param {array}         options.frequencies - The frequencies to be processed.
 * @param {number=44100}  options.sampleRate  - The sample rate of the samples to be processed.  Defaults to 44100.
 * @param {boolean=false} options.getPhase    - Calculates the current phase of each frequency.  Disabled by default.
 */
class Goertzel {

  constructor(options={}) {
    this.options        = options;
    this.sampleRate     = options.sampleRate  || 44100;
    this.frequencies    = options.frequencies || [];
    this._initializeConstants(this.frequencies);
    this.refresh();
  }
  /**
   * Runs a sample through the Goertzel algorithm, updating the energies for each frequency.
   * @param {number} sample 
   * @example
   * const g = new Goertzel({frequencies: [697, 770, 852, 941]});
   * g.processSample(42);
   * g.processSample(84);
   * g.energies;
   * // { '697': 0.8980292970055112,
   * //   '770': 0.8975953139667142,
   * //   '852': 0.8970565383230514,
   * //   '941': 0.8964104403348228 }
   */
  processSample(sample) {
    this.currentSample = sample;
    const len = this.frequencies.length;
    let i = 0;
    while(i < len){
      let frequency = this.frequencies[i];
      this._getEnergyOfFrequency(sample, frequency);
      i++;
    }
  }
  /**
   * Re-initializes the state by zeroing-out all values.  You will need to do this for every window you wish to analyze.
   */
  refresh() {
    let i = 0;
    while(i<GOERTZEL_ATTRIBUTES_LENGTH){
      let attr = GOERTZEL_ATTRIBUTES[i];
      this[attr] = {};
      i++;
    }
    this.frequencies.forEach(frequency => {
      let i = 0;
      while(i<GOERTZEL_ATTRIBUTES_LENGTH){
        let attr = GOERTZEL_ATTRIBUTES[i];
        this[attr][frequency] = 0.0;
        i++;
      }
    });
  }

  _getEnergyOfFrequency(sample, frequency) {
    let f1 = this.firstPrevious[frequency],
        f2 = this.secondPrevious[frequency];
    const coefficient = this.coefficient[frequency],
          sine        = (sample + (coefficient * f1)) - f2;
    f2 = f1;
    f1 = sine;
    this.filterLength[frequency] += 1;
    const power      = ((f2 * f2) + (f1 * f1)) - (coefficient * f1 * f2),
          totalPower = this.totalPower[frequency] += sample * sample;
    if (totalPower === 0) this.totalPower[frequency] = 1;
    this.energies[frequency]       = power / totalPower / this.filterLength[frequency];
    if(this.options.getPhase) {
      let real      = (f1 - f2 * this.cosine[frequency]),
          imaginary = (f2 * this.sine[frequency]);
      this.phases[frequency] = atan2(imaginary, real);
    }
    this.firstPrevious[frequency]  = f1;
    this.secondPrevious[frequency] = f2;
  }

  _initializeConstants(frequencies) {
    const len = frequencies.length;
    let frequency,
        normalizedFrequency,
        omega,
        cosine,
        i = 0;
    this.sine        = {},
    this.cosine      = {},
    this.coefficient = {};
    while(i<len){
      frequency = frequencies[i];
      normalizedFrequency = frequency / this.sampleRate;
      omega  = 2.0 * PI * normalizedFrequency;
      cosine = cos(omega);
      this.sine[frequency]        = sin(omega);
      this.cosine[frequency]      = cosine;
      this.coefficient[frequency] = 2.0 * cosine;
      i++;
    }
  }
}

Goertzel.Utilities = require('./lib/util');

module.exports = Goertzel;

