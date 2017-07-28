/**
 * Created by MAKS on 14.06.2017.
 */
var request = require('request');
//maks: custom lib for sequelize
var sequelize_mysql = require('./sequelize-mysql');
//
var util = require('util');
//email dependencies
const nodemailer = require('nodemailer');
//----Инициализация подключения к MySQL
var mysql = require('mysql');
var db = mysql.createConnection({
    host: 'sl-us-dal-9-portal.3.dblayer.com',
    port: '19904',
    user: 'admin',
    password: 'OOYHORSHUNYPKLAF',
    database: 'compose'
});

//Инициализация IOT-сервиса
var iotfService = require("ibmiotf");
var appClientConfig = {
    "org" : 'kwxqcy',
    "id" : 'a-kwxqcy-app11111',
    "domain": "internetofthings.ibmcloud.com",
    "auth-key" : 'a-kwxqcy-1dw7hvzvwk',
    "auth-token" : 'tsM8N(FS@iOc3CId+5'
}
var appClient = new iotfService.IotfApplication(appClientConfig);
appClient.connect();
appClient.on("connect", function () {
    appClient.subscribeToDeviceEvents("SmartCooler","+","+","json");
});
var lastdata = [];
var set = new Set();

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
    var sql = "update Devices set qtyBottle = qtyBottle-1 where devid='" + deviceid + "'";
        db.query(sql, function (err, result) {
            if(err) throw err;

                var selectQty = "select qtyBottle from Devices where devid='" + deviceid + "'";
                    db.query(selectQty, function (err, result) {
                        console.log("Произошла смена бутылки. Текущее количество" + result[0]['qtyBottle']);
                        sendAlertToEmail(deviceid, "Произошла смена бутылки. Текущее количество=" + result[0]['qtyBottle'], emails)
                    });

        });
}
appClient.on("deviceEvent", function (deviceType, deviceId, eventType, format, payload) {

    //Ограничение по размеру стэка сообщений. Если сообщений больше чем maxLenght, то первый элемент удаляется
    var maxLenght = 96;
    if(lastdata.length > maxLenght){lastdata.shift()}

    console.log("Device Event from :: "+deviceType+" : "+deviceId+" of event "+eventType+" with payload : "+payload);

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
    var sql = 'SELECT email from Devices where devid ='+ '"' + deviceId +'";'
    db.query(sql, function (err, result) {
        if(err) throw err;
        var json =  JSON.parse(JSON.stringify(result));
        //Вызов алгоритма по определению типа события, по изменению веса
        if(typeof prevDeviceValue !== "undefined"){
            //console.log('Изменение:' + prevDeviceValue + '-->' + newDeviceValue + ':' + vmax);
            if(json.length > 0){
                eventDeviceDefinition(deviceId, newDeviceValue, prevDeviceValue, vmax, json[0].email)
            }
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


//----------------
module.exports = function (app) {
    //роутинг для формирования списка устройств на странице управления устройствами
    app.get("/getUserDevices", function(req, res) {
        sequelize_mysql.getUserOrgId(req.query.userid).then(function (orgId) {
            var sql = 'SELECT * FROM Devices where orgid = ?';
            db.query(sql, [orgId], function (err, result) {
                if(err) throw err;
                res.send(result);
            });
        })
    });
    //роутинг для формирования списка устройств на dashboard
    app.get("/getUserDevicesGPS", function(req, res) {
        sequelize_mysql.getUserOrgId(req.query.userid).then(function (orgId) {
            var sql = 'SELECT devid, lng, ltd FROM Devices where orgid = ?';
            db.query(sql, [orgId], function (err, result) {
                if(err) throw err;
                res.send(result);
            });
        });
    });

    //RestAPI для 1С: Предприятие
    app.get('/erp-inventory', function (req, res) {
        var sql = "SELECT devid, qtyBottle FROM Devices where orgid = '" + req.query.orgid + "'";
        db.query(sql, function (err, result) {
            if(err) throw err;
            data = []
            result.forEach(function(item, i, result) {
                json = {}
                json['deviceid'] = item['devid']
                json['qty'] = item['qtyBottle']
                data.push(json)
            });
            res.send(data)
        });
    });

    //Изменение свойств устройства в БД MySQL на страницы devices.ejs
    app.get('/updateDeviceParams', function (req, res) {
        var sql;
        var url= 'https://geocode-maps.yandex.ru/1.x/?format=json&geocode=' + encodeURI(req.query.address)
        request(url, function (error, response, body) {
            var update = {};

            if(JSON.parse(body).response.GeoObjectCollection.featureMember[0] != undefined){
                    point = JSON.parse(body).response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos;
                    update['lng'] = point.substring(0,9);
                    update['ltd'] = point.substring(10,21);
            }

                    if(req.query.devQtyChange){update['qtyBottle'] = req.query.devQtyChange}
                    if(req.query.emailGroup){update['email'] = req.query.emailGroup}
                    if(req.query.name){update['name'] = req.query.name}
                    if(req.query.address){update['address'] = req.query.address}

                    sql = 'UPDATE Devices SET ? WHERE devid=' + "'" + req.query.orgDevId + "'";

                            db.query(sql, update, function (err, result) {
                                if(err) throw err;
                                if(req.query.devQtyChange !=''){
                                    qtyChangedEvent(req.query.devQtyChange, req.query.orgDevId, res);
                                }else {
                                    res.redirect("devices")
                                }
                            });
            });
    });
    function qtyChangedEvent(newQty, deviceid, res){
        var sqlEmailGroup = 'SELECT email from Devices where devid ='+ '"' + deviceid +'";'

        db.query(sqlEmailGroup, function (err, result) {
            if(err) throw err;
            var string=JSON.stringify(result);
            var json =  JSON.parse(string);

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
            res.redirect("devices")
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
       /* appClient.
        registerDevice(req.query.devtype,req.query.devid,"12345678").then (function onSuccess (argument) {
            console.log("Success");
            console.log(argument);
        }, function onError (argument) {
            console.log("Fail");
            console.log(argument.data);
        });*/

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
        saveDeviceToMySql(req.query.orgid, req.query.devid, req.query.devtype, req, res);
        //res.redirect("devices")
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
    });
    app.get("/deletedevice", function(req, res) {
        var deviceid = req.query.devid;
        var devicetype = req.query.devtype;
        var sql = 'DELETE FROM Devices where devid = ?';

        //Удаление устройства с IBM Bluemix
        appClient.unregisterDevice(devicetype, deviceid). then (function onSuccess (response) {
            //Success callback
            console.log('Device deleted from IBM Bluemix: '  + deviceid +':'+ devicetype);
            console.log(response);

            db.query(sql, [deviceid], function (err, result) {
                if(err) throw err;
                res.render("devices")
            });

        }, function onError (argument) {
            //Failure callback
            console.log("Fail");
            console.log(argument);
        });
    });

    //работа с реле
    app.get("/releon", function(req, res) {
        var on={"rel":1};
        on = JSON.stringify(on);
        appClient.publishDeviceCommand("SmartCooler",req.query.devid, "rele", "json", on);
        res.redirect("devices")
    });

    app.get("/releoff", function(req, res) {
        var deviceid = req.query.devid;
        var off={"rel":0};
        off = JSON.stringify(off);
        appClient.publishDeviceCommand("SmartCooler",req.query.devid, "rele", "json", off);
        res.redirect("devices")
    });

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
    function saveDeviceToMySql(orgid, devid, devtype, req, res) {
        var sql = 'INSERT INTO Devices SET ?';
        var newDevice = { orgid: orgid, devid: devid,  devtype: devtype};


        db.query(sql, [newDevice], function (err, result) {
            //if(err) throw err;
            if(err){
                res.render('devices',
                    {
                        'username' : req.session.username,
                        'viewRoot' : req.session.viewRoot,
                        'statusEvent': 'alert-danger',
                        'statusMessage': 'Устройство уже существует'
                    });
            }else{
                appClient.registerDevice(devtype, devid,"12345678").then (function onSuccess (argument) {
                    res.render('devices',
                        {
                            'username' : req.session.username,
                            'viewRoot' : req.session.viewRoot,
                            'statusEvent': 'alert-success',
                            'statusMessage': 'Устройство сохранено'
                        });
                    console.log("Success"); console.log(argument);
                }, function onError (argument) {
                    console.log("Fail"); console.log(argument.data);
                });
            }


        });
    }
    function getOrgDevices() {
        var sql = 'SELECT * FROM Devices';
        var data = [];
        db.query(sql, function (err, result) {
            if(err) throw err;
            data=result;
        });
        return data;
    }
};
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
        auth: { user: 'Maxim.Stukolov@center2m.ru', pass: 'java2018!' },
        secureConnection: true,
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