const fetch = require("node-fetch");
const fs = require("fs");
const Coordinates = require("coordinate-parser");

async function main(province) {
  let kml = 
    `<?xml version="1.0" encoding="UTF-8"?>
    <kml xmlns="http://www.opengis.net/kml/2.2">
      <name>[BETA] Roadside Attractions 2.0</name>
      <Document>
        <description>[BETA] A map of all Canadian roadside attractions on https://roadsideattractions.ca</description>
        <Style id="icon-503-DB4436-normal">
          <IconStyle>
            <color>ff3644db</color>
            <scale>1.1</scale>
            <Icon>
              <href>http://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href>
            </Icon>
            <hotSpot x="16" xunits="pixels" y="32" yunits="insetPixels"/>
          </IconStyle>
          <LabelStyle>
            <scale>0</scale>
          </LabelStyle>
        </Style>
        <Style id="icon-503-DB4436-highlight">
          <IconStyle>
            <color>ff3644db</color>
            <scale>1.1</scale>
            <Icon>
              <href>http://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href>
            </Icon>
            <hotSpot x="16" xunits="pixels" y="32" yunits="insetPixels"/>
          </IconStyle>
          <LabelStyle>
            <scale>1.1</scale>
          </LabelStyle>
        </Style>
        <StyleMap id="icon-503-DB4436">
          <Pair>
            <key>normal</key>
            <styleUrl>#icon-503-DB4436-normal</styleUrl>
          </Pair>
          <Pair>
            <key>highlight</key>
            <styleUrl>#icon-503-DB4436-highlight</styleUrl>
          </Pair>
        </StyleMap>
        <Folder>
          <name>All Roadsides</name>
    `;
  const roadsides = await (await fetch("https://roadsideattractions.ca:8443/roadsides")).json();
  roadsides.forEach(r => {
    if (province && (r.province !== province)) return;
    if (r.archive === "TRUE") return;
    if (!r.gps) {
      //console.warn(r.name, " no coords");
      return;
    }

    let pos;
    try {
      pos = new Coordinates(r.gps);
    } catch (e) {
      console.warn(r.name, r.gps);
      return;
    }
    kml += `
      <Placemark>
        <name>${r.name}</name>
        <description>
          <![CDATA[
            ${r.location ? (r.location + "<br>") : ""}
            https://roadsideattractions.ca/roadside${r.url}<br>
          ]]>
        </description>
        <ExtendedData>
          <Data name="gx_media_links">
            <value>https://roadsideattractions.ca/images${r.url}.jpg</value>
          </Data>
        </ExtendedData>
        <Point>
          <coordinates>${pos.getLongitude()},${pos.getLatitude()},0</coordinates>
        </Point>
      </Placemark>
    `;
  });
  kml +=
    `
        </Folder>
      </Document>
    </kml>
    `;
  return kml
}

module.exports = main;
//main();
