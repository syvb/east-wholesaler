const express = require("express");
const gen = require("./gen.js");
const fetch = require("node-fetch");
const FormData = require("form-data")
const IPFS = require("ipfs"); 
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

const ipfsP = IPFS.create()

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
  
  const ipfs = await ipfsP;
  
  // x
  //await ipfs.key.gen("x");
  //const pem = await ipfs.key.export('x', 'sekretpw');
  //console.log("pem", pem);
  // x
  
  const key = await ipfs.key.import('clone', `-----BEGIN ENCRYPTED PRIVATE KEY-----
MIIFODBiBgkqhkiG9w0BBQ0wVTA0BgkqhkiG9w0BBQwwJwQQcKQVjlQquWS9QIM7
ib8vEgICJxACASAwDAYIKoZIhvcNAgsFADAdBglghkgBZQMEASoEEDOB36WYUgFZ
HwcjfMIo9HQEggTQiTnCEjIFNrdAVn9GvNlBMjmKSmT+R6rWpO2SJ4K/oOchz5iL
stfKCfUYO2puuK/zBKWFdsrpelOVGF73mOHdcc+wHDJf+w7O0FqF4IkxHOnfnKXg
5cboSRbELaPFLBhDYwc+JaOxWop42GDNR1K8qdGCQ/g4sjlodGBi3NJJJVCLXmtX
GjMzDHABV0ISwD82p1PMRK6QLqeJaN4QyZWEDfFIz9sTg8S1f2a2AlISC/vuEUAy
FWFJZNqUW1aLSqQs4VmJBpYgB0IBo2R2kmdutxgP24CdiIpSAX09CKgtm4tlZvTo
0CHx3KytPLXklliZIB1/TgfRfgPYJH5TajQIJC5rcPQkojXJFC5mJ6CnDNxLXYnU
rRZSZ0T8lcX6qqsTFW3S4U3KCSvfqqOPE68jdQUrqBh/xd7qQwLhEKVHf5tYLfJr
S5roKJKWWG7eaHV7cE+tS2ajdzRIdcAktAn6msJ1OUd5OmHHPBHNuYeFEG4lKRBn
MvP039m76ewj4P1zc9bZjxvF4ByXBOQ+quxSBMwai+5poQFXI2JNa1q041lqfjYA
LX2GBnhYxbU3mWC5kcpReAheJuACydidXdBtn1uoFhtqjWeKMbRe1SEgXa52iv8v
qth7m/8sWpFOYktxAnTJBuwsb1I78oh7XdvVUy45sG1mHXVKp+rVGtFhcWlQfbjU
eaEcARE0tIRo7vqkQGNGeJviM4ap01lpRvwiNNs5fypxpqopTh2oNOoVXsRf1OGr
v7vnoYr78O1lvjKxBYrIwvEIgMkmUhqk6s1ENnLsTClNvsodzbdDk9FypLDVD7YJ
IOT7wZWWES2lhxRfuGHYChgD0DTjqUAX1CjAANK+I4wkR+w5hytj7/5n3IJwtv+H
ANlnPgWOgVpvjcw2S/4TFcskvxWOkuvfzlfWjir6R08S7JsyBsHyY11N1v/3Pp3V
X+c82IsLahrJ3DypxjGv4wZTfkGlorZulsG+wAAe3zcs3vzMg5GLO865aDmpUSUu
KlpYYW34AhVrnxG3QJ18k5Fnyhuu3hKwfovCL/Sm57+Mbx/9YdbjILVWUgqnOAhz
ltUSTzcpsbUhSE09jX6K8tNiIOjDZWa9x0HLa3qp3eM+wT9NlQf6Afoe/O1hRO0J
+kvRAXWaxiCfpUF92R7qPLeAj6qygx4LiXRNUTELbLoAO5197Fw7g/G/NcL4bmK2
wrGWSQ5PEYdw1QruQkmb5A4I74VnbVLrRipMzXaPzA/nONz1apTqZqeSZaBLxN5B
kz1rD6uFTKfoLQmkBPDFLgV0WSYb9xSkHVQ+3saEKP8HeD6s0naLcSsmVZl3c7zY
GmGetUUzGX4WduKxu6O7USvC5JyWkYuVamIHAf/fF6Fycqz8JYU8+ARlVCpreZ7L
oFAZRQ5uCAnypk/4vtU9Sa+Mc/t08DQQDT7e5+fY6rbPMdGseP6q56631+FyndQT
YaEYXE8zqUobqCFasYT2C7oNEG0HF6DY6H2z+e41eiYXrxQeaxXyVXCFmKN8YiU2
5fJFrUIgEVVN4GZODuX2X7i1naYN9PNKXNzYbpNRVi3GsZSncsQBETWQIGzqSIS8
j3IJQRvIV1XtSrBdJLe537tZM0TcQs6QU9CIl10JFmUD+JZTjZCj8yNltKc=
-----END ENCRYPTED PRIVATE KEY-----`, 'sekretpw')
  const pubRes = await ipfs.name.publish(`/ipfs/${hash}`, { key: "clone" });
  console.log("ipns", pubRes.name);
  
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
