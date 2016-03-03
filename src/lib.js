var argv = require('yargs').argv,
    fs = require('fs'),
    request = require('request'),
    qs = require('querystring'),
    glob = require('glob'),
    colors = require('colors');

function getHost () {
  return argv.host || 'http://localhost:5000'
}

function upload (url, secret, token, body) {
  return new Promise(function (resolve, reject) {
    request.post(url + '?' + qs.stringify({
      'secret': secret,
      'token': token,
    }), {
      body: JSON.stringify(body)
    }, function (error, response, body) {
      if (error) {
        reject({
          'error': error,
          'response': response,
        });
      } else {
        resolve({
          'response': response,
          'body': body,
        });
      }
    });
  });
}

var log = {
  suc: function () {
    console.error(colors.green([].splice.call(arguments, 0).join(' ')));
  },
  err: function () {
    console.error(colors.red([].splice.call(arguments, 0).join(' ')));
  },
  info: function () {
    var msg = Array.prototype.slice(arguments, 1).join(' ');
    console.log(msg);
  }
};
exports.log = log;

exports.version = function () {
  fs.readFile(__dirname + '/../package.json', 'utf8', function (err, data) {
    if (err) {
      log.err(err);
    }
    log.info('alm-cli version:', JSON.parse(data).version);
  });
};

exports.retrieveToken = function (tokenCfg) {
  return new Promise(function (resolve, reject) {
    request(getHost() + '/auth/token?' + qs.stringify(tokenCfg), function (error, response, body) {
      if (error) {
        reject({
          'error': error,
          'response': response,
        });
      } else {
        resolve({
          'response': response,
          'body': body,
        });
      }
    });
  });
};

// options is optional
exports.gatherLocalizationBundles = function (localizationCfg) {
  // TODO FIX VALIDATION
  return new Promise(function (resolve, reject) {
    var languages = {},
        bundles = {};
    glob("**/*" + localizationCfg.fileExtension, {
      cwd: localizationCfg.workingPath + '/' + localizationCfg.basePath,
    }, function (er, files) {
      if (er) {
        return reject(er);
      }
      files.forEach(function (name) {
        var data = name.split('/');
        languages[data[0]] = true;
        bundles[data[1]] = true;
      });

      resolve({
        'basePath': localizationCfg.basePath,
        'languages': Object.keys(languages),
        'fileExtension': localizationCfg.fileExtension,
        'bundles': Object.keys(bundles).map(function (bundle) {
          return bundle.substring(0, bundle.indexOf(localizationCfg.fileExtension))
        }),
      });
    });
  });
};

exports.readLocalizationBundle = function (path) {
  return new Promise(function (resolve, reject) {
    fs.readFile(path, {'enc': 'utf8'}, function (err, body) {
      if (err) {
        reject(err);
      } else {
        resolve(body);
      }
    });
  });
}

exports.config = function (localizationCfg, tokenCfg) {
  return exports.gatherLocalizationBundles(localizationCfg).then(function (cfg) {
    if (!tokenCfg) {
      return cfg;
    }

    return exports.retrieveToken(tokenCfg).then(function (resp) {
      if (resp.error) {
        return Promise.reject(new Error('response error'));
      }
      cfg.token = JSON.parse(resp.body).token;
      return cfg;
    }).catch(function (o) {
      log.err(o.error.message), o.response;
      cfg.token = 'request error';
      return cfg;
    });
  });
};

exports.uploadConfig = function (bucket, secret, localizationCfg) {
  return new Promise(function (resolve, reject) {
    request.post(getHost() + '/upload/' + bucket + '?' + qs.stringify({
      'secret': secret,
      'token': localizationCfg.token,
    }), {
      body: JSON.stringify(localizationCfg)
    }, function (error, response, body) {
      if (error) {
        reject({
          'error': error,
          'response': response,
        });
      } else {
        resolve({
          'response': response,
          'body': body,
        });
      }
    });
  });
};

exports.uploadLocales = function (bucket, secret, localizationCfg) {
  var uploads = [];
  localizationCfg.languages.forEach(function (lang) {
    uploads.concat(localizationCfg.bundles.map(function (bundle) {
      return exports.readLocalizationBundle([lang, bundle].join('/')).then(function (body) {
        return upload([getHost(), 'upload', bucket, lang, bundle].join('/'), secret, token, body);
      });
    }));
  });
  return uploads;
};

exports.upload = function (localizationCfg, tokenCfg, bucket) {
  return exports.config(localizationCfg, tokenCfg).then(function (localizationCfg) {
    return Promise.all([
      exports.uploadConfig(bucket, tokenCfg.secret, localizationCfg),
      exports.uploadLocales(bucket, tokenCfg.secret, localizationCfg),
    ]);
  });
};
