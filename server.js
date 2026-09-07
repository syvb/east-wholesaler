const express = require("express");
const gen = require("./gen.js");
const fs = require("fs");

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

const mapsDir = __dirname + "/maps";

async function doRegion(region) {
  const kml = await gen((region === "world") ? null : region);
  const filename = `${region.toLowerCase().replace(/ /g, "-")}-roadsides.kml`;
  try { fs.mkdirSync(mapsDir) } catch (e) { /* already exists */ }
  fs.writeFileSync(`${mapsDir}/${filename}`, kml, "utf-8");
  return `/maps/${filename}`;
}

async function updateFiles() {
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
  try { fs.mkdirSync(mapsDir) } catch (e) { /* already exists */ }
  fs.writeFileSync(`${mapsDir}/index.html`, html, "utf-8");
  console.log("wrote html index");
}

app.use("/maps", express.static(mapsDir));

app.get("/just-update-files", async (req, res) => {
  await updateFiles();
  res.send("done");
});

app.get(["/:region", "/"], async (req, res) => {
  let region = req.params.region ? req.params.region : null;
  const name = region ? region : "world";
  res.type("application/vnd.google-earth.kml+xml");
  res.set("content-disposition", `attachment; filename="${name}.kml"`);
  res.send(await gen(region));
  updateFiles();
});

if (process.env["EASTWHOLESALER_GEN"]) {
  updateFiles();
} else {
  app.listen(process.env.PORT);
  console.log("Starting server...");
}
