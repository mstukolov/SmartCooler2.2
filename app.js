var express = require('express');
var path = require('path')

//Зависимости для Bluemix
var cfenv = require('cfenv');
var appEnv = cfenv.getAppEnv();

var app = express.createServer();

function checkAuth (req, res, next) {
    console.log('checkAuth ' + req.url);

    // don't serve /secure to those not logged in
    // you should add to this list, for each and every secure url
    if (req.url === '/secure' && (!req.session || !req.session.authenticated)) {
        res.render('unauthorised', { status: 403 });
        return;
    }
    if (req.url === '/index' && (!req.session || !req.session.authenticated)) {
        res.render('unauthorised', { status: 403 });
        return;
    }
    if (req.url === '/devices' && (!req.session || !req.session.authenticated)) {
        res.render('unauthorised', { status: 403 });
        return;
    }

    next();
}

app.configure(function () {

    app.use(express.cookieParser());
    app.use(express.session({ secret: 'example' }));
    app.use(express.bodyParser());
    app.use(checkAuth);
    app.use(app.router);

    app.set('views', path.join(__dirname, 'public'));
    app.set('view engine', 'ejs');
    app.set('view options', { layout: false });
    app.use(express.static(__dirname + '/public'))

});

require('./lib/routes.js')(app);
require('./lib/mysql-routes.js')(app);

//app.listen(port);
app.listen(appEnv.port, '0.0.0.0', function() {
    // print a message when the server starts listening
    console.log("server starting on " + appEnv.url);
});

