'use strict';

const express = require('express');
const router = express.Router();
const mime = require('mime');
const chalk = require('chalk');
const urlParse = require('url').parse;
const models = require('../../db/models');
const Song = models.Song;
const request = require('request');
const mm = require('music-metadata')
const fs = require('fs')
const https = require('https');
const util = require('util')

module.exports = router;

router.get('/', function (req, res, next) {
  Song.scope('defaultScope', 'populated').findAll({ where: req.query })
    .then(songs => res.json(songs))
    .catch(next);
});

router.param('songId', function (req, res, next, id) {
  Song.scope('defaultScope', 'populated').findById(id)
    .then(song => {
      if (!song) {
        const err = Error('Song not found');
        err.status = 404;
        throw err
      }
      req.song = song;
      next();
      return null; // silences bluebird warning about promises inside of next
    })
    .catch(next);
});

router.get('/:songId', function (req, res) {
  res.json(req.song);
});

function httpGet(url) {
  return new Promise(function (resolve, reject) {
    https.get(url, function (res) {
      switch (res.statusCode) {
        case 200:
          resolve(res);
          break;
        case 302: // redirect
          resolve(httpGet(res.headers.location));
          break;
        default:
          reject(new Error('Unexpected status-code:' + res.statusCode));
      }
    });
  });
}
function showMetadata(metadata,res) {
  const pic = metadata.common.picture[0]
  pic ? res
    .set('Content-Type', mime.lookup(pic.format))
    .send(pic.data)
    : res.redirect('/default-album.jpg')
}

router.get('/:songId/image', function (req, res, next) {
  const parsed = urlParse(req.song.url)
  if (parsed.protocol === 'file:') {
    return mm.parseFile(parsed.path, { native: true })
      .then(metadata => { showMetadata(metadata,res) })
      .catch(()=>res.redirect('/default-album.jpg'))
  }else {
    httpGet(req.song.url, { native: true }).then(metadata => {
      const mimeType = metadata.headers['content-type'];
      // console.log('Parsing: ' + mimeType);
      return mm.parseStream(metadata, mimeType, { native: true })
        .then(metadata => { showMetadata(metadata,res) });
    }).catch(function (err) {
      console.error(err.message);
    });
  }
});

router.get('/:songId/audio', function (req, res, next) {
  const url = urlParse(req.song.url)
  url.protocol === 'file:' ?
    res.sendFile(decodeURIComponent(url.path))
    : res.redirect(req.song.url)
});

