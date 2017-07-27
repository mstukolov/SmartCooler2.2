/**
 * Created by MAKS on 14.06.2017.
 */
var util = require('util');
var sequelize_mysql = require('./sequelize-mysql');


//----------------
module.exports = function (app) {

    app.get('/', function (req, res, next) {
        res.render('welcome');
    });

    app.get('/secure', function (req, res, next) {
        res.render('index');
    });

    app.get('/login', function (req, res, next) {
        res.render('login', { flash: req.flash() } );
    });

    app.post('/login', function (req, res, next) {

        sequelize_mysql.userVerification(req.body.username, req.body.password).then( function(result) {
            if(result){
                req.session.authenticated = true;
                req.session.username = req.body.username;
                req.session.viewRoot = 'advanced';

                console.log('Аутентификация прошла успешно: ' + req.session.username)
                res.redirect('/index');
            }else{
                req.flash('error', 'Username and password are incorrect');
                //res.redirect('/');
                res.render('unauthorised', { status: 403 });
            }
        });
    });

    app.get('/logout', function (req, res, next) {
        delete req.session.authenticated;
        res.redirect('/');
    });
    app.get('/index', function (req, res, next) {
       res.render('index', { 'username' : req.session.username });
    });
    app.get('/devices', function (req, res, next) {
        res.render('devices', { 'username' : req.session.username, 'viewRoot' : req.session.viewRoot, 'statusMessage': ''});
    });



};


