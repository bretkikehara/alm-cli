var colors = require('colors/safe'),
    fs = require('fs'),
    lib = require('./lib.js');

exports.exec = function (localizationCfg, tokenCfg) {
  lib.getConfig(localizationCfg).then(function (cfg) {
    lib.retrieveToken(tokenCfg).then(function (resp) {
      if (resp.error) {
        return Promise.reject(new Error('response error'));
      }
      cfg.token = JSON.parse(resp.body).token;
      return cfg;
    }).catch(function (e) {
      console.error(colors.red(e.message));
      cfg.token = 'request error';
      return cfg;
    }).then(function () {
      console.log('ALM Config:\n', cfg);
    });
  });
};

exports.version = function () {
  fs.readFile(__dirname + '/../package.json', 'utf8', function (err, data) {
    if (err) {
      console.error(colors.red(err));
    }
    console.log('alm-cli version:', JSON.parse(data).version);
  });
};
