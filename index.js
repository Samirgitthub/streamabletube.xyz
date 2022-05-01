const express = require("express");
const app = express();
const cors = require("cors");
const ytdl = require("ytdl-core");
const got = require("got");
const {parse} = require("url");

app.use(express.static(`${__dirname}/web/`));
app.use(cors());

app.get("/stream/:type/:id", async function(req, res) {
  if (ytdl.validateID(req.params.id)) {
    try {
      var a = await ytdl.getInfo(req.params.id);
      var f = ytdl.chooseFormat(a.formats, getFilter(req.params.type)).url;
      var hdr = req.headers;
      hdr.host = parse(f, true).host;
      if (hdr.range) f = `${f}&range=${hdr.range}`;
      if (hdr.referer) hdr.referer = "";
      got.stream(f, {
        headers: hdr
      }).pipe(res).on("error", function(err) {
        var e = err.stack || err.message || err.code || err;
        res.send(e);
      });
    } catch(err) {
      var e = err.stack || err.message || err.code || err;
      res.send(e);
    }
  } else {
    res.send(404);
  }
});

app.listen((process.env.PORT || 3300), function() {
  console.log(`Listening on port ${(process.env.PORT || 3300)}`);
});

function getFilter(type) {
  switch(type) {
    case "av":
    default:
      return {filter:"audioandvideo", quality: "highestvideo"};

    case "a": 
      return {filter:"audioonly", quality: "highestaudio"};

    case "v":
      return {filter:"videoonly", quality: "highestvideo"};
  }
}