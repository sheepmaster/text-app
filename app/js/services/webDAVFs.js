TD.factory('webDAVFs', function() {
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

    return Entry;
  })();

  var DirectoryEntry = (function(_super) {
    __extends(DirectoryEntry, _super);

    function DirectoryEntry(filesystem, name, fullPath) {
      _super.call(this, false, true, filesystem, name, fullPath);
      this.isFile = false;
      this.isDirectory = true;
    }

    DirectoryEntry.prototype.createReader = function() {
      return {
        'readEntries': function(successCallback, errorCallback) {
          throw new Error('Not implemented');
        }
      };
    };

    DirectoryEntry.prototype.getFile = function(path,
                                                options,
                                                successCallback,
                                                errorCallback) {
      var name = path.replace(/.*\//, '');
      var file = new FileEntry(this.filesystem, name, path);
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
                                   req.status + ' ' + req.statusText));
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

    function FileEntry(filesystem, name, fullPath) {
      _super.call(this, true, false, filesystem, name, fullPath);
    }

    FileEntry.prototype.createWriter = function(successCallback,
                                                errorCallback) {
      successCallback(new FileWriter(this.filesystem.url_ + this.fullPath));
    };

    FileEntry.prototype.file = function(successCallback, errorCallback) {
      var req = new XMLHttpRequest();
      var url = this.filesystem.url_ + this.fullPath;
      // console.log('Fetching ' + url);
      req.open('GET', url, true);
      req.responseType = 'blob';
      req.onload = function(e) {
        if (req.status != 200) {
          errorCallback(new Error('HTTP error fetching ' + url + ': ' +
                                  req.status + ' ' + req.statusText));
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
