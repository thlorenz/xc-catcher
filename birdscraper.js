'use strict';

var cheerio  = require('cheerio')
  , request  = require('request')
  , queue    = require('queue')
  , path     = require('path')
  , fs       = require('fs')
  , EE       = require('events').EventEmitter
  , inherits = require('util').inherits
  , mkdir    = require('mkdirp')
  , rmrf     = require('rimraf')
  , parse    = require('./parse-row')
  , urlTmpl  = 'http://www.xeno-canto.org/explore?pg={{page}}'
  , PAGES    = 6244

function BirdScraper(opts) {
  if (!(this instanceof BirdScraper)) return new BirdScraper(opts);
  opts = opts || {};
  this.concurrency = opts.concurrency || 20;
  this.dataDir = opts.dataDir || path.join(__dirname, 'data');
  this.results = [];

  if (!fs.existsSync(this.dataDir)) mkdir.sync(this.dataDir);

  this.initQueue();
}

inherits(BirdScraper, EE);

var proto = BirdScraper.prototype;
module.exports = BirdScraper;
BirdScraper.PAGES = PAGES;

proto.initQueue = function initQueue() {
  var self = this;
  self.queue = queue({ concurrency: self.concurrency });

  self.queue.on('success', function onsuccess(res, job) { 
    self.emit('debug', 'success') 
  })
  self.queue.on('error', function onerror(err, job) { 
    self.emit('error', { err: err, job: job }) 
  })
  self.queue.on('timeout', function ontimeout(next, job) { 
    self.emit('warn', 'timeout', { job: job }); 
    next(); 
  })
  self.queue.on('end', function onend() { 
    self.emit('end')
  })
}

proto.clean = function clean() {
  rmrf.sync(this.dataDir)
}

proto._scrapeHtml = function scrapeHtml(html) {
  var rows = [];

  // apply some fixes to the malformed html
  html = html.replace(/<tr >/g, '<tr>')

  // cannot simply find result rows bottom down, i.e. '.result tr' since the html is too broken
  // for cheerio to figuer it out
  var tableRows = cheerio(html)
    .find('.xc-button-audio')
    .map(function (idx, div) {
      var td = div.parent
      return cheerio(td.parent);
    })

  tableRows.each(function (idx, el) {
    if (idx === 0) return; // ignore table header
    rows.push(parse('<tr>' + cheerio(el).html() + '</tr>'))
  })
  return rows;
}

proto._scrapePage = function scrapePage(n, cb) {
  var self = this
    , filename = path.join(this.dataDir, 'page-' + n)

  fs.exists(filename, function (itdoes) {
    if (itdoes) { 
      self.emit('debug', 'File ' + path.basename(filename) + ' already exists, not scraping again.')
      return cb()
    } 

    var url = urlTmpl.replace(/{{page}}/, n)
    self.emit('debug', 'Requesting', url)

    request(url, function (err, res, body) {
      if (err) return cb(err);
      self.emit('debug', 'Fetched html for page ' + n + '(' + body.length + ') Parsing rows.') 
      var rows = self._scrapeHtml(body)
      var json = JSON.stringify(rows, null, 2)
      self.emit('info', 'Writing data for ' + rows.length + ' birds found on page ' + n + ' to ' + path.basename(filename))
      fs.writeFile(filename, json, 'utf8', cb)
    })
  })
}

proto.scrape = function scrape(from, to) {
  from = from || 1;
  to = to || PAGES;

  function onProcess(n, cb) {
    this._scrapePage(n, cb)
  }

  for (var i = from; i <= to; i++) {
    this.queue.push(onProcess.bind(this, i))
  }
  this.queue.start()
}

// TEST
function inspect(obj, depth) {
  console.error(require('util').inspect(obj, false, depth || 5, true));
}

function forwardLogs(log, to, name) {
  to.on('info', log.info.bind(log, name))
  to.on('debug', log.verbose.bind(log, name))
  to.on('error', log.error.bind(log, name))
  to.on('warn', log.warn.bind(log, name))
}

// Test
if (!module.parent && typeof window === 'undefined') {
  
  var birdScraper = new BirdScraper()
    , log = require('npmlog')

  log.level = 'verbose'

  forwardLogs(log, birdScraper, 'xc-catcher');
  birdScraper.scrape(1, 5);
}
