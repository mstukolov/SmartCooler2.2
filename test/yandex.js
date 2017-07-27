/**
 * Created by MAKS on 26.07.2017.
 */
var request = require('request');

var express = require('express');
var app = express.createServer();

app.get('/', function (req, res) {

    var url= 'https://geocode-maps.yandex.ru/1.x/?format=json&geocode=' + encodeURI(req.query.address)
    request(url, function (error, response, body) {
        point = JSON.parse(body).response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos
        res.send(point);
    });

});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});

//var address = '37.710912,55.914155';
/*
var address = 'Московская+область,+Мытищи,+улица +Борисовка,12А';
var url1 = 'https://geocode-maps.yandex.ru/1.x/?geocode=' + address

url = 'https://geocode-maps.yandex.ru/1.x/?format=json&geocode=Москва,+Тверская,+7';
//url = 'https://geocode-maps.yandex.ru/1.x/?format=json&geocode=Moscow,Tverskaya,7';

request(url, function (error, response, body) {

    point = JSON.parse(body).response.GeoObjectCollection.featureMember["8"].GeoObject.Point.pos

});
*/
