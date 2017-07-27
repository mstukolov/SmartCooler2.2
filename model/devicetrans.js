/**
 * Created by MAKS on 25.07.2017.
 */
'use strict';
module.exports = function(sequelize, DataTypes) {
    var Devicetrans = sequelize.define('Devicetrans', {
        id:{type:DataTypes.BIGINT, primaryKey: true},
        devid: DataTypes.STRING,
        nparam1: DataTypes.DECIMAL,
        nparam2: DataTypes.DECIMAL,
        nparam3: DataTypes.DECIMAL,
        nparam4: DataTypes.DECIMAL,
        nparam5: DataTypes.DECIMAL,
        tparam1: DataTypes.STRING,
        tparam2: DataTypes.STRING
    }, {
        classMethods: {
            associate: function(models) {
                // associations can be defined here
            }
        }
    });
    return Devicetrans;
};