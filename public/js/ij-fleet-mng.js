/**
 * Created by Maxim on 28.03.2017.
 */
var map;
var last_placemark;
var points = []
var color = false

window.onload = function () {
    // Создает экземпляр карты и привязывает его к созданному контейнеру
    map = new YMaps.Map(document.getElementById("YMapsID"));
    // Устанавливает начальные параметры отображения карты: центр карты и коэффициент масштабирования
    map.setCenter(new YMaps.GeoPoint(37.64, 55.76), 10);

    map.enableScrollZoom()

    var myEventListener = YMaps.Events.observe(map, map.Events.Click, function (map, mEvent) {
        var placemark = new YMaps.Placemark(mEvent.getGeoPoint(),

            {
                draggable: true,
                iconColor: '#0095b6',
                balloonContent: 'цвет <strong>воды пляжа бонди</strong>'
            }
        );
        map.addOverlay(placemark);
        points.push(placemark)

        console.log('Размер массива' + '=' + points.length)
        if(points.length > 1){
            console.log('Предыдущая точка узла' + '=' + points[points.length - 2].getGeoPoint())
            console.log('Добавлена новая точка узла' + '=' + points[points.length - 1].getGeoPoint())
            var pl = new YMaps.Polyline([
                points[points.length - 2].getGeoPoint(),
                points[points.length - 1].getGeoPoint()
            ]);
            var s = new YMaps.Style();
            s.lineStyle = new YMaps.LineStyle();
            if(!color){
                s.lineStyle.strokeColor = '0000FF55';
                color = true
            }else {
                s.lineStyle.strokeColor = 'FF0000';
                color = false
            }

            s.lineStyle.strokeWidth = '6';
            YMaps.Styles.add("example#CustomLine", s);
            pl.setStyle("example#CustomLine");
            map.addOverlay(pl);
        }

        //myEventListener.cleanup();
        //last_placemark = placemark;
    }, this);

};
function finishLineCreate() {
    points = []
}