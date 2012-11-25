TD.factory('fs', function($q, $rootScope, log) {

  var endpoint = 'http://127.0.0.1:1337/';

  var createErrorHandler = function(defered) {
    return function(e) {
      var msg = '';

      switch (e.code) {
        case FileError.QUOTA_EXCEEDED_ERR:
          msg = 'QUOTA_EXCEEDED_ERR';
          break;
        case FileError.NOT_FOUND_ERR:
          msg = 'NOT_FOUND_ERR';
          break;
        case FileError.SECURITY_ERR:
          msg = 'SECURITY_ERR';
          break;
        case FileError.INVALID_MODIFICATION_ERR:
          msg = 'INVALID_MODIFICATION_ERR';
          break;
        case FileError.INVALID_STATE_ERR:
          msg = 'INVALID_STATE_ERR';
          break;
        default:
          msg = 'Unknown Error';
          break;
      }

      log('FS Error: ', e, msg);

      if (defered) {
        defered.reject(e);
        $rootScope.$digest();
      }
    };
  };

  return {

    saveFile: function(fileEntry, content, type) {
      var defered = $q.defer();

      var req = new XMLHttpRequest();
      req.open('PUT', endpoint + fileEntry.fullPath, true);
      req.setRequestHeader('Content-Type', type || 'text/plain');
      req.onreadystatechange = function() {
        if (req.readyState != 4)
          return;

        if (req.status === 200) {
          defered.resolve();
        } else {
          defered.reject(req.statusText);
        }
        $rootScope.$digest();
      };
      req.send(content);

      return defered.promise;
    },

    loadFile: function(fileEntry) {
      var defered = $q.defer();
      log('Loading file', fileEntry);

      var req = new XMLHttpRequest();
      req.open('GET', endpoint + fileEntry.fullPath, true);
      req.onreadystatechange = function() {
        if (req.readyState != 4)
          return;

        if (req.status === 200) {
          defered.resolve(req.responseText);
        } else {
          defered.reject(req.statusText);
        }
        $rootScope.$digest();
      };
      req.send();

      return defered.promise;
    }
  };
});
