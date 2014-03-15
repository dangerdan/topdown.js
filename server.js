var url     = require("url"),
    path    = require("path"),
    fs      = require("fs"),
    mime    = require("mime"),
    http    = require("http");

var onFileFound = function(path, events) {
  fs.exists(path, function(exists){
    if(!exists)
      events.fail();
    else
      events.success(path);
  });
};

var getURI = function (uri, callback, error) {

  function LookInCore(){
    onFileFound(path.join(__dirname, 'public', uri), {
      success: function(path) { callback(path); },
      fail: function() { error() }
    });
  }

  function LookInProjectThenCore() {
    onFileFound(path.join(process.cwd(), 'public', uri), {
      success: function(path) { callback(path); },
      fail: function() { LookInCore(); }
    });
  }

  var coreReq = new RegExp(/^\/topdown\//);
  isCoreRequest = coreReq.test(uri);

  if (isCoreRequest) {
    uri = uri.substring(9);
    LookInCore();
  } else {
    LookInProjectThenCore();
  }
};

module.exports.listen = function(port) {
  port = parseInt(port, 10);
  console.log('[INFO] WebServer started on port '+port);

  var server = function(req, res) {
    var uri = url.parse(req.url).pathname;

    // if the request is empty, get index.html
    uri = (uri == '/') ? 'index.html' : uri;

    getURI(uri, function(filename){
      fs.readFile(filename, "binary", function(err, file) {
        if(err) {
          res.writeHead(500, {"Content-Type": "text/plain"});
          res.write(err + "\n");
          res.end();
          return;
        }

        res.writeHead(200, {
          'Content-Type': mime.lookup(filename),
          'Content-Disposition': 'inline'
        });
        res.write(file, "binary");
        res.end();
      });
    }, function(){
      res.writeHead(404, {"Content-Type": "text/plain"});
      res.write("404 Not Found\n");
      res.end();
      return;
    });

  };

  return http.createServer(server).listen(port);
};

