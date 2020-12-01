const express = require("express");
const gen = require("./gen.js");
const fetch = require("node-fetch");
const FormData = require("form-data")
const ipfs = require("ipfs");

const USE_INFURA = false;

const app = express();

const regions = [
  "world",
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Northwest Territories",
  "Nova Scotia",
  "Nunavut",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
  "Yukon"
];

let timeString = Math.floor((Date.now() / 5000)).toString(36);

async function pinToIPFS(file, filename, eternumName) {
  let infuraHash;
  if (USE_INFURA) {
    let fd = new FormData();
    fd.append("file", file, {
      filename,
      contentType: "application/vnd.google-earth.kml+xml"
    });
    const infuraReq = await fetch("https://ipfs.infura.io:5001/api/v0/add?pin=true&wrap-with-directory=true", {
      method: "POST",
      body: fd
    });
    const infuraText = await infuraReq.text();
    let infuraRes;
    try {
      infuraRes = JSON.parse(infuraText.split("\n")[1]);
    } catch (e) {
      console.warn("infura is acting up", infuraText);
      await new Promise(resolve => setTimeout(resolve, 15000));
      return await pinToIPFS(file, filename, eternumName);
    }
    infuraHash = infuraRes.Hash;
  }
  
  let eternumUploadReq;
  if (filename) {
    eternumUploadReq = await fetch("https://ipfs.eternum.io/ipfs/QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn/" + filename, {
      method: "PUT",
      body: file
    });
  } else {
    eternumUploadReq = await fetch("https://ipfs.eternum.io/ipfs/" + filename, {
      method: "POST",
      body: file
    });
  }
  const hash = eternumUploadReq.headers.get("ipfs-hash");
  if (USE_INFURA) {
    console.assert(infuraHash === hash, "Infura and Eternum hash file the same. Eternum: " + hash + " Infura: " + infuraHash);
  } 
  const eternumReq = await fetch("https://www.eternum.io/api/pin/", {
    method: "POST",
    headers: {
      Authorization: `Token ${process.env.ETERNUM_KEY}`,
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      hash,
      name: eternumName
    })
  });
  const eternumRes = await eternumReq.json();
  console.log(eternumRes);
  
  ipfs.name.publish(`/ipfs/${hash}`, function (err, res) {
    // You now receive a res which contains two fields:
    //   - name: the name under which the content was published.
    //   - value: the "real" address to which Name points.
    console.log(`https://gateway.ipfs.io/ipns/${res.name}`)
  })
  
  return hash;
}

async function doRegion(region) {
  const kml = await gen((region === "world") ? null : region);
  const filename = `${region.toLowerCase().replace(/ /g, "-")}-roadsides.kml`;
  const eternumName = `lcra-${region.toLowerCase().replace(/ /g, "-")}-${timeString}`;
  const hash = await pinToIPFS(kml, filename, eternumName);
  
  return `https://ipfs.eternum.io/ipfs/${hash}/${filename}`;
}

async function updateEternum() {
  timeString = Math.floor((Date.now() / 5000)).toString(36);
  let html = `
    <!doctype html>
    <html>
      <head>
        <title>lcra</title>
        <meta charset="utf-8">
        <!--Google Fonts-->
        <link href="https://fonts.googleapis.com/css?family=Ubuntu" rel="stylesheet">
        <style>
          body {
            font-family: Ubuntu, sans-serif;
          }
        </style>
      </head>
      <body>
        <ul>
  `;
  let listItems = [];
  let promises = [];
  for (let i = 0; i < regions.length; i++) {
    promises.push(new Promise(async (resolve, reject) => {
      const region = regions[i];
      const uri = await doRegion(region);
      listItems.push([region === "world" ? "AAAA" : region, `
        <li><a href="${uri}" download target="_blank">${region === "world" ? "Canada" : region}</a>${region === "world" ? "<ul>" : "</li>"}
      `]);
      resolve();
    }));
  }
  await Promise.all(promises);
  html += listItems.sort((a, b) => a[0].localeCompare(b[0])).map(a => a[1]).join("");
  html += `
            </ul>
          </li>
        </ul>
      </body>
    </html>
  `;
  const hash = await pinToIPFS(html, null, `kml-list-${timeString}`);
  console.log("doing html index");
  const eternumReq = await fetch("https://eternum.io/api/site/", {
    method: "PUT",
    headers: {
      Authorization: `Token ${process.env.ETERNUM_KEY}`,
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      site_hash: hash
    })
  });
  console.log("site set result", await (eternumReq.text()));
}

app.get("/just-update-files", async (req, res) => {
  await updateEternum();
  res.send("done");
});

app.get(["/:region", "/"], async (req, res) => {
  let region = req.params.region ? req.params.region : null;
  const name = region ? region : "world";
  res.type("application/vnd.google-earth.kml+xml");
  res.set("content-disposition", `attachment; filename="${name}.kml"`);
  res.send(await gen(region));
  updateEternum();
});

app.listen(process.env.PORT);
console.log("Starting server...");
