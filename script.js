const broker = "d2f277161aef4f56a41ef426746a4219.s1.eu.hivemq.cloud";
const port = 8884;  // WebSocket secure port
const username = "user1";
const password = "User1234";
let client;
const devices = {};

// Logging function
function log(msg) {
  const monitor = document.getElementById("monitor");
  const time = new Date().toLocaleTimeString();
  monitor.innerHTML += `[${time}] ${msg}<br>`;
  monitor.scrollTop = monitor.scrollHeight;
}

// MQTT callbacks
function onConnect() {
  log("✅ Connected to HiveMQ");
  document.getElementById("connectionStatus").className = "status connected";
  document.getElementById("connectionStatus").innerText = "🟢 Connected";

  // Subscribe to all Advantech devices initially
  client.subscribe("Advantech/+/data");
}

function onFail(response) {
  log("❌ Connection failed: " + response.errorMessage);
}

function onConnectionLost(response) {
  if (response.errorCode !== 0) {
    log("⚠ Connection lost: " + response.errorMessage);
    document.getElementById("connectionStatus").className = "status disconnected";
    document.getElementById("connectionStatus").innerText = "🔴 Disconnected";
  }
}

function onMessageArrived(message) {
  log(`📩 Topic: ${message.destinationName}, Payload: ${message.payloadString}`);

  // Extract MAC from topic
  const topicParts = message.destinationName.split('/');
  const mac = topicParts[1];

  if (devices[mac]) {
    const deviceDiv = devices[mac];
    const dataDiv = deviceDiv.querySelector(".device-data");
    const led = deviceDiv.querySelector(".led");

    // Update the raw payload
    dataDiv.innerText = message.payloadString;

    // Update LED based on payload (ON/OFF)
    const payload = message.payloadString.toUpperCase();
    if (payload === "ON") {
      led.classList.remove("off");
      led.classList.add("on");
    } else if (payload === "OFF") {
      led.classList.remove("on");
      led.classList.add("off");
    }
  }
}

// Add a device dynamically
function addDevice() {
  const mac = document.getElementById("macInput").value.trim();
  if (!mac) return alert("Please enter a device MAC.");

  if (devices[mac]) return alert("Device already added.");

  // Create device element
  const deviceDiv = document.createElement("div");
  deviceDiv.className = "device";
  deviceDiv.innerHTML = `
    <h4>Device ${mac}</h4>
    <div>Status: <span class="led off"></span></div>
    <div class="device-data">No data yet</div>
    <button onclick="sendCommand('${mac}', 'ON')">Turn ON</button>
    <button onclick="sendCommand('${mac}', 'OFF')">Turn OFF</button>
  `;

  document.getElementById("devices").appendChild(deviceDiv);
  devices[mac] = deviceDiv;

  // Subscribe to this device's topic
  client.subscribe(`Advantech/${mac}/data`);
}

// Send command to device
function sendCommand(mac, cmd) {
  const topic = `Advantech/${mac}/command`;
  const message = new Paho.MQTT.Message(cmd);
  message.destinationName = topic;
  client.send(message);
  log(`➡ Sent command "${cmd}" to ${mac}`);
}

function connectMQTT() {
  const clientID = "webclient-" + Math.random().toString(16).substr(2, 8);
  const wsURL = `wss://${broker}:8884/mqtt`; // FULL WebSocket URL with wss://

  client = new Paho.MQTT.Client(wsURL, clientID);

  const options = {
    useSSL: true,
    userName: username,
    password: password,
    timeout: 5,
    onSuccess: onConnect,
    onFailure: onFail
  };

  client.onConnectionLost = onConnectionLost;
  client.onMessageArrived = onMessageArrived;

  log("Connecting to HiveMQ...");
  client.connect(options);
}

// Connect when page loads
window.addEventListener("load", connectMQTT);
