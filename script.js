const broker = "d2f277161aef4f56a41ef426746a4219.s1.eu.hivemq.cloud";
const port = 8883;
const username = "user1";
const password = "User1234";
let client;
const devices = {};

function log(msg) {
  const monitor = document.getElementById("monitor");
  monitor.innerHTML += msg + "<br>";
  monitor.scrollTop = monitor.scrollHeight;
}

function connectMQTT() {
  client = new Paho.MQTT.Client(broker, port, "webclient-" + Math.random().toString(16).substr(2, 8));

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

function onConnect() {
  document.getElementById("connectionStatus").innerHTML = "🟢 Connected";
  document.getElementById("connectionStatus").className = "status connected";
  log("✅ Connected to HiveMQ Cloud");

  client.subscribe("Advantech/+/data");
  log("Subscribed to Advantech/+/data");
}

function onFail(err) {
  document.getElementById("connectionStatus").innerHTML = "🔴 Failed";
  document.getElementById("connectionStatus").className = "status disconnected";
  log("❌ Connection failed: " + err.errorMessage);
}

function onConnectionLost(response) {
  document.getElementById("connectionStatus").innerHTML = "🔴 Disconnected";
  document.getElementById("connectionStatus").className = "status disconnected";
  log("⚠️ Connection lost: " + response.errorMessage);
  setTimeout(connectMQTT, 5000);
}

function onMessageArrived(message) {
  const topic = message.destinationName;
  const payload = JSON.parse(message.payloadString || "{}");

  log("📥 " + topic + " → " + JSON.stringify(payload));

  const parts = topic.split("/");
  if (parts.length >= 3 && parts[0] === "Advantech" && parts[2] === "data") {
    const mac = parts[1];
    if (!devices[mac]) createDevice(mac);
    updateLEDs(mac, payload);
  }
}

function createDevice(mac) {
  const div = document.createElement("div");
  div.className = "device";
  div.id = mac;
  div.innerHTML = `<b>${mac}</b><br>`;

  for (let i = 1; i <= 4; i++) {
    div.innerHTML += `
      DO${i}:
      <span class="led off" id="${mac}-do${i}"></span>
      <button onclick="sendOutput('${mac}', ${i}, true)">ON</button>
      <button onclick="sendOutput('${mac}', ${i}, false)">OFF</button><br>`;
  }

  document.getElementById("devices").appendChild(div);
  devices[mac] = div;
}

function updateLEDs(mac, data) {
  for (const [key, val] of Object.entries(data)) {
    const led = document.getElementById(`${mac}-${key}`);
    if (led) led.className = "led " + (val ? "on" : "off");
  }
}

function sendOutput(mac, output_no, value) {
  const topic = `Advantech/${mac}/ctl/do${output_no}`;
  const msg = new Paho.MQTT.Message(JSON.stringify({ v: value }));
  msg.destinationName = topic;
  client.send(msg);
  log(`📤 Sent to ${topic}: ${JSON.stringify({ v: value })}`);
}

function addDevice() {
  const mac = document.getElementById("macInput").value.trim();
  if (mac && !devices[mac]) {
    createDevice(mac);
    log("📡 Added device: " + mac);
  }
}

// Start connection
window.onload = connectMQTT;
