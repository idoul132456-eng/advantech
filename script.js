const broker = "d2f277161aef4f56a41ef426746a4219.s1.eu.hivemq.cloud";
const port = 8884;  // WebSocket secure port
const username = "user1";
const password = "User1234";
let client;
const devices = {};

function connectMQTT() {
  client = new Paho.MQTT.Client(broker, port, "/mqtt", "webclient-" + Math.random().toString(16).substr(2, 8));

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
