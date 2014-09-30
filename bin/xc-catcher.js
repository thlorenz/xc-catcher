#!/usr/bin/env node
'use strict';

var log         = require('npmlog')
  , minimist    = require('minimist')
  , path        = require('path')
  , fs          = require('fs')
  , BirdScraper = require('../birdscraper')
  , home        = process.env.HOME || process.env.USERPROFILE

function usage() {
  var usageFile = path.join(__dirname, 'usage.txt');
  fs.createReadStream(usageFile).pipe(process.stdout);
  return;
}

function forwardLogs(log, to, name) {
  to.on('info', log.info.bind(log, name))
  to.on('debug', log.verbose.bind(log, name))
  to.on('error', log.error.bind(log, name))
  to.on('warn', log.warn.bind(log, name))
}

(function () {
  var argv = minimist(process.argv.slice(2)
    , { boolean: [ 'h', 'help' ]
      , string: [ 'loglevel', 'l', 'outdir', 'o', 'datadir', 'd', 'from', 'to', 'concurrency', 'c' ]
    });

  log.level = argv.loglevel || argv.l || 'info';

  if (argv.h || argv.help) return usage();

  var outdir = argv.outdir || argv.o;

  var concurrency = parseInt(argv.concurrency || argv.c || 20);

  var datadir = argv.datadir || argv.d;
  if (datadir) {
    log.info('xc-catcher', 'Pulling .mp3 files for bird data inside %s. Not pulling any new bird data.', datadir);
    // TODO: 
    return;
  }

  datadir = path.join(home, 'xc-catcher-data');

  log.info('xc-catcher', 'Pulling bird data first and storing inside %s', datadir);

  var birdScraper = new BirdScraper({ dataDir: datadir, concurrency: concurrency })
  forwardLogs(log, birdScraper, 'xc-catcher');

  var from = argv.from || 1
    , to = argv.to || BirdScraper.PAGES

  log.info('xc-catcher', 'Pulling data for pages %d to %d, %d at a time.', from, to, concurrency);
  birdScraper.scrape(from, to);
})()
