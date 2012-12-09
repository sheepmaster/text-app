TD.factory('webDAVFs', function($q) {
  var __extends = this.__extends || function(d, b) {
    d.prototype = Object.create(b.prototype);
  };

  var FileSystem = (function() {
    function FileSystem(url, name) {
      this.name = name;
      this.url_ = url;
      this.root = new DirectoryEntry(this, '/', '/');
    }

    return FileSystem;
  })();

  var Entry = (function() {
    function Entry(isFile, isDirectory, filesystem, name, fullPath) {
      this.isFile = isFile;
      this.isDirectory = isDirectory;
      this.filesystem = filesystem;
      this.name = name;
      this.fullPath = fullPath;
    }

    Entry.prototype.getMetadata = function(successCallback, errorCallback) {
      throw new Error('Not implemented');
    };

    Entry.prototype.moveTo =
        function(parent, newName, successCallback, errorCallback) {
      throw new Error('Not implemented');
    };

    Entry.prototype.copyTo =
        function(parent, newName, successCallback, errorCallback) {
      throw new Error('Not implemented');
    };

    Entry.prototype.toURL = function() {
      throw new Error('Not implemented');
    };

    Entry.prototype.remove = function(successCallback, errorCallback) {
      throw new Error('Not implemented');
    };

    Entry.prototype.getParent = function(successCallback, errorCallback) {
      throw new Error('Not implemented');
    };

    Entry.prototype.getFullUrl_ = function() {
      return this.filesystem.url_ + this.fullPath;
    }

    return Entry;
  })();

  var DirectoryEntry = (function(_super) {
    __extends(DirectoryEntry, _super);

    function DirectoryEntry(filesystem, fullPath) {
      var name = fullPath.match(/([^\/]*\/)$/)[1];
      _super.call(this, false, true, filesystem, name, fullPath);
      this.isFile = false;
      this.isDirectory = true;
    }

    DirectoryEntry.prototype.createReader = function() {
      var self = this;
      var defered = $q.defer();
      var req = new XmlHttpRequest();
      req.open('PROPFIND', this.getFullUrl_(), true);
      req.overrideMimeType('text/xml');
      req.onload = function(e) {
        if (e.status != '207') {
          defered.reject(new Error('HTTP error fetching properties of ' +
                                   self.url_ + ': ' + req.statusText));
          return;
        }
        var doc = e.responseXML;
        var entryNodes = doc.getElementsByTagNameNS('DAV:', 'response');
        var entries = [];
        Array.prototype.forEach.apply(entryNodes, function(entry) {
          var path =
              entry.getElementsByTagNameNS('DAV:', 'href')[0].textContent;
          // Skip the entry for this directory.
          if (path == self.fullPath)
            return;

          var type = entry.getElementsByTagNameNS('DAV:', 'resourcetype')[0];
          if (type.getElementsByTagNameNS('DAV:', 'collection').length > 0) {
            entries.push(new DirectoryEntry(self.filesystem, path));
          } else {
            entries.push(new FileEntry(self.filesystem, path));
          }
        });
        defered.fulfill(entries);
      }

      return {
        'readEntries': function(successCallback, errorCallback) {
          // Only return the list of entries the first time readEntries() is
          // called, an empty list afterwards.
          if (!defered)
            sucessCallback([]);

          defered.then(successCallback, errorCallback);
          defered = null;
        }
      };
    };

    DirectoryEntry.prototype.getFile = function(path,
                                                options,
                                                successCallback,
                                                errorCallback) {
      var file = new FileEntry(this.filesystem, path);
      if (successCallback)
        successCallback(file);
    };

    DirectoryEntry.prototype.getDirectory = function(path,
                                                     options,
                                                     successCallback,
                                                     errorCallback) {
      throw new Error('Not implemented');
    };

    DirectoryEntry.prototype.removeRecursively = function(successCallback,
                                                          errorCallback) {
      throw new Error('Not implemented');
    };

    return DirectoryEntry;
  })(Entry);

  var FileWriter = (function() {
    function FileWriter(url) {
      this.url_ = url;
    }

    FileWriter.prototype.write = function(blob) {
      var self = this;
      var req = new XmlHttpRequest();
      req.open('PUT', this.url_, true);
      req.onload = function(e) {
        if (e.status != 200) {
          if (self.onerror)
            self.onerror(new Error('HTTP error uploading ' + self.url_ + ': ' +
                                   req.statusText));
          return;
        }

        if (self.onwriteend)
          self.onwriteend(new ProgressEvent('load'));
      };
      req.send(blob);
    };

    FileWriter.prototype.truncate = function(size) {
      if (this.onwriteend)
        this.onwriteend(new ProgressEvent('loadend'));
    };
  })();

  var FileEntry = (function(_super) {
    __extends(FileEntry, _super);

    function FileEntry(filesystem, fullPath) {
      var name = fullPath.replace(/.*\//, '');
      _super.call(this, true, false, filesystem, name, fullPath);
    }

    FileEntry.prototype.createWriter = function(successCallback,
                                                errorCallback) {
      successCallback(new FileWriter(this.getFullUrl_()));
    };

    FileEntry.prototype.file = function(successCallback, errorCallback) {
      var req = new XMLHttpRequest();
      var url = this.getFullUrl_();
      // console.log('Fetching ' + url);
      req.open('GET', url, true);
      req.responseType = 'blob';
      req.onload = function(e) {
        if (req.status != 200) {
          errorCallback(new Error('HTTP error fetching ' + url + ': ' +
                                  req.statusText));
          return;
        }
        successCallback(req.response);
      }
      req.send();
    };

    return FileEntry;
  })(Entry);

  return {
    'create': function create(url, successCallback, errorCallback) {
      var fs = new FileSystem(url, 'WebDAVFS: ' + url);
      successCallback(fs);
    }
  };
});
