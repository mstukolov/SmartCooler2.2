/**
 * Created by Maxim on 22.02.2017.
 */

//Проверка соединения с устройством
function DeviceTestConnection() {
    var res = document.getElementById("divOrgDevId").innerHTML.split(":");
    console.log('Тестирование устройства: ' + res[2]);
    $.get("/testdeviceconnection?devid=" + res[2] + "&devtype=" + res[1], function(data) {
        //console.log(data);
        alert(data);
    });
}
//Удаление информации об устройстве.
function deleteDevice() {
    var res = document.getElementById("divOrgDevId").innerHTML.split(":");

    console.log('Удаление устройства res[0]: ' + res[0]);
    console.log('Удаление устройства res[1]: ' + res[1]);
    console.log('Удаление устройства res[2]: ' + res[2]);

    $.get("/deletedevice?devid=" + res[2] + "&devtype=" + res[1], function(data) {});
    getAllDevices();
    $("#modalManageWindow").modal().hide()
    $('.modal-backdrop').hide();
    location.reload();
}

//Функция которая заполняет заголовок выпадающей формы управления устройством
function manageDevice(rowId) {
    var org =document.getElementById(rowId).childNodes[1].childNodes[0].innerHTML;
    var device =document.getElementById(rowId).childNodes[2].childNodes[0].value;
    var devicetype =document.getElementById(rowId).childNodes[3].childNodes[0].value;
    document.getElementById("divOrgDevId").innerHTML = org +':' + devicetype + ':' + device;
    console.log(rowId + ':' + org +':' + device +':' + devicetype);
}

//Запрос к базе данных списка устройств созданных для организации
// и заполнение таблицы id="tableAddRow" на странице devices.html
function getAllDevices() {
    var orgid = 'C2M';
    var tableHeaderRowCount = 1;
    var table = document.getElementById('tableAddRow');
    var rowCount = table.rows.length;
    for (var i = tableHeaderRowCount; i < rowCount; i++) {
        table.deleteRow(tableHeaderRowCount);
    }


    $.get("/getOrgDevices", {orgid : orgid},function(data) {
        document.getElementById("devqty").innerHTML = data.length;
        var statusOn = 'glyphicon glyphicon-signal';
        var statusOff = 'glyphicon glyphicon-remove';
        var statusico='';

        var index;
        for (index = 0; index < data.length; ++index) {
            if(index%2 != 0){
                statusico = statusOn
            } else {statusico = statusOff}

            //console.log(data[index].devid + ':' + data[index].devtype + ':' + data[index].orgid);
            var tempTr = $('<tr id="row'+ index +'">' +
                '<td>' +
                '<output id="status_' + index + '" style="font-size: larger">'+ '<span id="status-ico-'+ index +'" class="'+ statusico +'"></span>' +'</output></td>' +
                '<td><output id="orgid_' + index + '" style="font-size: larger">'+ data[index].orgid +'</output></td>' +
                '<td><output type="text" id="devid_' + index + '" style="font-size: larger">'+ data[index].devid +'</output></td>' +
                '<td><output type="text" id="type_' + index + '" style="font-size: larger">'+ data[index].devtype +'</output></td>' +
                '<td><output type="text" id="name_' + index + '" style="font-size: larger">'+ data[index].name +'</output></td>' +
                '<td><output type="text" id="qty_' + index + '" style="font-size: larger">'+ data[index].qtyBottle +'</output></td>' +
                '<td><output type="text" id="email_' + index + '" style="font-size: larger">'+ data[index].email +'</output></td>' +
                '<td><output type="text" id="lng1_' + index + '" style="font-size: larger">'+ data[index].lng +'</output></td>' +
                '<td><output type="text" id="ltd1_' + index + '" style="font-size: larger">'+ data[index].ltd +'</output></td>' +
                '<td><input type="button" onClick="manageDevice(this.parentNode.parentNode.id);" id="manage_' + index + '" class="form-control btn-manage" value="Управление" data-toggle="modal" data-target="#modalManageWindow"/></td>' +
                '</tr>');

            $("#tableAddRow").append(tempTr);
        }
    });
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

