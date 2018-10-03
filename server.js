const spdy = require('spdy');
const fs = require('fs');
const pem = require('pem');
const express = require('express');
const url = require('url');

pem.createCertificate({ days: 1, selfSigned: true }, function (err, keys) {
  if (err) {
    throw err
  }
  const app = express();

  const PORT = process.env.PORT || 8002;

  const serveDir = __dirname + "/build"

const sslOptions = {
  key: keys.serviceKey,
  cert: keys.certificate
};


  app.use(express.static('build'));

/* serves main page */
  app.get("/", function(req, res) {
    console.log('Serving root.');
    res.sendFile( serveDir + '/index.html');
  });

/*
/* serves all the static files assuming that static files have a
 * period followed by an extension * /
app.get(/^(.+\..+)$/, function(req, res){
//   console.log('static file request : ' + req.params[0]);
   res.sendFile( serveDir + req.params[0]);
});

/* Deep links will not have an extension. Respond with index.html
 * and let the web app handle the routing * /
app.get(/(.+)$/, (req, res) => {
  console.log('serving path: ' + req.params[0]);
  res.sendFile( serveDir + '/index.html');
});
*/

  spdy
    .createServer(sslOptions, app)
    .listen(PORT, (err) => {
      if (err) {
        throw new Error(err);
      }

      console.log(`Spdy HTTP2 server listening on port: ${PORT}`);
    });
});
