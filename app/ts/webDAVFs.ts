module webDAVFs {

  export class FileSystem {
    name: string;

    root: DirectoryEntry;

    static create(url: string): FileSystem {
      return new FileSystemImpl(url, url);
    }
  }

  export interface FileWriter {
    write(blob: Blob);
    truncate(size: number);

    onwriteend: (e) => any;
    onerror: (e) => any;
  }

  export interface DirectoryReader {
    readEntries (successCallback?: (entries: Entry[]) => void,
                 errorCallback?: (error: Error) => void): void;
  }

  export interface Flags {
    create?: bool;
    exclusive?: bool;
  }

  export interface Metadata {
    modificationTime: Date;
    size: number;
  };

  export interface Entry {
    isFile: bool;
    isDirectory: bool;
    getMetadata(successCallback: (Metadata) => void,
                errorCallback?: (error: Error) => void);
    name: string;
    fullPath: string;
    filesystem: FileSystem;
    moveTo(parent: DirectoryEntry,
           newName?: string,
           successCallback?: (entry: Entry) => void,
           errorCallback?: (error: Error) => void);
    copyTo(parent: DirectoryEntry,
           newName?: string,
           successCallback?: (entry: Entry) => void,
           errorCallback?: (error: Error) => void);
    toURL(): string;
    remove(successCallback: () => void, errorCallback?: (error: Error) => void);
    getParent(successCallback: (entry: Entry) => void,
              errorCallback?: (error: Error) => void);
  }

  export interface DirectoryEntry extends Entry {
    createReader(): DirectoryReader;
    getFile(path: string,
            options?: Flags,
            successCallback?: (entry: Entry) => void,
            errorCallback?: (error: Error) => void): void;
    getDirectory(path: string,
                 options?: Flags,
                 successCallback?: (entry: Entry) => void,
                 errorCallback?: (error: Error) => void): void;
    removeRecursively(successCallback?: () => void,
                      errorCallback?: (error: Error) => void): void;
  }

  export interface FileEntry extends Entry {
    createWriter(successCallback: (FileWriter) => void,
                 errorCallback?: (error: Error) => void);
    file(successCallback: (File) => void,
         errorCallback?: (error: Error) => void);
  }

  /* Implementation */

  class FileSystemImpl extends FileSystem {
    url_: string;

    constructor(url: string, public name: string) {
      super();
      this.url_ = url;
      this.root = new DirectoryEntryImpl(this, '/', '/');
    }
  }

  class EntryImpl implements Entry {
    constructor(public isFile: bool,
                public isDirectory: bool,
                public filesystem: FileSystemImpl,
                public name: string,
                public fullPath: string) {
    }

    getMetadata(successCallback, errorCallback?) {
      throw new Error('Not implemented');
    }

    moveTo(parent: DirectoryEntry,
           newName?: string,
           successCallback?: (entry: Entry) => void,
           errorCallback?: (error: Error) => void) {
      throw new Error('Not implemented');
    }

    copyTo(parent: DirectoryEntry,
           newName?: string,
           successCallback?: (entry: Entry) => void,
           errorCallback?: (error: Error) => void) {
      throw new Error('Not implemented');
    }

    toURL(): string {
      throw new Error('Not implemented');
      return '';
    }

    remove(successCallback: () => void,
           errorCallback?: (error: Error) => void) {
      throw new Error('Not implemented');
    }

    getParent(successCallback: (entry: Entry) => void,
              errorCallback?: (error: Error) => void) {
      throw new Error('Not implemented');
    }

  }

  class DirectoryEntryImpl extends EntryImpl implements DirectoryEntry {
    isFile = false;
    isDirectory = true;

    constructor(filesystem: FileSystemImpl,
                name: string,
                fullPath: string) {
      super(false, true, filesystem, name, fullPath);
    }

    createReader() {
      return {
        'readEntries': function(successCallback?: (entries: Entry[]) => void,
                                errorCallback?: (error: Error) => void) {
          throw new Error('Not implemented');
        }
      };
    }

    getFile(path: string,
            options?: Flags,
            successCallback?: (entry: Entry) => void,
            errorCallback?: (error: Error) => void) {
      var name = path.replace(/.*\//, '');
      var file = new FileEntryImpl(this.filesystem, name, path);
      if (successCallback)
        successCallback(file);
    }

    getDirectory(path: string,
                 options?: Flags,
                 successCallback?: (entry: Entry) => void,
                 errorCallback?: (error: Error) => void) {
      throw new Error('Not implemented');
    }

    removeRecursively(successCallback?: () => void,
                      errorCallback?: (error: Error) => void) {
      throw new Error('Not implemented');
    }
  }

  class FileWriterImpl implements FileWriter {
    url_: string;

    onwriteend: (e) => void;
    onerror: (e) => void;

    constructor(url: string) {
      this.url_ = url;
    }

    write(blob: Blob) {
      var self = this;
/*      var req = new XmlHttpRequest();*/
      var req;
      req.open('PUT', this.url_, true);
      req.onload = function(e) {
        if (e.status != 200) {
          if (self.onerror)
            self.onerror(new Error('HTTP error uploading ' + self.url_ + ': ' +
                                   req.status + ' ' + req.statusText));
          return;
        }

        if (self.onwriteend)
          self.onwriteend(new ProgressEvent('writeend'));
      };
      req.send(blob);
    }

    truncate(size: number) {
      if (this.onwriteend)
        this.onwriteend(new ProgressEvent('writeend'));
    }
  }

  class FileEntryImpl extends EntryImpl implements FileEntry {
    constructor(filesystem: FileSystemImpl,
                name: string,
                fullPath: string) {
      super(true, false, filesystem, name, fullPath);
    }

    createWriter(successCallback: (writer: FileWriter) => void,
                 errorCallback?: (error: Error) => void) {
      throw new Error('Not implemented');
    }

    file(successCallback: (file: File) => void,
         errorCallback?: (error: Error) => void) {
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
    }
  }
}
