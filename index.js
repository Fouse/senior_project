var express = require('express');
var formidable = require('formidable');
var app = express();
var fs = require("fs");
var mysql = require("mysql");
var credentials = require("./credentials");
var handlebars = require('express-handlebars').create({defaultLayout:"main"});

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

//link to driverform
app.get("/driverform", function(req, res) {
        res.render("driverform");
});

//link to vanform
app.get("/vanform", function(req, res) {
        res.render("vanform");
});

//link to busform
app.get("/busform", function(req, res) {
        res.render("busform");
});

//post van form data to database
app.post("/submit_request", function(req, res){
	var sql = "INSERT INTO requests (trip_start, trip_end, num_passengers, destination, departure_location, arrival_location, estimate_arrival, return_time, driver, loop_service, request_department, budget_num, auth_name, request_email, comment) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);"
	var values = [req.body.trip_start,req.body.trip_end,req.body.num_passengers,
		            req.body.destination,req.body.departure_location,req.body.arrival_location,
								req.body.estimate_arrival,req.body.return_time,req.body.driver,
								req.body.loop_service,req.body.request_department,req.body.budget_num,
								req.body.auth_name,req.body.request_email,req.body.comment];
								con.query(sql, values, function(err, results) {
									if (err) throw err;
									res.redirect("/");
								});
							});

//post driver form data to database
app.post("/submit_request2", function(req, res){
//console.log(req.body);
var sql = "INSERT INTO requests (trip_start, trip_end, num_passengers, destination, departure_location, arrival_location, estimate_arrival, return_time, loop_service, directions, trip_purpose, auth_name, budget_num, request_email, comment) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);"
var values = [req.body.trip_start,req.body.trip_end,req.body.num_passengers,
	            req.body.destination,req.body.departure_location,req.body.arrival_location,
							req.body.estimate_arrival,req.body.return_time,req.body.loop_service,
							req.body.directions,req.body.trip_purpose,req.body.auth_name,
							req.body.budget_num,req.body.request_email,req.body.comment];
       con.query(sql, values, function(err, results) {
         if (err) throw err;
	 //console.log(results);
           res.redirect("/");
					 //con.end();
					    });
					 });

//post bus form data to database
app.post("/submit_request3", function(req, res){
//console.log(req.body);
var sql = "INSERT INTO requests (destination, trip_start, trip_end, num_passengers, departure_location, arrival_location, estimate_arrival, return_time, hotel_name, hotel_address, hotel_num, hotel_directions, return_location, event_person, event_person_num, request_department, request_email, auth_name, budget_num, comment, bus_company, ref_num, bus_driver, bus_num, bus_driver_phone, bus_phone, emergency_contact) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);"
var values = [req.body.destination,req.body.trip_start,req.body.trip_end,
							req.body.num_passengers,req.body.departure_location, req.body.arrival_location,
							req.body.estimate_arrival,req.body.return_time,req.body.hotel_name,
							req.body.hotel_address,req.body.hotel_num,req.body.hotel_directions,
							req.body.return_location,req.body.event_person,req.body.event_person_num,
							req.body.request_department,req.body.request_email,req.body.auth_name,
						  req.body.budget_num,req.body.comment,req.body.bus_company,
							req.body.ref_num,req.body.bus_driver,req.body.bus_num,
							req.body.bus_driver_phone,req.body.bus_phone,req.body.emergency_contact];
      con.query(sql, values, function(err, results) {
        if (err) throw err;
	 //console.log(results);
          res.redirect("/");
					 //con.end();
					    });
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
  var sql="SELECT COUNT(*) AS count FROM requests WHERE isapproved=0";
        con.query(sql, function(err, results) {
         if (err) throw err;
           res.send({success: results});
   });
});

app.post("/get_reqs", function(req, res) {
  var sql="SELECT * FROM requests WHERE isapproved='0'";
        con.query(sql, function(err, results) {
         if (err) throw err;
           res.send({success: results});
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

app.post("/get_events", function(req, res) {
  var sql="SELECT * FROM requests WHERE isapproved='1'";
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

app.post("/assign_request", function(req, res){
	var sql= "update requests join drivers on request_id = driver_id join vehicles on request_id = vehicle_id set  requests.isapproved = '1', drivers.availability='0', vehicles.availability='0' where requests.request_id=1";
	con.query(sql,function(err, results) {
		if (err) throw err;
		//console.log(results);
			res.redirect("admin");
		});
});

app.get("/user", function(req, res) {
        res.render("user");
});

app.listen(app.get('port'), function() {
        console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.' );
});
