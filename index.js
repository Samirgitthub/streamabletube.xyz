const express = require("express");
const app = express();
const cors = require("cors");
const ytdl = require("ytdl-core");
const got = require("got");
const {parse} = require("url");

app.use(express.static("web/"));
app.use(cors());

app.get("/stream/:type/:id", async function(req, res) {
  if (ytdl.validateID(req.params.id)) {
    var a = await ytdl.getInfo(req.params.id);
    var f = ytdl.chooseFormat(a.formats, getFilter(req.params.type));
    res.redirect(`/proxy/${Buffer.from(f.url, "ascii").toString("base64url")}`);
  } else {
    res.send(404);
  }
});

app.get("/proxy/:url", function(req, res) {
  var url = Buffer.from(req.params.url, "base64url").toString("ascii");
  var hdr = req.headers;
  hdr.host = parse(url, true).host;
  if (hdr.referer) { hdr.referer = ""; }
  got.stream(url, {
    headers: hdr
  }).pipe(res).on("error", function(err) {
    res.send(err.stack || err.message || err.code || err);
  });
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