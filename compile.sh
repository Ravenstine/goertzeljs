#!/bin/sh

coffee -o build -c -b src/goertzel.coffee 
coffee -o build -c -b src/dtmf.coffee
coffee -c -b spec/goertzel.spec.coffee
coffee -c -b spec/dtmf.spec.coffee