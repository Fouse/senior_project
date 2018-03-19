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
app.get("/sampleform", function(req, res) {
	res.render("sampleform");
});

app.get("/week_schedule", function(req, res) {
	res.render("week_schedule");
});

app.get("/admin", function(req, res) {
        res.render("admin");
});

// app.post("/get_drivers", function(req, res) {
//   var sql="SELECT * FROM drivers WHERE driver_id NOT IN ( SELECT driver_id FROM tmp_requests WHERE now() BETWEEN start AND end);";
//         con.query(sql, function(err, results) {
//          if (err) throw err;
//            res.send({success: results});
// //con.end();
//    });
// });
// free drivers once an assigned request is done
 app.post("/free_drivers", function(req, res) {
  var sql="UPDATE drivers SET availability='1' WHERE driver_id IN (SELECT driver_id FROM tmp_requests  WHERE now() >= end);";
        con.query(sql, function(err, results) {
					//console.log(sql);
         if (err){
					 res.send({success: false});
				 }
				 else{
					 res.send({success: true});
				 }
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
  var sql="SELECT COUNT(*) AS count FROM tmp_requests WHERE isapproved=0";
        con.query(sql, function(err, results) {
         if (err) throw err;
           res.send({success: results});
   });
});

app.post("/get_reqs", function(req, res) {
  // var sql="SELECT * FROM requests WHERE isapproved='0'";
	  var sql="SELECT * FROM tmp_requests WHERE isapproved=0";
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
// app.post("/get_vehicles", function(req, res) {
//   var sql="SELECT * FROM vehicles WHERE vehicle_id NOT IN ( SELECT vehicle_id FROM tmp_requests WHERE now() BETWEEN start AND end);";
//         con.query(sql, function(err, results) {
//          if (err) throw err;
//            res.send({success: results});
// //con.end();
//    });
// });

// free vehicles once an assigned request is done
 app.post("/free_vehicles", function(req, res) {
  var sql="UPDATE vehicles SET availability='1' WHERE vehicle_id IN (SELECT vehicle_id FROM tmp_requests  WHERE now() >= end);";
        con.query(sql, function(err, results) {
					//console.log(sql);
					if (err){
						res.send({success: false});
					}
					else{
						res.send({success: true});
					}
   });
 });

// app.post("/get_events", function(req, res) {
//   var sql="SELECT * FROM requests WHERE isapproved='1'";
//         con.query(sql, function(err, results) {
//          if (err) throw err;
//            res.send({success: results});
// //con.end();
//    });
// });

app.post("/get_events", function(req, res) {
  var sql="SELECT * FROM tmp_requests WHERE isapproved='1'";
        con.query(sql, function(err, results) {
         if (err) throw err;
           res.send({success: results});
//con.end();
   });
});
//weekly_schedule
app.post("/myweekly_schedule", function(req, res){
//console.log(req.body);
// var sql = "INSERT INTO weekly_schedule (sunday) VALUES (?);";
var sql="UPDATE weekly_schedule SET ";
var firstcondition= true;
for (var property in req.body) {
var value = req.body[property];
if (value !== "") {
	if (firstcondition) {
		firstcondition = false;
	} else {sql += ", "}
//q +=  property+ " = " + '"'+value+'"';
sql +=  property+ " = " + mysql.escape(value);
}
}
sql += " WHERE day_id = 1;";

// var sql = "UPDATE weekly_schedule SET sunday=?"
// var values = [req.body.sunday];
       con.query(sql, function(err, results) {
         if (err) throw err;
	 //console.log(results);
           res.redirect("/");
//con.end();
   });
});
app.post("/get_weekly_schedule", function(req, res) {
  var sql="SELECT * FROM weekly_schedule";
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

app.post("/lift_request", function(req, res){
//console.log(req.body);
var sql = "INSERT INTO tmp_requests (start, end, title, arrival_destination_dateTime, destination_dep_dateTime, arrival_PPU_dateTime) VALUES (?,?,?,?,?,?);";
var values = [req.body.start, req.body.end, req.body.title, req.body.arrival_destination_dateTime, req.body.destination_dep_dateTime, req.body.arrival_PPU_dateTime];
       con.query(sql, values, function(err, results) {
         if (err) throw err;
         //console.log(results);
           res.redirect("/");
//con.end();
   });
});
// function test(){
// 	var today=new Date().toISOString()
// 	console.log(today.replace(/\..+/, ''));
// }
// test();
app.post("/assign_request", function(req, res){
	var sql = "UPDATE tmp_requests SET driver_id ="+ req.body.driver+", vehicle_id="+req.body.vehicle+", isapproved=1 WHERE reqs_id="+req.body.reqs_id;
	console.log(sql);
	con.query(sql,function(err, results) {
		if (err) throw err;
		//console.log(results);
			res.redirect("admin");
				// console.log("reqid "+req.body.request_id);
		});
});
// app.post("/assign_driver", function(req, res){
// 	var sql = "UPDATE drivers SET availability = 0 WHERE driver_id = "+ req.body.driver;
// 	console.log(sql);
// 	con.query(sql,function(err, results) {
// 		if (err) throw err;
// 		//console.log(results);
// 			// res.redirect("admin");
// 				// console.log("reqid "+req.body.request_id);
// 		});
// });
// app.post("/assign_vehicle", function(req, res){
// 	var sql = "UPDATE vehicles SET availability = 0 WHERE vehicle_id = "+ req.body.vehicle;
// 	console.log(sql);
// 	con.query(sql,function(err, results) {
// 		if (err) throw err;
// 		//console.log(results);
// 			// res.redirect("admin");
// 				// console.log("reqid "+req.body.request_id);
// 		});
// });

app.get("/user", function(req, res) {
        res.render("user");
});

app.listen(app.get('port'), function() {
        console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.' );
});
