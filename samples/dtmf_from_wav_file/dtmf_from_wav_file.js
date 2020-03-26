const fs = require('fs');
const wav = require('wav');

const DTMF = require('../../lib/dtmf')
const Goertzel = require('../../index')

var usage = () => {
	console.log(`
Usage: node ${process.argv[1]} file_name samples
Ex:    node ${process.argv[1]} 1234.wav 1024
`)
}

if(process.argv.length != 4) {
	usage()
	process.exit(1)
}

var file = process.argv[2]
var samples = parseInt(process.argv[3])

var rs = fs.createReadStream(file)
var reader = new wav.Reader()

var acc = []

reader.on('format', function(format) {
        console.log(format)

		if(format.bitDepth != 32) {
			console.error('Invalid wav format: bitDepth must be 32')
			process.exit(1)
		}

		if(!format.signed) {
			console.error('Invalid wav format: signed must be true')
			process.exit(1)
		}

		if(!format.float) {
			console.error('Invalid wav format: float must be true')
			process.exit(1)
		}

        var dtmf = new DTMF({
                sampleRate: format.sampleRate,
                repeatMin: 0,
        })

        dtmf.on('decode', value => {
                if(value) console.log(`digit: ${value}`)
        })

        reader.on('data', (data) => {
                acc.push(data)
        })

        reader.on('end', () => {
                var data = Buffer.concat(acc)

                var len = data.length

                var b = new Array()

                for(var i=0; i<(data.length / 4)-1; i++) {
                        b.push( data.readFloatLE(i*4) )
                }

                for(var i=0; i<Math.floor(data.length / samples); i++) {
                        var digits = dtmf.processBuffer(b.slice(i*samples, i*samples + samples))
                }
        })
})

rs.pipe(reader)

