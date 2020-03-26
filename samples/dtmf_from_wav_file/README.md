This sample shows lib/dtmf.js doesn't do continuous DTMF detection: it processes each buffer independently and doesn't consider what happened when processing previous buffers.

The file 1234.wav contains digits 
```
  1 2 3 4 
```
once.

But depending on how data is fed to dtmf.processBuffer(), we get digit duplication and error (digit 'D'):
```
$ node dtmf_from_wav_file.js 1234.wav 1024
{
  audioFormat: 3,
  endianness: 'LE',
  channels: 1,
  sampleRate: 16000,
  byteRate: 64000,
  blockAlign: 4,
  bitDepth: 32,
  signed: true,
  float: true
}
digit: 1
digit: 1
digit: 1
digit: 2
digit: 2
digit: 2
digit: D
digit: 3
digit: 3
digit: 4
digit: 4

```

