if (!navigator.getUserMedia)
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
                  navigator.mozGetUserMedia || navigator.msGetUserMedia

if (navigator.getUserMedia){
  navigator.getUserMedia({audio:true}, success, function(e) {
    alert('Error capturing audio.')
  })
} else alert('getUserMedia not supported in this browser.')


function success(e){
  audioContext = window.AudioContext || window.webkitAudioContext
  context = new audioContext()
  volume = context.createGain()
  audioInput = context.createMediaStreamSource(e)
  audioInput.connect(volume)
  var bufferSize = 512
  recorder = context.createScriptProcessor(bufferSize, 1, 1)
  var outputElement = document.querySelector('#output')
  var dtmf = new DTMF({
    sampleRate: context.sampleRate,
    repeatMin: 6,
    downsampleRate: 1,
    energyThreshold: 0.005,
    filter: function(e){
      return !Goertzel.Utilities.doublePeakFilter(e.energies['high'], e.energies['low'], 1.4);
    }
  })
  dtmf.on("decode", function(value){
    if (value != null){
      outputElement.innerHTML = outputElement.innerHTML + value
    }
  })
  recorder.onaudioprocess = function(e){
    var buffer = e.inputBuffer.getChannelData(0)
    dtmf.processBuffer(buffer)
  }
  volume.connect (recorder)
  recorder.connect (context.destination) 
}


