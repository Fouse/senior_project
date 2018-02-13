var express = require('express');
var formidable = require('formidable');
var app = express();
var fs = require("fs");
var mysql = require("mysql");
var credentials = require("./credentials");
var handlebars = require('express-handlebars').create({defaultLayout:"main"});
var mysql = require('mysql');

app.use(express.static(__dirname +'/public'));
app.use(require('body-parser').urlencoded({extended:false}));

app.engine("handlebars",handlebars.engine);
app.set("view engine","handlebars");
app.set('port', process.env.PORT || 3000);

var con = mysql.createConnection(credentials.connection);

app.get("/", function(req, res) {
  res.render("home");
});

app.get("/admin", function(req, res) {
  res.render("admin");
});

app.post("/get_drivers", function(req, res) {
  var sql="SELECT * FROM drivers WHERE availability=1";
        con.query(sql, function(err, results) {
         if (err) throw err;
           res.send({success: results});
//con.end();
   });
});

app.post("/get_req_count", function(req, res) {
  var sql="SELECT COUNT(*) AS count FROM requests";
        con.query(sql, function(err, results) {
         if (err) throw err;
           res.send({success: results});
//con.end();
   });
});

app.post("/get_vehicles", function(req, res) {
  var sql="SELECT * FROM vehicles WHERE availability=1";
        con.query(sql, function(err, results) {
         if (err) throw err;
           res.send({success: results});
//con.end();
   });
});

app.post("/add_driver", function(req, res){
//console.log(req.body);
var sql = "INSERT INTO drivers (driver_fname, driver_lname) VALUES (?,?);";
var values = [req.body.driver_fname,req.body.driver_lname];
       con.query(sql, values, function(err, results) {
         if (err) throw err;
	 //console.log(results);
           res.redirect("admin");
//con.end();
   });
});

app.post("/add_vehicle", function(req, res){
//console.log(req.body);
var sql = "INSERT INTO vehicles (vehicle_number, seat_number) VALUES (?,?);";
var values = [req.body.vehicle_number,req.body.seat_number];
       con.query(sql, values, function(err, results) {
         if (err) throw err;
         //console.log(results);
           res.redirect("admin");
//con.end();
   });
});

app.get("/user", function(req, res) {
  res.render("user", {
  menu: getMenu(req)
  });
});

//custom 404 page
app.use(function(req, res){
  res.status(404);
  res.render("404");
});

//custom 500 page
app.use(function(err, req, res, next){
  console.log(err.stack);
  res.status(500);
  res.render("500");
});

app.listen(app.get('port'), function() {
  console.log("Express started on http://localhost:" + app.get("port") + "; press Ctrl-C to terminate.");
});
