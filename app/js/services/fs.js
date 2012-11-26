TD.factory('fs', function($http, log) {

  var endpoint = '/api/';

  return {
    saveFile: function(fileEntry, content, type) {
      return $http.put(endpoint + fileEntry.fullPath, content);
    },

    loadFile: function(fileEntry) {
      log('Loading file', fileEntry);
      return $http.get(endpoint + fileEntry.fullPath).then(function(res) {
        return res.data;
      });
    }
  };
});
