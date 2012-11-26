var connect = require('connect');
var fs = require('fs');
var http = require('http');
var Path = require('path');
var Q = require('q');
var url = require('url');

var pretty_print = true;

function error(res, status, msg) {
  console.error(status, msg);
  res.statusCode = status;
  res.end(http.STATUS_CODES[status]);
}

function redirect(req, res) {
  if (req.url == '/') {
    res.statusCode = 301;
    res.setHeader('Location', '/static/index.html');
    res.end();
  }
}

function decode(path) {
  try {
    return decodeURIComponent(path);
  } catch (err) {
    return null;
  }
}

function cat(path, res) {
  var stream = fs.createReadStream(path);
  stream.on('error', function(err) {
    if (err.code == 'ENOENT') {
      error(res, 404);
      return;
    }
    error(res, 500, err);
  })
  stream.pipe(res);
}

function ls(dir, real_dir, res) {
  Q.ninvoke(fs, 'readdir', real_dir).then(function(files) {
    return Q.all(files.map(function(file) {
      return Q.ninvoke(fs, 'stat', real_dir + file).then(function(stat) {
        return {
          'file': file,
          'full_path': dir + file,
          'is_directory': stat.isDirectory()
        };
      });
    }));
  }).then(function(listing) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(pretty_print ? JSON.stringify(listing, null, '  ') :
                           JSON.stringify(listing));
  }, function(err) {
    error(res, 500, err);
  }).done();
}

function echo(path, req, res) {
  var stream = fs.createWriteStream(path);
  stream.on('error', function(err) {
    if (err.code == 'ENOENT') {
      error(res, 404, 'File not found: \'' + path + '\'');
      return;
    }
    error(res, 500, err);
  });
  stream.on('open', function() {
    res.statusCode = 201;
  });
  req.on('end', function() {
    // If we haven't thrown an error, end the response.
    if (res.writable)
      res.end();
  });
  req.pipe(stream);
}

function serve(dir, allowed_methods) {
  return function(req, res) {
    var path = decode(url.parse(req.url).pathname);
    if (!path)
      return error(res, 400);

    if (~path.indexOf('\0'))
      return error(res, 400);

    var full_path = Path.normalize(dir + path);
    if (full_path.substr(0, dir.length) != dir)
      return error(res, 403);

    var method = req.method;
    if (allowed_methods.indexOf(method) == -1)
      return error(res, 501);

    switch(method) {
      case 'GET': {
        if (full_path[full_path.length - 1] == '/') {
          ls(path, full_path, res);
        } else {
          cat(full_path, res);
        }
        break;
      }
      case 'PUT': {
        echo(full_path, req, res);
        break;
      }
      default: {
        error(res, 501);
      }
    }
  };
}

var dir_to_serve = process.argv[2] || process.cwd();

var app = connect()
  .use('/static', serve(__dirname + 'app', ['GET']))
  .use('/api', serve(dir_to_serve, ['GET', 'PUT']))
  .use(redirect);

http.createServer(app).listen(8398, '127.0.0.1');
