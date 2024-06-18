const axios = require("axios");
const fs = require("fs");
const readline = require("readline");

let consoleenable = true;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

fs.readFile("config.json", "utf8", (err, configData) => {
  if (err) {
    console.error(err.message);
    return;
  }

  try {
    const config = JSON.parse(configData);

    if (!config.linkToCheck) {
      rl.question("NEW URL : ", (newLink) => {
        config.linkToCheck = newLink;
        updateConfigFile(config);
      });
    } else {
      rl.question(`USE OLD URL "${config.linkToCheck}"? (y/n) : `, (answer) => {
        if (answer.toLowerCase() === "n") {
          rl.question("NEW URL : ", (newLink) => {
            config.linkToCheck = newLink;
            updateConfigFile(config);
          });
        } else {
          simulateDeviceAccess(config.linkToCheck, config.numberOfDevices);
        }
      });
    }
  } catch (jsonError) {
    console.error(jsonError.message);
  }
});

function updateConfigFile(config) {
  fs.writeFile("config.json", JSON.stringify(config, null, 2), "utf8", (err) => {
    if (err) {
      console.error(err.message);
      return;
    }

    simulateDeviceAccess(config.linkToCheck, config.numberOfDevices);
  });
}

async function simulateDeviceAccess(linkToCheck, numberOfDevices) {
  const devicePromises = [];
  const proxyFileContent = fs.readFileSync('ipOnly.txt', 'utf8');

  const ipAddresses = proxyFileContent.split(/\r?\n|\s/).filter(ip => ip.trim() !== '');
  for (let i = 0; i < numberOfDevices; i++) {
    const ipAddress = ipAddresses[i % ipAddresses.length]; 
    devicePromises.push(checkServerStatus(linkToCheck, i + 1, ipAddress));
  }

  await Promise.all(devicePromises);
}

async function checkServerStatus(linkToCheck, ipAddress) {
  let loadCount = 0;

  while (true) {
    try {
      const response = await axios.get(linkToCheck, {
        headers: {
          "X-Forwarded-For": ipAddress  
        }
      });

      if (response.status === 200) {
        if (consoleenable) {
          console.log(`[ XIE ] Successful responses – 200 OK`);
        }
      } else {
        if (consoleenable) {
          console.log(`[ XIE ] Error: ${response.status}`);
        }
      }
    } catch (error) {
      if (consoleenable) {
        console.error(`[ XIE ] Error: ${error.message}`);
      }
    }

    loadCount++;

    await new Promise((resolve) => setTimeout(resolve, 10000));
  }
}
