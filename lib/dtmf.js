'use strict';

const Goertzel = require('../index');

class DTMF { 
  constructor(options) {
    if (options == null) { options = {}; }
    this.options = {
      downsampleRate:   1,
      energyThreshold:  0,
      decibelThreshold: 0,
      repeatMin:        0,
      sampleRate:       44100
    };
    for (let option in options) {
      this.options[option] = options[option];
    }
    this.sampleRate = this.options.sampleRate / this.options.downsampleRate;
    this.frequencyTable = {
      [697]: {
        [1209]: '1',
        [1336]: '2',
        [1477]: '3',
        [1633]: 'A'
      },
      [770]: {
        [1209]: '4',
        [1336]: '5',
        [1477]: '6',
        [1633]: 'B'
      },
      [852]: {
        [1209]: '7',
        [1336]: '8',
        [1477]: '9',
        [1633]: 'C'
      },
      [941]: {
        [1209]: '*',
        [1336]: '0',
        [1477]: '#',
        [1633]: 'D'
      }
    };
    this.lowFrequencies = [];
    for (var key in this.frequencyTable) {
      this.lowFrequencies.push(parseInt(key));
    }
    this.highFrequencies = [];
    for (key in this.frequencyTable[this.lowFrequencies[0]]) {
      this.highFrequencies.push(parseInt(key));
    }
    this.allFrequencies = this.lowFrequencies.concat(this.highFrequencies);
    this.repeatCounter = 0;
    this.firstPreviousValue = '';
    this.goertzel = new Goertzel({
      frequencies: this.allFrequencies,
      sampleRate:  this.sampleRate
    });
    this.decodeHandlers = [];
    this.jobs = 
      {beforeProcess:  []};
  }

  processBuffer(buffer) {
    let value = '';
    let result = [];
    this._runJobs('beforeProcess', buffer);
    if (this.options.decibelThreshold && (Goertzel.Utilities.averageDecibels(buffer) < this.options.decibelThreshold)) { return result; }
    // Downsample by choosing every Nth sample.
    Goertzel.Utilities.eachDownsample(buffer, this.options.downsampleRate, (sample,i,downSampledBufferLength)=> {
      let windowedSample = Goertzel.Utilities.exactBlackman(sample, i, downSampledBufferLength);
      return this.goertzel.processSample(windowedSample);
    }
    );
    let energies = {
      high: [],
      low:  []
    };
    for (let fType of ['high', 'low']) {
      let i = 0;
      while (i < this[`${fType}Frequencies`].length) {
        let f = this[`${fType}Frequencies`][i];
        energies[fType].push(this.goertzel.energies[f]);
        i++;
      }
    }
    if ((this.options.filter && this.options.filter({goertzel: this.goertzel, energies})) || !this.options.filter) {
      value = this._energyProfileToCharacter(this.goertzel);
      if (((value === this.firstPreviousValue) || (this.options.repeatMin === 0)) && (value !== undefined)) {
        if (this.options.repeatMin !== 0) { this.repeatCounter += 1; }
        if (this.repeatCounter === this.options.repeatMin) {
          result.push(value);
          for (let handler of Array.from(this.decodeHandlers)) {
            setTimeout(handler(value), 0);
          }
        }
      } else {
        this.repeatCounter = 0;
        this.firstPreviousValue = value;
      }
    }
    this.goertzel.refresh();
    return result;
  }

  on(eventName, handler) {
    switch (eventName) {
      case "decode": return this.decodeHandlers.push(handler);
    }
  }

  calibrate(multiplier){
    if (multiplier == null) { multiplier = 1; }
    if (!this.jobs.beforeProcess) { this.jobs.beforeProcess = []; }
    return this.jobs.beforeProcess.push((buffer, dtmf) => dtmf.options.decibelThreshold = Goertzel.Utilities.averageDecibels(buffer) * multiplier);
  }

  // private

  _energyProfileToCharacter(register) {
    let { energies } = register;
    // Find high frequency.
    let highFrequency = 0.0;
    let highFrequencyEngergy = 0.0;
    for (var f of Array.from(this.highFrequencies)) {
      if ((energies[f] > highFrequencyEngergy) && (energies[f] > this.options.energyThreshold)) {
        highFrequencyEngergy = energies[f];
        highFrequency = f;
      }
    }
    // Find low frequency.
    let lowFrequency = 0.0;
    let lowFrequencyEnergy = 0.0;
    for (f of Array.from(this.lowFrequencies)) {
      if ((energies[f] > lowFrequencyEnergy) && (energies[f] > this.options.energyThreshold)) {
        lowFrequencyEnergy = energies[f];
        lowFrequency = f;
      }
    }
    if (this.frequencyTable[lowFrequency] !== undefined) {
      return this.frequencyTable[lowFrequency][highFrequency] || null;
    }
  }

  _runJobs(jobName, buffer) {
    if (this.jobs[jobName]) {
      let queueLength = this.jobs[jobName].length;
      let i = 0;
      return (() => {
        let result = [];
        while (i < queueLength) {
          this.jobs[jobName].pop()(buffer, this);
          result.push(i++);
        }
        return result;
      })();
    }
  }
}

module.exports = DTMF;
