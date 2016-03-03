var argv = require('yargs').argv,
    request = require('request'),
    qs = require('querystring'),
    glob = require('glob');

function getHost () {
  return argv.host || 'http://localhost:5000'
}

function retrieveToken (tokenCfg) {
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
function gatherLocalizationBundles (localizationCfg) {
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
        'bundles': Object.keys(bundles).map(function (bundle) {
          return bundle.substring(0, bundle.indexOf(localizationCfg.fileExtension))
        }),
      });
    });
  });
};

exports.generateConfig = function (localizationCfg, tokenCfg) {
  return gatherLocalizationBundles(localizationCfg).then(function (localizationCfg) {
    return retrieveToken(tokenCfg).then(function (resp) {
      if (resp.error) {
        return Promise.reject(new Error('response error'));
      }
      localizationCfg.token = JSON.parse(resp.body).token;
      return localizationCfg;
    }).catch(function (o) {
      console.error(colors.red(o.error.message), o.response);
      localizationCfg.token = 'request error';
      return localizationCfg;
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
