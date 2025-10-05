const broker = "d2f277161aef4f56a41ef426746a4219.s1.eu.hivemq.cloud";
const port = 8884;
const username = "user1";
const password = "User1234";
let client;
const devices = {};

function log(msg) {
  const monitor = document.getElementById("monitor");
  const time = new Date().toLocaleTimeString();
  monitor.innerHTML += `[${time}] ${msg}<br>`;
  monitor.scrollTop = monitor.scrollHeight;
}

function onConnect() {
  log("✅ Connected to HiveMQ");
  const status = document.getElementById("connectionStatus");
  status.className = "status connected";
  status.innerText = "🟢 Connected";
  client.subscribe("Advantech/+/data");
}

function onFail(response) {
  log("❌ Connection failed: " + response.errorMessage);
}

function onConnectionLost(response) {
  if (response.errorCode !== 0) {
    log("⚠ Connection lost: " + response.errorMessage);
    const status = document.getElementById("connectionStatus");
    status.className = "status disconnected";
    status.innerText = "🔴 Disconnected";
  }
}

function onMessageArrived(message) {
  log(`📩 Topic: ${message.destinationName}, Payload: ${message.payloadString}`);
  const mac = message.destinationName.split('/')[1];
  if (devices[mac]) {
    const deviceDiv = devices[mac];
    const dataDiv = deviceDiv.querySelector(".device-data");
    const led = deviceDiv.querySelector(".led");
    dataDiv.innerText = message.payloadString;
    const payload = message.payloadString.toUpperCase();
    led.classList.toggle("on", payload === "ON");
    led.classList.toggle("off", payload !== "ON");
  }
}

function addDevice() {
  const mac = document.getElementById("macInput").value.trim();
  if (!mac) return alert("Please enter a device MAC.");
  if (devices[mac]) return alert("Device already added.");

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
  client.subscribe(`Advantech/${mac}/data`);
}

function sendCommand(mac, cmd) {
  if (!client || !client.isConnected()) return log("⚠ Not connected yet.");
  const message = new Paho.MQTT.Message(cmd);
  message.destinationName = `Advantech/${mac}/command`;
  client.send(message);
  log(`➡ Sent command "${cmd}" to ${mac}`);
}

function connectMQTT() {
  const clientID = "webclient-" + Math.random().toString(16).substr(2, 8);
  const wsURL = `wss://${broker}:8884/mqtt`;
  client = new Paho.MQTT.Client(wsURL, clientID);

  client.onConnectionLost = onConnectionLost;
  client.onMessageArrived = onMessageArrived;

  const options = {
    useSSL: true,
    userName: username,
    password: password,
    timeout: 5,
    onSuccess: onConnect,
    onFailure: onFail
  };

  log("Connecting to HiveMQ...");
  client.connect(options);
}

window.addEventListener("load", connectMQTT);
