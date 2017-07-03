/**
 * Created by MAKS on 14.06.2017.
 */
var util = require('util');



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


        //Define users and password
        var userMap = new Map();
        userMap.set("admin", "java");
        userMap.set("user1", "123456");
        userMap.set("user2", "123456");
        userMap.set("user3", "123456");
        userMap.set("user4", "123456");
        userMap.set("user5", "123456");
        userMap.set("user6", "123456");
        userMap.set("user7", "123456");
        userMap.set("user8", "123456");
        userMap.set("user9", "123456");

        var flag = false
        if (req.body.username && req.body.password) {
            userMap.forEach(function(value, key, userMap) {
                if(req.body.username === key && req.body.password === value){
                    console.log('Авторизованный пользователь найден:' + key + " = " + value);
                    flag = true;
                }
            })
        }


        if(flag){
            req.session.authenticated = true;
            req.session.username = req.body.username;
            console.log('Аутентификация прошла успешно: ' + req.session.username)
            res.redirect('/index');
        }else{
            req.flash('error', 'Username and password are incorrect');
            //res.redirect('/');
            res.render('unauthorised', { status: 403 });
        }

    });

    app.get('/logout', function (req, res, next) {
        delete req.session.authenticated;
        res.redirect('/');
    });
    app.get('/index', function (req, res, next) {
       res.render('index', { 'username' : req.session.username });
    });
    app.get('/devices', function (req, res, next) {
        res.render('devices', { 'username' : req.session.username });
    });


};


