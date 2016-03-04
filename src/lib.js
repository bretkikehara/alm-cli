var argv = require('yargs')
    .options({
      'debug': {
        alias: 'd',
        default: false,
        type: 'boolean'
      }
    })
    .argv,
    fs = require('fs'),
    request = require('request'),
    qs = require('querystring'),
    glob = require('glob'),
    colors = require('colors'),
    log = {
      _msg: function (args) {
        return [].splice.call(args, 0).join(' ')
      },
      suc: function () {
        console.error(colors.green(log._msg(arguments)));
      },
      err: function () {
        console.error(colors.red(log._msg(arguments)));
      },
      info: function () {
        console.log(log._msg(arguments));
      },
      debug: function () {
        if (argv.debug) {
          console.log(log._msg(arguments));
        }
      }
    };

exports.log = log;

function getHost () {
  return argv.host || 'http://localhost:5000'
}

function putObject (url, params, body) {
  return new Promise(function (resolve, reject) {
    url = url + '?' + qs.stringify(params);
    request.post(url, {
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
    if (!tokenCfg) {
      return reject({
        error: 'Token config is empty'
      });
    }
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
    if (!path) {
      reject('Path not defined');
    }
    fs.readFile(path, function (err, body) {
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
    }, function (o) {
      log.err(o.error.message)
      log.err(o.response);
      cfg.token = 'request error';
      return cfg;
    });
  });
};

exports.readConfig = function (path) {
  return new Promise(function (resolve, reject) {
    if (!path) {
      return reject();
    }
    fs.readFile(path, function (err, data) {
      if (err) {
        reject(err);
      } else {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      }
    });
  });
};

exports.writeConfig = function (path, cfg) {
  return new Promise(function (resolve, reject) {
    fs.writeFile(path, JSON.stringify(cfg), function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

exports.uploadConfig = function (bucket, secret, localizationCfg) {
  return putObject([getHost(), 'upload', bucket].join('/'), {
    'secret': secret,
    'token': localizationCfg.token,
  }, localizationCfg);
};

exports.uploadLocales = function (bucket, secret, localizationCfg, workingPath) {
  var uploads = [];
  localizationCfg.languages.forEach(function (lang) {
    uploads = uploads.concat(localizationCfg.bundles.map(function (bundle) {
      return exports.readLocalizationBundle([workingPath, localizationCfg.basePath, lang, bundle + localizationCfg.fileExtension].join('/')).then(function (body) {
        return putObject([getHost(), 'upload', bucket, lang, bundle + localizationCfg.fileExtension].join('/'), {
          'basePath': localizationCfg.basePath,
          'secret': secret,
          'token': localizationCfg.token,
        }, body);
      });
    }));
  });
  return Promise.all(uploads);
};

exports.upload = function (localizationCfg, secret, bucket, workingPath) {
  // return exports.uploadConfig(bucket, secret, localizationCfg);
  return Promise.all([
    exports.uploadConfig(bucket, secret, localizationCfg),
    exports.uploadLocales(bucket, secret, localizationCfg, workingPath),
  ]);
};
