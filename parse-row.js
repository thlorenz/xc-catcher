'use strict';

var cheerio = require('cheerio');

function cc(el) {
  return { type: el.type, name: el.name, attribs: el.attribs, children: el.children }  
}

function clean(s) {
  return s
    .replace('\n', ' ')
    .replace(/ +/, ' ')
    .trim()
}

function textColFrom(cols, idx) {
  return clean(cols[idx].children[0].data)
}

function getCommonName(cols) {
  var commonNameInfo = cols.find('.common-name')
  return clean(commonNameInfo.find('a')[0].children[0].data)
}

function getScientificName(cols) {
  var scientificNameInfo = cols.find('.scientific-name')
  return clean(scientificNameInfo[0].children[0].data);
  
}

function getLocation(cols) {
  // some locations are linked, but not all
  var locationInfo = cheerio(cols[7]).find('a')
  return locationInfo && locationInfo.length 
    ? clean(locationInfo[0].children[0].data)
    : textColFrom(cols, 7);
}


var go = module.exports = function parseRow(rowHtml) {

  var c = cheerio(rowHtml)
  var cols = c.find('td');

  function textCol(idx) {
    return textColFrom(cols, idx)
  }

  var commonName = getCommonName(cols) 
    , scientificName = getScientificName(cols)
    , date      = textCol(4)
    , time      = textCol(5)
    , country   = textCol(6)
    , loc       = getLocation(cols)
    , elevation = textCol(8)
    , type      = textCol(9)
 
  var actionsInfo = cheerio(cols[11])
    , downloadLink = actionsInfo.find('a')[0].attribs.href
    , ratingInfo = actionsInfo.find('li.selected')
    , rating = cheerio(ratingInfo).find('span')[0].children[0].data

  return { 
      commonName     : commonName
    , scientificName : scientificName
    , date           : date
    , time           : time
    , country        : country
    , loc            : loc
    , elevation      : elevation
    , type           : type
    , downloadLink   : downloadLink
    , rating         : rating
  }
}

// Test
