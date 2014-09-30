'use strict';

var cheerio = require('cheerio');

function cc(el) {
  return { type: el.type, name: el.name, attribs: el.attribs, children: el.children }  
}

function clean(s) {
  if (!s) return '';
  return s
    .replace('\n', ' ')
    .replace(/ +/, ' ')
    .trim()
}

function textColFrom(cols, idx) {
  var col = cols[idx];
  if (!col) return 'N/A';
  var children = col.children;
  if (!children.length || !children[0].data) return 'N/A';
  return clean(children[0].data)
}

function getCommonName(cols) {
  var commonNameInfo = cols.find('.common-name')
  try {
    return clean(commonNameInfo.find('a')[0].children[0].data)
  } catch (err) {
    return 'getCommonName -- ERROR -- ' + err.toString();
  }
}

function getScientificName(cols) {
  var scientificNameInfo = cols.find('.scientific-name')
  try {
    return clean(scientificNameInfo[0].children[0].data);
  } catch (err) {
    return 'getScientificName  -- ERROR -- ' + err.toString();
  }
}

function getLocation(cols) {
  // some locations are linked, but not all
  var locationInfo = cheerio(cols[7]).find('a')
  try {
    return locationInfo && locationInfo.length 
      ? clean(locationInfo[0].children[0].data)
      : textColFrom(cols, 7);
  } catch (err) {
    return 'getLocation  -- ERROR -- ' + err.toString();
  }
}

function getDownloadLink(cols) {
  var el = cheerio(cols[0]).find('.jp-type-single');
  if (!el) return 'N/A';
  return el.data('xc-filepath');
}

function getRating(cols) {
  if (cols.length < 12) return 'N/A';

  var actionsInfo = cheerio(cols[11])
    , downloadLink = actionsInfo.find('a')[0].attribs.href
    , ratingInfo = actionsInfo.find('li.selected')

  var spans = cheerio(ratingInfo).find('span');
  if (!spans.length) return 'N/A';

  var span = spans[0];
  if (!span.children.length || !span.children[0].data) return 'N/A';

  return span.children[0].data;
}


var go = module.exports = function parseRow(rowHtml) {

  var c = cheerio(rowHtml)
  var cols = c.find('td');

  function textCol(idx) {
    return textColFrom(cols, idx)
  }

  var commonName     = getCommonName(cols)
    , scientificName = getScientificName(cols)
    , date           = textCol(4)
    , time           = textCol(5)
    , country        = textCol(6)
    , loc            = getLocation(cols)
    , elevation      = textCol(8)
    , type           = textCol(9)
    , downloadLink   = getDownloadLink(cols)
    , rating         = getRating(cols)
 
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
