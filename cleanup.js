const fetch = require("node-fetch");

async function unpin(hash, name) {
  console.log("unpinning", hash, name);
  const eternumReq = await fetch(`https://www.eternum.io/api/pin/${hash}`, {
    method: "DELETE",
    headers: {
      Authorization: `Token ${process.env.ETERNUM_KEY}`,
      Accept: "application/json",
      "Content-Type": "application/json"
    }
  });
  console.log("unpinned", await (eternumReq.json()));
}

async function main() {
  const eternumReq = await fetch("https://www.eternum.io/api/pin/", {
    method: "GET",
    headers: {
      Authorization: `Token ${process.env.ETERNUM_KEY}`,
      Accept: "application/json",
      "Content-Type": "application/json"
    }
  });
  const res = await (eternumReq.json());
  const prefixDates = {};
  res.results.forEach(pin => {
    const match = pin.name.match(/(lcra-.*|kml-list)-(.*)/);
    if (!match) return;
    const pinTime = parseInt(match[2], 36);
    const prefix = match[1];
    if (prefixDates[prefix]) {
      if (pinTime < prefixDates[prefix].time) {
        unpin(pin.hash, pin.name);
      } else {
        unpin(prefixDates[prefix].hash, prefixDates[prefix].name);
        prefixDates[prefix] = {
          hash: pin.hash,
          time: pinTime,
          name: pin.name
        };
      }
    } else {
      prefixDates[prefix] = {
        hash: pin.hash,
        time: pinTime,
        name: pin.name
      };
    }
  })
}
main();
