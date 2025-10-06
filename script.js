// HiveMQ Serverless config
const broker = "d2f277161aef4f56a41ef426746a4219.s1.eu.hivemq.cloud";
const port = 8884;
const username = "user1";
const password = "User1234";

let client;
const devices = {};

// Logger
function log(msg){
    const monitor = document.getElementById("monitor");
    const time = new Date().toLocaleTimeString();
    monitor.innerHTML += `[${time}] ${msg}<br>`;
    monitor.scrollTop = monitor.scrollHeight;
    console.log(msg);
}

// Connect to MQTT broker
function connectMQTT(){
    const clientID = "webclient-" + Math.random().toString(16).substr(2,8);
    const wsURL = `wss://${broker}:${port}/mqtt`;

    client = mqtt.connect(wsURL, {
        clientId: clientID,
        username: username,
        password: password,
        protocol: "wss",
        reconnectPeriod: 1000
    });

    client.on('connect', () => {
        log("✅ Connected to HiveMQ");
        const status = document.getElementById("connectionStatus");
        status.className = "status connected";
        status.innerText = "🟢 Connected";
    });

    client.on('reconnect', () => log("♻ Reconnecting..."));
    client.on('error', (err) => log("❌ Connection error: " + err));
    client.on('close', () => {
        log("🔴 Connection closed");
        const status = document.getElementById("connectionStatus");
        status.className = "status disconnected";
        status.innerText = "🔴 Disconnected";
    });

    client.on('message', (topic, payload) => {
        const mac = topic.split('/')[1];
        const json = payload.toString();
        log(`📩 Topic: ${topic}, Payload: ${json}`);

        if(devices[mac]){
            const deviceDiv = devices[mac];
            const dataDiv = deviceDiv.querySelector(".device-data");
            dataDiv.innerText = json;

            try {
                const obj = JSON.parse(json);
                // Update DO
                for(let i=1;i<=4;i++){
                    const led = deviceDiv.querySelector(`.do${i}`);
                    if(led && obj[`do${i}`]!==undefined) {
                        led.classList.toggle("on", obj[`do${i}`]===true);
                        led.classList.toggle("off", obj[`do${i}`]!==true);
                    }
                }
                // Update DI
                for(let i=1;i<=4;i++){
                    const led = deviceDiv.querySelector(`.di${i}`);
                    if(led && obj[`di${i}`]!==undefined) {
                        led.classList.toggle("on", obj[`di${i}`]===true);
                        led.classList.toggle("off", obj[`di${i}`]!==true);
                    }
                }
            } catch(e){
                console.warn("Invalid JSON:", e);
            }
        }
    });
}

// Add device dynamically with ON/OFF buttons
function addDevice() {
    const mac = document.getElementById("macInput").value.trim();
    if (!mac) return alert("Enter MAC");
    if (devices[mac]) return alert("Device already added");

    const deviceDiv = document.createElement("div");
    deviceDiv.className = "device";
    deviceDiv.innerHTML = `
        <h4>Device ${mac}</h4>
        <div>
            Inputs:
            <span class="led di1 off"></span>DI1
            <span class="led di2 off"></span>DI2
            <span class="led di3 off"></span>DI3
            <span class="led di4 off"></span>DI4
        </div>
        <div>
            Outputs:
            <span class="led do1 off"></span>DO1
            <span class="led do2 off"></span>DO2
            <span class="led do3 off"></span>DO3
            <span class="led do4 off"></span>DO4
        </div>
        <div class="device-data">No data yet</div>
        <div>
            <button data-output="1" data-action="on">ON DO1</button>
            <button data-output="1" data-action="off">OFF DO1</button>
            <button data-output="2" data-action="on">ON DO2</button>
            <button data-output="2" data-action="off">OFF DO2</button>
            <button data-output="3" data-action="on">ON DO3</button>
            <button data-output="3" data-action="off">OFF DO3</button>
            <button data-output="4" data-action="on">ON DO4</button>
            <button data-output="4" data-action="off">OFF DO4</button>
        </div>
    `;
    document.getElementById("devices").appendChild(deviceDiv);
    devices[mac] = deviceDiv;

    // Subscribe to device data topic
    client.subscribe(`Advantech/${mac}/data`, (err) => {
        if (err) log("❌ Subscribe error: " + err);
        else log(`Subscribed to Advantech/${mac}/data`);
    });

    // Attach button listeners
    deviceDiv.querySelectorAll("button").forEach(btn => {
        btn.addEventListener("click", () => {
            const output = btn.getAttribute("data-output");
            const action = btn.getAttribute("data-action"); // "on" or "off"
            const payload = {"v": action === "on"}; // {"v":true} for ON, {"v":false} for OFF

            const topic = `Advantech/${mac}/ctl/do${output}`;
            client.publish(topic, JSON.stringify(payload));
            log(`➡ Sent ${JSON.stringify(payload)} to ${topic}`);
        });
    });
}

// Initialize
window.addEventListener("load", () => {
    connectMQTT();
    document.getElementById("addDeviceBtn").addEventListener("click", addDevice);
});
