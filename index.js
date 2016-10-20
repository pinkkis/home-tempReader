const sensor = require('ds18b20-raspi');
const mqtt = require('mqtt');
const os = require("os");

const hostname = os.hostname();
const mqttUrl = 'mqtt://192.168.192.150';

let tempTimer = null;

let client = mqtt.connect(mqttUrl);

sensor.list((err, deviceIds) => {
    if (err) {
        console.error('Tried to find the list of connected devices.');
        console.error(err);
    } else {
        console.info(`Starting tempReader on host: ${hostname}. Devices connected: `);
        console.info(deviceIds);
    }
});

client.on('connect', () => {
    console.log('connected to MQTT broker');
    tempTimer = setInterval(sendTemps, 5000);
    client.subscribe(['partyline', 'commands', 'home']);

    client.publish('partyline', JSON.stringify({hostname: hostname, service: 'tempReader', message:'started'}));
});

client.on('close', () => stopTemps() );
//client.on('offline', () => stopTemps() );

function sendTemps() {
	sensor.readAllC( (err, temps) => {
		if (err) {
			console.error(err);
			client.publish('errors', err);
		} else {
		    temps = temps.map( t => {
                t.timestamp = Date.now();
                t.hostname = hostname;
                return t;    
            });
            
            console.info('Logging temps:', temps);
            client.publish('temps', JSON.stringify(temps));
		}
	});	
}

function stopTemps() {
	console.log('stopping temp timer');
	clearInterval(tempTimer);
}

process.on('exit', () => {
    try {
        client.end(true);
    } catch(e) {}
});

process.on('uncaughtException', (err) => {
    console.error(err);
    try {
        client.publish('errors', `${hostname} caught exception: ${err}`);
        client.end(true);
    } catch(e) {}
    
});