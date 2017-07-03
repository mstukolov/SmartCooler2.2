var cfenv = require("cfenv");
require('dotenv').load();
var config = require('./config.json');

//email dependencies
const nodemailer = require('nodemailer');
//

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
var iotfService = require("ibmiotf");
var appClientConfig = {
    "org" : 'kwxqcy',
    "id" : 'a-kwxqcy-app556678',
    "domain": "internetofthings.ibmcloud.com",
    "auth-key" : 'a-kwxqcy-1dw7hvzvwk',
    "auth-token" : 'tsM8N(FS@iOc3CId+5'
}
var appClient = new iotfService.IotfApplication(appClientConfig);
appClient.connect();
appClient.on("connect", function () {
    //appClient.subscribeToDeviceEvents("Тип устройства","Код устройства","+","json");
    appClient.subscribeToDeviceEvents("SmartCooler","+","+","json");
});
var lastdata = [];
var set = new Set();

appClient.on("deviceEvent", function (deviceType, deviceId, eventType, format, payload) {

        //Ограничение по размеру стэка сообщений. Если сообщений больше чем maxLenght, то первый элемент удаляется
        var maxLenght = 96;
        if(lastdata.length > maxLenght){lastdata.shift()}

        //console.log("Device Event from :: "+deviceType+" : "+deviceId+" of event "+eventType+" with payload : "+payload);

        var prevDeviceValue = 0;
        var vmax = 0;
        if(typeof findLastMessageByDeviceId(deviceId) !== "undefined"){
            //Получение предыдущего значения из стэка в памяти приложения
            prevDeviceValue = findLastMessageByDeviceId(deviceId)['d']['param1'];
            vmax = findLastMessageByDeviceId(deviceId)['d']['param2']
        }

        addLastValToStack(JSON.parse(payload))
        var newDeviceValue = JSON.parse(payload)['d']['param1']

        //Получение группы рассылки сообщений
        var sql = 'SELECT email from devices where devid ='+ '"' + deviceId +'";'
        db.query(sql, function (err, result) {
            if(err) throw err;
            var json =  JSON.parse(JSON.stringify(result));
            //Вызов алгоритма по определению типа события, по изменению веса
            if(typeof prevDeviceValue !== "undefined"){
                //console.log('Изменение:' + prevDeviceValue + '-->' + newDeviceValue + ':' + vmax);
                eventDeviceDefinition(deviceId, newDeviceValue, prevDeviceValue, vmax, json[0].email)
            }
        });
});
function addLastValToStack(message) {
    for (var i = 0; i < lastdata.length; i++) {
        var current = lastdata[i];
        if(current['d']['deviceid'] == message['d']['deviceid']) lastdata.splice(i,1)
    }
    //if(message['d']['param1'] < 2){sendAlertToEmail(); console.log('Current value is lower than 2')}
    lastdata.push(message)
}
function findLastMessageByDeviceId(deviceid) {
    var reverse = lastdata.reverse();
    var lastVal = reverse.find(function (element, index, array) {
        return element['d']['deviceid'] == deviceid
    })
    return lastVal;
}

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
app.get('/test-node-red-con', function (req, res) {
    res.send('Success device connection from Smart Coller Node.js');
});
//Изменение свойств устройства в БД MySQL на страницы devices.ejs
app.get('/updateDeviceParams', function (req, res) {
    console.log('DevID:'+req.query.orgDevId+ ', ' + 'New Qty: ' + req.query.devQtyChange);
    console.log('emailGroup:'+req.query.emailGroup);
    console.log('Location:'+req.query.lng +':' + req.query.ltd);
    console.log('Device Name:'+req.query.name);

    var sql;
    //SQL-скрипт если заполнены оба поля количество и email
    if(req.query.devQtyChange !='' && req.query.emailGroup != '') {
        sql = 'UPDATE devices SET ' +
            'qtyBottle=' + req.query.devQtyChange + "," +
            'email=' + "'" + req.query.emailGroup + "'" +
            ' where devid=' + "'" + req.query.orgDevId + "'";

        db.query(sql, function (err, result) {
            if(err) throw err;
            qtyChangedEvent(req.query.devQtyChange, req.query.orgDevId, res)
        });

    }

    //SQL-скрипт если заполнено количество, а email пусто
    if(req.query.devQtyChange !='' && req.query.emailGroup == ''){
        sql = "UPDATE devices SET " +
            "qtyBottle='" + req.query.devQtyChange + "'" +
            " where devid='"  + req.query.orgDevId + "'";

        console.log(sql)
        db.query(sql, function (err, result) {
            if(err) throw err;
            qtyChangedEvent(req.query.devQtyChange, req.query.orgDevId, res)
        });
    }

    //SQL-скрипт если не заполнено количество, и заполнено email
    if(req.query.devQtyChange == '' && req.query.emailGroup != ''){
        sql = "UPDATE devices SET " +
            "email='" + req.query.emailGroup + "'" +
            " where devid=" + "'" + req.query.orgDevId + "'";
        console.log(sql)
        db.query(sql, function (err, result) {if(err) throw err;});
        res.redirect("devices.html")
    }
    //SQL-скрипт если заполнены оба поля для определения местоположения
    if(req.query.lng !='' && req.query.ltd != '') {
        sql = 'UPDATE devices SET ' +
            'lng=' + req.query.lng + "," +
            'ltd=' + "'" + req.query.ltd + "'" +
            ' where devid=' + "'" + req.query.orgDevId + "'";

        console.log(sql)
        db.query(sql, function (err, result) {if(err) throw err;});
        res.redirect("devices.html")
    }
    //SQL-скрипт заполнения, обновления поля Название
    if(req.query.name !='') {
        sql = "UPDATE devices SET " +
            "name='" + req.query.name + "'" +
            " where devid='" + req.query.orgDevId + "'";
        console.log(sql)
        db.query(sql, function (err, result) {if(err) throw err;});
        res.redirect("devices.html")
    }


});
function qtyChangedEvent(newQty, deviceid, res){
    var sqlEmailGroup = 'SELECT email from devices where devid ='+ '"' + deviceid +'";'

    db.query(sqlEmailGroup, function (err, result) {
        if(err) throw err;
        var string=JSON.stringify(result);
        console.log('>> string: ', string );
        var json =  JSON.parse(string);
        console.log('>> json: ', json);
        console.log('>> device.email: ', json[0].email);

        if(newQty > 0) {
            sendAlertToEmail(
                deviceid,
                '<b>Количество бутылок изменилось на:' + newQty + '</b>' + '</br><i>C уважением, облачный сервис SmartCooler.</i>',
                json[0].email
            );
        }else{
            sendAlertToEmail(
                deviceid,
                '<b>У вас последняя бутылка!</b>' + '</br><i>C уважением, облачный сервис SmartCooler.</i>',
                json[0].email
            );
        }
        //res.redirect("devices.ejs", {root: __dirname + '/public/'})
        res.sendFile("devices.html", {root: __dirname + '/public/'})
    });
}
app.get("/savedevice", function(req, res) {
    var devices = {
        "devices" : [
            {
                "typeId": req.query.devtype,
                "deviceId": req.query.devid
            }
        ]
    };

    //Register a new Device
    appClient.
    registerDevice(req.query.devtype,req.query.devid,"12345678").then (function onSuccess (argument) {
        console.log("Success");
        console.log(argument);
    }, function onError (argument) {
        console.log("Fail");
        console.log(argument.data);
    });

    /*var devices2 =
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
        });*/
    saveDeviceToMySql(req.query.orgid, req.query.devid, req.query.devtype);
    res.redirect("devices.html")
});
app.get('/getcurvalues', function(req, res){

    var deviceList = req.query.devices
    var newValues = []
   /* console.log(req.query.type)
    console.log(deviceList)*/
   if(typeof deviceList !== "undefined"){
       deviceList.forEach(function(item, i, arr) {
           var point = {};
           var last = findLastMessageByDeviceId(item)
           if(last != undefined){
               var currentValue = last['d']['param1'];
               var maxValue = last['d']['param2'];

               if(maxValue == 0){maxValue = currentValue}
               if(maxValue != 0){
                   if(currentValue > maxValue) {maxValue = currentValue}
                   point['b'] = maxValue;
               } else { point['b'] = 1; }

           }else{
               currentValue = 0
           }

           point['y'] = item;
           point['a'] = currentValue;

           newValues.push(point)
       });
       res.send(newValues);
   } else {
       res.send('device list empty');
   }

    //console.log(newValues)


});
app.get("/deletedevice", function(req, res) {
    var deviceid = req.query.devid;
    var devicetype = req.query.devtype;
    var sql = 'DELETE FROM devices where devid = ?';

    //Удаление устройства с IBM Bluemix
    appClient.unregisterDevice(devicetype, deviceid). then (function onSuccess (response) {
        //Success callback
        console.log('Device deleted from IBM Bluemix: '  + deviceid +':'+ devicetype);
        console.log(response);

        db.query(sql, [deviceid], function (err, result) {
            if(err) throw err;
        });
        res.redirect("devices.html")

    }, function onError (argument) {
        //Failure callback
        console.log("Fail");
        console.log(argument);
    });

    /*db.query(sql, [deviceid], function (err, result) {
        if(err) throw err;
        res.send(result);
    });*/
});
app.get("/getOrgDevices", function(req, res) {

    var orgid = req.query.orgid;
    var sql = 'SELECT * FROM devices where orgid = ?';
    db.query(sql, [req.query.orgid], function (err, result) {
        if(err) throw err;
        res.send(result);
    });

});
app.get("/getOrgDevicesGPS", function(req, res) {
    var orgid = req.query.orgid;
    var sql = 'SELECT devid, lng, ltd FROM devices where orgid = ?';

    db.query(sql, [req.query.orgid], function (err, result) {
        if(err) throw err;
        res.send(result);
    });
});
app.get("/testQuery", function(req, res) {
    var network = req.query.wifi;
    var password = req.query.password;
    console.log('Запрос пришел: ' + network + ":" + password);
});
//работа с реле
app.get("/releon", function(req, res) {
    var on={"rel":1};
    on = JSON.stringify(on);
    appClient.publishDeviceCommand("SmartCooler","TestCooler-RT-71", "rele", "json", on);
    console.log('Реле успешно запущено');
});
app.get("/releoff", function(req, res) {
    var off={"rel":0};
    off = JSON.stringify(off);
    appClient.publishDeviceCommand("SmartCooler","TestCooler-RT-71", "rele", "json", off);
    console.log('Реле остановлено');
});

//-----------------------

//Код для запуска в локальном режиме

var appEnv = cfenv.getAppEnv();
var port = appEnv.port || 8080;
app.listen(port, function () {
    console.log("Express WebApp started on : http://localhost:" + port);
});
/*
var hostPort = 4444;
app.listen(hostPort, function () {
    console.log('Example app listening on port: ' + hostPort);
});
*/
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
//Send email messages
function sendAlertToEmail(device, message, email) {
    // create reusable transporter object using the default SMTP transport
    /*var transporter = nodemailer.createTransport({
        service: 'gmail',
        port: parseInt(587, 10),
        auth: {
            user: 'maxim.stukolov@gmail.com',
            pass: 'carter2017!'
        }
    });*/
    var transporter = nodemailer.createTransport({
        host: 'smtp.office365.com',
        port: '587',
        auth: { user: 'Maxim.Stukolov@center2m.ru', pass: 'java2017!' },
        secureConnection: false,
        tls: { ciphers: 'SSLv3' }
    });

// setup email data with unicode symbols
    var mailOptions = {
        from: '"C2M SmartCooler Service " <maks@center2m.com>', // sender address
        to: email, // list of receivers
        subject: device + ':Оповещение SmartCoolers ✔', // Subject line
        html: message // html body
    };
// send mail with defined transport object
    transporter.sendMail(mailOptions);
}

//Бизнес-логика, отвечающая за определение типа события по изменению веса
function eventDeviceDefinition(deviceid, _newValue, _previousValue, _vmax, emails){

    var  delta = _newValue - _previousValue;
    var maxDelta = 1.5

    if(  delta > 0){
        //console.log("Объем воды увеличился");
        if( delta  >= _vmax * 0.95 && delta <= _vmax * 1.05){
            decrementDeviceBottleQty(deviceid, emails);
        }
        if( delta  < _vmax * 0.98 || delta  >= _vmax * 1.02){
            //console.log("Кто-то надавил на кулер. Warning!!!");
            //mailerClient.sender("Кто-то надавил на кулер. Warning!!!");
        }
    }else if( (-1)*maxDelta < delta && delta < 0){
        //console.log("Кто-то отлил водички");
        //mailerClient.sender("Кто-то отлил водички");
    }else if( delta == 0){
        //console.log("Объем воды не изменился");
        //mailerClient.sender("Кто-то отлил водички");
    }
}

function decrementDeviceBottleQty(deviceid, emails){
    var sql = "update devices set qtyBottle = qtyBottle-1 where devid='" + deviceid + "'";
    db.query(sql, function (err, result) {
        if(err) throw err;
        console.log("Произошла смена бутылки");
        sendAlertToEmail(deviceid, "Произошла смена бутылки", emails)
    });
}

