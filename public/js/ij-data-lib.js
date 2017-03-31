/**
 * Created by Maxim on 23.03.2017.
 */
//Инициализация переменных и первоначальная загрузка страницы
//Переменная хранящая общий список доступных устройств
var devices = []
var devicesGPSLocation = []
//Переменная хранящая список выюранных устройств для отображения
var selectedDevices = []
var historyData = [];
var map;

//Функция инициализации страницы. Загрузка списка устройств и инициализация карты
window.onload = function () {
    buildDeviceList();
    // Создает экземпляр карты и привязывает его к созданному контейнеру
    map = new YMaps.Map(document.getElementById("YMapsID"));
    // Устанавливает начальные параметры отображения карты: центр карты и коэффициент масштабирования
    map.setCenter(new YMaps.GeoPoint(37.64, 55.76), 10);
    map.enableScrollZoom()
   /* var myEventListener = YMaps.Events.observe(map, map.Events.Click, function (map, mEvent) {
        var placemark = new YMaps.Placemark(mEvent.getGeoPoint());
        map.addOverlay(placemark);
    }, this);*/
};

//Функция для формирования полного списка доступных устройств
function buildDeviceList() {

    var x = document.getElementById("deviceSelection");
    var orgid = 'C2M';
    $.get("/getOrgDevicesGPS", {orgid : orgid},function(data) {

        selectedDevices.push(data[0].devid );

        for (index = 0; index < data.length; ++index) {
            //console.log('Устройство: ' + data[index].devid + ':' + data[index].lng + ':' + data[index].ltd)
            pushDeviceNamesToArray(data[index].devid, data[index].lng, data[index].ltd, x)
        }
    })

    /*devicesGPSLocation.forEach(function (item, i, data) {
        console.log('devicesGPSLocation: ' + item['deviceid'] + ':' + item['lng'] + ':' + item['ltd'])
    })*/

}

function pushDeviceNamesToArray(device_name, lng, ltd, x) {
    //console.log('devicesGPSLocation: ' + device_name + ':' + lng + ':' + ltd)
    devices.push(device_name)
    var option = document.createElement("option");
    option.text = device_name;
    x.add(option);

    //Заполнение массива данными о GPS-точке устройства
    var gpsPoint = {};
    gpsPoint['deviceid'] = device_name;
    gpsPoint['lng'] = lng;
    gpsPoint['ltd'] = ltd;

   // console.log('gpsPoint: ' + gpsPoint['deviceid']+ ":"+ gpsPoint['lng'])
    devicesGPSLocation.push(gpsPoint)

}
//Функция получения выбранных устройств для отображения графики
function redrawChartsByDeviceList(){
    selectedDevices = []
    $.each($("#deviceSelection option:selected"), function(){
        selectedDevices.push($(this).val());
    });
    showOverlaysOnYandexMap()
}
//Функция добавление элементов на Яндекс-карты
function showOverlaysOnYandexMap() {
    map.removeAllOverlays()
    var lng;
    var ltd;
    var tube = []

    selectedDevices.forEach(function(item, i, data) {

        var gps = getGPSPoint(item, devicesGPSLocation);
        lng = gps['lng']
        ltd = gps['ltd']
        tube.push(new YMaps.GeoPoint(lng, ltd))
        var placemark = new YMaps.Placemark(new YMaps.GeoPoint(lng, ltd));
        placemark.name = item;
        placemark.description = "Организация-1";
        map.addOverlay(placemark)
    });

   /* var s = new YMaps.Style();
    s.lineStyle = new YMaps.LineStyle();
    s.lineStyle.strokeColor = '0000FF55';
    s.lineStyle.strokeWidth = '5';
    YMaps.Styles.add("example#CustomLine", s);

    var pl = new YMaps.Polyline(tube);
    pl.setStyle("example#CustomLine");

    map.addOverlay(pl);*/
}
//Функция поиска значений в массиве JSON-объектов
function getGPSPoint(key, array) {
    for (var el in array) {
        if (array[el]['deviceid'] == key) {
            var gpsJson = {};
            gpsJson['lng'] = array[el]['lng'];
            gpsJson['ltd'] = array[el]['ltd'];
            return gpsJson;
        }
    }
}
//Функция получения последних данных с устройств
function getLastDataInAjax() {
    var query = {
        'type': 'BMP180',
        'devices': selectedDevices
    }
    var totalWater;
    var summaryData = [];
    var request = $.ajax({
        url: "/getcurvalues",
        data:query,
        type: 'GET',
        success:function (data) {
            //update bar chart
            barChart.setData(data)

            //update summary chart
            var sumFilled = 0;
            var sumTotal = 0;

            data.forEach(function (item, i, data) {
                    //console.log(item['y'] + '::' + item['a'] + '::' + item['b'])
                    var point = {};
                    var yColumn = 'y';
                    var valueColumn = item['y'];
                    point[yColumn] = (new Date()).getTime();
                    point[valueColumn] = item['a'];
                    if(historyData.length > 450){
                        historyData.shift()
                    }
                    historyData.push(point);
                    sumFilled += item['a'];
                    sumTotal += item['b'];
            });
            //console.log('sumFilled: ' + sumFilled + '/sumTotal: ' + sumTotal)
            chart.setData(historyData)

            //update donate graph
            summaryData = []
            totalWater = getRandomInt(0,1000);
            var tpoint1 = {};
            var tpoint2 = {};
            tpoint1['label'] = "Заполнено\n(литров)";
            tpoint1['value'] = sumFilled;
            tpoint2['label'] = "Пусто\n(литров)";
            tpoint2['value'] = sumTotal - sumFilled;

            summaryData.push(tpoint1);
            summaryData.push(tpoint2);
            donut.setData(summaryData);
        }
    });

};
var sendRequest = setInterval(function () {
    getLastDataInAjax();
}, 2000)

//-------------------------------------
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
