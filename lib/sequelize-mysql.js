
var Sequelize = require('sequelize')
require('mysql2')

// Or you can simply use a connection uri
const sequelize = new Sequelize('mysql://admin:OOYHORSHUNYPKLAF@sl-us-dal-9-portal.3.dblayer.com:19904/compose');

sequelize.authenticate().then(() => {
    console.log('Connection has been established successfully.');
}).catch(err => {
    console.error('Unable to connect to the database:', err);
})

const User = sequelize.define('users', {
    recid: {
        type: Sequelize.STRING,
        primaryKey: true
    },
    user: {
        type: Sequelize.STRING
    },
    orgId: {
        type: Sequelize.STRING
    },
    password: {
        type: Sequelize.STRING
    }
}, {
    timestamps: false
});

var userVerification = function(login, password){
    // return the promise itself
    return User.findAll({
        where: {
            user: {$eq:login},
            password: {$eq:password}
        }
    }).then(function(user) {
        if (!user) {
            return 'not find';
        }
        if(user.length > 0){
            return true
        }else {return false}

    });
};
var getUserOrgId = function(login){
    // return the promise itself
    return User.findAll({
        where: {
            user: {$eq:login},
        }
    }).then(function(user) {
        if (!user) {
            return 'not find';
        }
        if(user.length > 0){
            return user[0]['dataValues']['orgId']
        }else {return false}

    });
};

    module.exports.userVerification = userVerification;
module.exports.getUserOrgId = getUserOrgId;