/**
 * Created by MAKS on 25.07.2017.
 */
var Sequelize = require('sequelize')
require('mysql2')
const Devicetrans = require('../models').Devicetrans;
const sequelize = new Sequelize('mysql://admin:OOYHORSHUNYPKLAF@sl-us-dal-9-portal.3.dblayer.com:19904/compose');

module.exports = {
    create(req, res) {
        return Devicetrans
                .create({
                    devid: req.query.devid || 'undefined',
                    nparam1: req.query.nparam1 || 0,
                    nparam2: req.query.nparam2 || 0,
                    nparam3: req.query.nparam3 || 0,
                    nparam4: req.query.nparam4 || 0,
                    nparam5: req.query.nparam5 || 0,
                    tparam1: req.query.tparam1 || 'undefined',
                    tparam2: req.query.tparam2 || 'undefined'
                })
                .then(res.status(200).send('Entity success saved'))
                .catch(error => res.status(400).send(error));
    },
    listJson(req, res) {
        return Devicetrans
                .all()
                .then(list => res.status(200).send(list))
    .catch(error => res.status(400).send(error));
    }
};