const spdy = require('spdy');
const fs = require('fs');
const express = require('express');
const url = require('url');
const app = express();
const httpApp = express();

const http = require('http');
//const net = require('net');

const PORT = process.env.PORT || 8002;

const serveDir = __dirname + "/build"

const sslOptions = {
  key: fs.readFileSync( __dirname + '/ssl/key.pem'),
  cert: fs.readFileSync( __dirname + '/ssl/certificate.pem')
};

const sendOptions = {
  root: '/'
};

/* serves main page */
app.get("/", function(req, res) {
  console.log('Serving root.');
  res.sendFile( serveDir + '/index.html');
});

/* serves all the static files assuming that static files have a
 * period followed by an extension */
app.get(/^(.+\..+)$/, function(req, res){
//   console.log('static file request : ' + req.params[0]);
   res.sendFile( serveDir + req.params[0]);
});

/* Deep links will not have an extension. Respond with index.html
 * and let the web app handle the routing */
app.get(/(.+)$/, (req, res) => {
  console.log('serving path: ' + req.params[0]);
  res.sendFile( serveDir + '/index.html');
});

spdy
  .createServer(sslOptions, app)
  .listen(PORT, (err) => {
    if (err) {
      throw new Error(err);
    }

    console.log(`Spdy HTTP2 server listening on port: ${PORT}`);
  });




// redirect HTTP requests.
httpApp.set('port', process.env.PORT || 8080);
httpApp.get("*", function (req, res, next) {
    let redirectUrl = `https://${req.headers.host.split(':')[0]}:${PORT}${req.path}`;
    console.log(`Redirecting HTTP request to: ${redirectUrl}`);
    res.redirect(redirectUrl);
});

http.createServer(httpApp).listen(httpApp.get('port'), function() {
    console.log('Express HTTP server listening on port ' + httpApp.get('port'));
});
