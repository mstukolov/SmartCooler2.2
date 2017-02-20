var cfenv = require("cfenv");
require('dotenv').load();
var express = require("express");
var app = express();

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
    var options = {
        root: __dirname + '/public/',
        dotfiles: 'deny',
        headers: {
            'x-timestamp': Date.now(),
            'x-sent': true
        }
    };
    var fileName = "index.html";
    res.sendFile(fileName, options);
});
app.post("/savedevice", function(req, res) {
   console.log('Начато создание устройства в базу данных');
    if (req.method == 'POST') {
        var jsonString = '';

        req.on('data', function (data) {
            jsonString += data;
        });

        req.on('end', function () {
            console.log(JSON.parse(jsonString));
        });
    }
  res.send("");
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

