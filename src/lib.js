var request = require('request'),
    qs = require('querystring'),
    glob = require('glob');

function retrieveToken (params) {
  return new Promise(function (resolve, reject) {
    try {
      if (!params || !params.key || !params.aws_access_key_id || !params.aws_secret_access_key || !params.region_name) {
        throw new Error('define params to encrypt token');
      }

      request(params.host + '/auth/token?' + qs.stringify(params), function (error, response, body) {
        if (error) {
          reject(error);
        } else {
          resolve({
            'error': error,
            'response': response,
            'body': body,
          });
        }
      });
    } catch(e) {
      reject(e);
    }
  });
}
exports.retrieveToken = retrieveToken;

// options is optional
function getConfig (cfg) {
  // TODO FIX VALIDATION
  cfg.workingPath = cfg.workingPath + cfg.basePath;
  return new Promise(function (resolve, reject) {
    var languages = {},
        bundles = {};
    glob("**/*" + cfg.fileExtension, {
      cwd: cfg.workingPath,
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
        'basePath': cfg.basePath,
        'languages': Object.keys(languages),
        'bundles': Object.keys(bundles),
      });
    });
  });
}
exports.getConfig = getConfig;

