TD.value('requestFileSystem', window.requestFileSystem ||
                              window.webkitRequestFileSystem);

TD.factory('fileSelector', function($rootScope, $q, log, requestFileSystem,
                                    UIFileSelector, webDAVFs) {

  function createUIFileSelector(factory) {
    var defered = $q.defer();
    factory.call(null, function(fs) {
      defered.resolve(fs);
      $rootScope.$digest();
    }, function(error) {
      defered.reject(error);
      $rootScope.$digest();
    });
    return new UIFileSelector(defered.promise);
  }

  var url = (chrome.app && chrome.app.window) ?
      chrome.app.window.current().webDAVUrl :
      '/dav/';

  if (url) {
    log('Using WebDAV filesystem at ' + url);
    return createUIFileSelector(webDAVFs.create.bind(null, url));
  }

  if (chrome.fileSystem) {
    log('Using local file system');
    return chrome.fileSystem;
  }

  log('Using local file system (sandboxed)');
  return createUIFileSelector(
      requestFileSystem.bind(null, window.PERSISTENT, 5 * 1024 * 1024));
});
