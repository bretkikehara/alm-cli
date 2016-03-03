var colors = require('colors/safe'),
    fs = require('fs'),
    lib = require('./lib.js');

exports.config = function (localizationCfg, tokenCfg) {
  return lib.generateConfig(localizationCfg, tokenCfg).then(function (cfg) {
    console.log('ALM Config:\n', cfg);
  });
};

exports.upload = function (localizationCfg, tokenCfg, bucket) {
  return lib.generateConfig(localizationCfg, tokenCfg).then(function (localizationCfg) {
    return lib.uploadConfig(bucket, tokenCfg.secret, localizationCfg).then(function (o) {
      console.log(o.body);
    }).catch(function (o) {
      console.error(o.error.message);
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
