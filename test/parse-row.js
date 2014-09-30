'use strict';

var test = require('tap').test
  , parseRow = require('../parse-row')
  , fs = require('fs')

function inspect(obj, depth) {
  console.error(require('util').inspect(obj, false, depth || 5, true));
}

test('\nrow with all info and all links', function (t) {
  var rowHtml = fs.readFileSync(__dirname + '/fixtures/row-all-links.html', 'utf8')
  var parsed = parseRow(rowHtml)
  t.deepEqual(
      parsed
    , { commonName: 'Grey Tinamou',
        scientificName: 'Tinamus tao kleei',
        date: '2014-04-26',
        time: '06:30',
        country: 'Ecuador',
        loc: 'Copalinga Lodge (Zamora - Zamora Chinchipe)',
        elevation: '950',
        type: 'song',
        downloadLink: 'http://www.xeno-canto.org/sounds/uploaded/RJNSQXBIJE/XC176277-9.%20Tinamus%20tao%20XC.MP3',
        rating: 'A' } 
    , 'parses all info correclty'
  )
  t.end()
})

test('\nrow with missing info and missing location link', function (t) {
  var rowHtml = fs.readFileSync(__dirname + '/fixtures/row-no-loc-link-no-time-no-elevation.html', 'utf8')
  var parsed = parseRow(rowHtml)
  t.deepEqual(
      parsed
    , { commonName: 'Uniform Finch',
        scientificName: 'Haplospiza unicolor',
        date: '2004-05-16',
        time: '?:?',
        country: 'Argentina',
        loc: 'Reserva Yaguarundi, Misiones',
        elevation: '?',
        type: 'song',
        downloadLink : 'http://www.xeno-canto.org/sounds/uploaded/JQSYKZHEMB/FINCH%20Uniform_02_Reserva%20Yaguarundi_Misiones_AR_16MAY04_Rosendo%20Fraga.mp3',
        rating: 'B' } 
    , 'parses all info correclty'
  )
  t.end()
})

test('\nrow with less than 12 columns', function (t) {
  var rowHtml = fs.readFileSync(__dirname + '/fixtures/row-less-than-12-cols.html', 'utf8')
  var parsed = parseRow(rowHtml)
  t.deepEqual(
      parsed
    , { commonName: 'Grey Tinamou',
        scientificName: 'Tinamus tao kleei',
        date: '2014-04-26',
        time: '06:30',
        country: 'Ecuador',
        loc: 'Copalinga Lodge (Zamora - Zamora Chinchipe)',
        elevation: '950',
        type: 'song',
        downloadLink: 'http://www.xeno-canto.org/sounds/uploaded/RJNSQXBIJE/XC176277-9.%20Tinamus%20tao%20XC.MP3',
        rating: 'N/A' } 
    , 'parses all info correclty'
  )
  t.end()
})
