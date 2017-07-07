/**
 * Created by MAKS on 05.07.2017.
 */
var path = require('path');
var model = require( path.resolve( __dirname, "./userRoles.js" ) );
//require('userRoles.js');


model.createUserRole('admin')
