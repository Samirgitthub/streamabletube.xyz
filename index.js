const express = require("express");
const app = express();
const cors = require("cors");
const ytdl = require("ytdl-core");
const axios = require("axios");
const {parse} = require("url");
const {version} = require('./package.json');

app.use(express.static(`${__dirname}/web/`));
app.use(cors());

app.get('/version', (req, res) => {
  res.json(version)
})

app.get("/info/:id", async function(req, res) {
  if (ytdl.validateID(req.params.id)) {
    try {
      let a = await ytdl.getInfo(req.params.id);
      res.json(a)
    } catch(err) {
      var e = err.stack || err.message || err.code || err;
      res.send(e);
    }
  } else {
    res.send(404);
  }
});

app.get("/stream/:type/:id", async function(req, res) {
  if (ytdl.validateID(req.params.id)) {
    try {
      let a = await ytdl.getInfo(req.params.id);
      let filter = getFilter(req.params.type)
      let f = ytdl.chooseFormat(a.formats, filter).url;
      let hdr = req.headers;
      hdr.host = parse(f, true).host;
      if (hdr.range) f = `${f}&range=${hdr.range.replace('bytes=', '')}`;
      if (hdr.referer) hdr.referer = "";
      let streamReq = await axios({
        url: f,
        method: 'GET',
        responseType: 'stream',
        headers: hdr
      })
      res.set(streamReq.headers)
      res.status(streamReq.data.statusCode)
      streamReq.data.pipe(res).on("error", function(err) {
        let e = err.stack || err.message || err.code || err;
        // cant send error, because the headers have already been sent. don't know how to solve this at the moment.
        console.log(err)
      });
    } catch(err) {
      let e = err.stack || err.message || err.code || err;
      // cant send error, because the headers have already been sent. don't know how to solve this at the moment.
      console.log(err)
    }
  } else {
    res.sendStatus(404);
  }
});

app.listen((process.env.PORT || 3300), function() {
  console.log(`Listening on port ${(process.env.PORT || 3300)}`);
});

function getFilter(type) {
  switch(type) {
    case "a": 
      return {filter:"audioonly", quality: "highestaudio"};

    case "v":
      return {filter:"videoonly", quality: "highestvideo"};
    case "av":
      return {filter:"audioandvideo", quality: "highestvideo"};
    default:
      return {quality: type};
  }
}