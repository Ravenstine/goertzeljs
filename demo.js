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
    var bufferSize = 2048
    recorder = context.createJavaScriptNode(bufferSize, 1, 1)
    var outputElement = document.querySelector('#output')
    var dtmf = new DTMF(context.sampleRate,5,0)
    dtmf.onDecode = function(value){
      outputElement.innerHTML = outputElement.innerHTML + value
    }
    recorder.onaudioprocess = function(e){
        var bin = e.inputBuffer.getChannelData (0)
        dtmf.processBin(bin)
        dtmf.refresh()
    }

    volume.connect (recorder)
    recorder.connect (context.destination) 
}


