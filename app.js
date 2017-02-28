var cfenv = require("cfenv");
require('dotenv').load();
var config = require('./config.json');

//Инициализация веб-сервера и основных настроек
var express = require("express");
var app = express();
app.use(express.static(__dirname + '/public'));
var options = {
    root: __dirname + '/public/',
    dotfiles: 'deny',
    headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
    }
};
//Инициализация IOT-сервиса
var iotf = require("ibmiotf");

/*var configType = {
    "org" : "kwxqcy",
    "type" : "gwtype",
    "id" : "Gateway01",
    "domain": "internetofthings.ibmcloud.com",
    "auth-method" : "token",
    "auth-token" : "qwerty123"
};*/
var appClient = new iotf.IotfApplication(config);
/*
var gatewayClient = new iotf.IotfGateway(configType);
gatewayClient.log.setLevel('debug');
gatewayClient.connect();
*/
//----Инициализация подключения к MySQL
var mysql = require('mysql');
var db = mysql.createConnection({
    host: 'sl-us-dal-9-portal.3.dblayer.com',
    port: '19904',
    user: 'admin',
    password: 'OOYHORSHUNYPKLAF',
    database: 'compose'
});
createTable();
//-------------Основной исполняемый код----------------------------
app.get('/', function (req, res) {
    var fileName = "index.html";
    res.sendFile(fileName, options);
});
app.get('/testdeviceconnection', function (req, res) {
    console.log('testdeviceconnection: ' + req.query.devtype + ':' + req.query.devid);
    appClient.connect();
    appClient.on('connect', function () {
        console.log('Success device connection');
        res.send('Success device connection from Node.js');
    });
});


app.get("/savedevice", function(req, res) {
    //gatewayClient.publishDeviceEvent(req.query.devtype, req.query.devid, "status","json",'{"d" : { "cpu" : 60, "mem" : 50 }}');

    var devices = {
        "devices" : [
            {
                "typeId": req.query.devtype,
                "deviceId": req.query.devid
            }
        ]
    };
    var devices2 =
    // Register Multiple devices
    appClient.registerMultipleDevices(devices.devices). then (
        function onSuccess (response) {
            //Success callback
            console.log("Success");
            console.log(response);
        },
        function onError (argument) {
            //Failure callback
            console.log("Fail");
            console.log(argument);
        });
    saveDeviceToMySql(req.query.orgid, req.query.devid, req.query.devtype);
    res.redirect("devices.html")
});
app.get("/deletedevice", function(req, res) {
    var deviceid = req.query.devid;
    var devicetype = req.query.devtype;
    var sql = 'DELETE FROM devices where devid = ?';

    appClient.
    unregisterDevice(devicetype, deviceid). then (function onSuccess (response) {
        //Success callback
        console.log("Success");
        console.log(response);
    }, function onError (argument) {
        //Failure callback
        console.log("Fail");
        console.log(argument);
    });
    db.query(sql, [deviceid], function (err, result) {
        if(err) throw err;
        res.send(result);
    });
    console.log('Device deleted: ' + deviceid);
});
app.get("/getOrgDevices", function(req, res) {
    var orgid = req.query.orgid;
    var sql = 'SELECT * FROM devices where orgid = ?';

    db.query(sql, [req.query.orgid], function (err, result) {
        if(err) throw err;
        res.send(result);
    });
});



//Код для запуска в локальном режиме
var hostPort = 4444;
app.listen(hostPort, function () {
    console.log('Example app listening on port: ' + hostPort);
});


//Код для публикации на Bluemix-сервере
/*var appEnv = cfenv.getAppEnv();
 app.listen(appEnv.port, '0.0.0.0', function () {
 console.log('Example app listening on port 3000!');
 });*/

//---CRUD operation for mysql db----
function createTable() {
    var sql = 'CREATE TABLE IF NOT EXISTS devices ('
        + 'id INTEGER PRIMARY KEY AUTO_INCREMENT,'
        + 'orgid text,'
        + 'devid text,'
        + 'devtype text'
        + ');';
    db.query(sql, function (err, result) {
        if (err) console.log(err);
    });
}
function saveDeviceToMySql(orgid, devid, devtype) {
    var sql = 'INSERT INTO devices SET ?';
    var newDevice = { orgid: orgid, devid: devid,  devtype: devtype};


    db.query(sql, [newDevice], function (err, result) {
        if(err) throw err;
        console.log('Last insert ID:', result.insertId);
    });
}
function getOrgDevices() {
    var sql = 'SELECT * FROM devices';
    var data = [];
    db.query(sql, function (err, result) {
        if(err) throw err;
        data=result;
    });
    return data;
}

