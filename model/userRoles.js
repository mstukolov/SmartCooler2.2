/**
 * Created by MAKS on 05.07.2017.
 */
var Sequelize = require('sequelize')
require('mysql2')

// Or you can simply use a connection uri
const sequelize = new Sequelize('mysql://admin:OOYHORSHUNYPKLAF@sl-us-dal-9-portal.3.dblayer.com:19904/compose');

sequelize.authenticate().then(() => {
    console.log('Connection has been established successfully.');
}).catch(err => {
    console.error('Unable to connect to the database:', err);
})

const UserRole = sequelize.define('userroles', {
    roleid: {
        type: Sequelize.STRING,
        primaryKey: true
    },
    role: {
        type: Sequelize.STRING
    },
}, {
    timestamps: false
});


var createUserRole = function (roleName) {
    var role = UserRole.build({
        name:roleName
    });

    //Inserting Data into database
    role.save().then(()=>{})
}
var console_test = function (msg) {
    console.log('test is ok:' + msg)
}
module.exports.createUserRole = createUserRole;
module.exports.console_test = console_test;