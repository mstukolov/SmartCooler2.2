/**
 * Created by Maxim on 22.02.2017.
 */
function deleteDevice() {
    var res = document.getElementById("divOrgDevId").innerHTML.split(":");

    console.log('Удаление устройства: ' + res[0]);
    console.log('Удаление устройства: ' + res[1]);
    console.log('Удаление устройства: ' + res[2]);

    $.get("/deletedevice?devid=" + res[2], function(data) {

    });
    getAllDevices();
    $("#modalManageWindow").modal().hide()
    $('.modal-backdrop').hide();
}


function initDeviceConnectionHistory() {
    new Morris.Line({
        // ID of the element in which to draw the chart.
        element: 'myfirstchart',
        // Chart data records -- each entry in this array corresponds to a point on
        // the chart.
        data: [
            { year: '2008', value: 5 },
            { year: '2009', value: 10 },
            { year: '2010', value: 15 },
            { year: '2011', value: 25 }
        ],
        // The name of the data record attribute that contains x-values.
        xkey: 'year',
        // A list of names of data record attributes that contain y-values.
        ykeys: ['value'],
        // Labels for the ykeys -- will be displayed when you hover over the
        // chart.
        labels: ['Value']
    });
}
function buildLineChart() {
    var xValue = (new Date()).getTime();
    var yValue = Math.random()*100;
    graphdata.push({ year2: xValue, value: yValue });
    chart.setData(graphdata)
    setTimeout(buildLineChart, 1000);
}
function renderPlot() {
    chart = Morris.Line({
        element: 'online-device-chart',
        xkey: 'year2',
        ykeys: ['value'],
        labels: ['Value']
    });
}
