var express = require('express');
var formidable = require('formidable');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
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

var smtpTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
		user: "fousseini.test@gmail.com",
		pass: "pointlift"
  }
});


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
 app.post("/free_drivers", (req, res) => {
  var sql="UPDATE drivers SET availability='1' WHERE driver_id IN (SELECT driver_id FROM tmp_requests  WHERE now() >= end);";
        con.query(sql, (err, results) => {
					//console.log(sql);
         if (err){
					 res.send({success: false});
				 }
				 else{
					 res.send({success: true});
				 }
   });
 });


app.post("/get_drivers", (req, res) => {
  var sql="SELECT * FROM drivers WHERE availability=1";
        con.query(sql, (err, results) => {
         if (err){res.send({success: false});} else {res.send({success: results});}
//con.end();
   });
});

app.post("/get_req_count", (req, res)=> {
  var sql="SELECT COUNT(*) AS count FROM tmp_requests WHERE isapproved=0";
        con.query(sql,(err, results)=> {
         if (err){res.send({success: false});} else {res.send({success: results});}
   });
});

app.post("/get_reqs", (req, res) => {
  // var sql="SELECT * FROM requests WHERE isapproved='0'";
	  var sql="SELECT * FROM tmp_requests WHERE isapproved=0";
        con.query(sql,(err, results) => {
         if (err){res.send({success: false});} else {res.send({success: results});}
   });
});

// app.post("/get_vehicles", function(req, res) {
//   var sql="SELECT * FROM vehicles WHERE availability=1";
//         con.query(sql, function(err, results) {
//          if (err) throw err;
//            res.send({success: results});
// //con.end();
//    });
// });
app.post("/get_vehicles", (req, res) => {
  //var sql="SELECT * FROM vehicles WHERE vehicle_id NOT IN ( SELECT vehicle_id FROM tmp_requests WHERE now() BETWEEN start AND end);";
		var sql="SELECT * FROM vehicles WHERE vehicle_id NOT IN ( SELECT vehicle_id FROM tmp_requests WHERE (? <= end) AND (? >= start));";
        con.query(sql, ['2018-03-16 17:00:00', '2018-03-16 19:00:00'],(err, results)=> {
          if (err){res.send({success: false});} else {res.send({success: results});}
					 //console.log(JSON.stringify(results));
//con.end();
   });
});
//get requests status
app.post("/get_reqs_status", (req, res) => {
		var sql="SELECT tmp_requests.reqs_id, tmp_requests.driver_id, tmp_requests.vehicle_id,tmp_requests.title,tmp_requests.destination, tmp_requests.isapproved, tmp_requests.is_completed, tmp_requests.ongoing, drivers.driver_fname, drivers.driver_lname, vehicles.vehicle_number FROM tmp_requests LEFT OUTER JOIN drivers ON tmp_requests.driver_id = drivers.driver_id LEFT OUTER JOIN vehicles ON tmp_requests.vehicle_id = vehicles.vehicle_id WHERE isapproved=1";
        con.query(sql, (err, results) => {
          if (err){res.send({success: false});} else {res.send({success: results});}
					 //console.log(JSON.stringify(results));
//con.end();
   });
});

//get requests ongoing
app.post("/get_reqs_ongoing", (req, res) => {
		var sql="SELECT tmp_requests.reqs_id, tmp_requests.driver_id, tmp_requests.vehicle_id,tmp_requests.title,tmp_requests.destination, tmp_requests.isapproved, tmp_requests.is_completed, tmp_requests.ongoing, drivers.driver_fname, drivers.driver_lname, vehicles.vehicle_number FROM tmp_requests LEFT OUTER JOIN drivers ON tmp_requests.driver_id = drivers.driver_id LEFT OUTER JOIN vehicles ON tmp_requests.vehicle_id = vehicles.vehicle_id WHERE isapproved=1 AND now() BETWEEN start AND end";
        con.query(sql, (err, results) => {
          if (err){res.send({success: false});} else {res.send({success: results});}

					 //console.log(JSON.stringify(results));
//con.end();
   });
});
//get req Completed
app.post("/get_reqs_completed", (req, res) => {
		var sql="SELECT tmp_requests.reqs_id, tmp_requests.driver_id, tmp_requests.vehicle_id,tmp_requests.title,tmp_requests.destination, tmp_requests.isapproved, tmp_requests.is_completed, tmp_requests.ongoing, drivers.driver_fname, drivers.driver_lname, vehicles.vehicle_number FROM tmp_requests LEFT OUTER JOIN drivers ON tmp_requests.driver_id = drivers.driver_id LEFT OUTER JOIN vehicles ON tmp_requests.vehicle_id = vehicles.vehicle_id WHERE isapproved=1 AND now() >= end";
        con.query(sql, (err, results) => {
         if (err){res.send({success: false});} else {res.send({success: results});}
					 //console.log(JSON.stringify(results));
   });
});
//get availlable drivers when selecting driver after an approved request
app.post("/get_availlable_drivers", (req, res) => {
  //console.log(req.body.event_start);
  //var sql="SELECT * FROM vehicles WHERE vehicle_id NOT IN ( SELECT vehicle_id FROM tmp_requests WHERE now() BETWEEN start AND end);";
		var sql="SELECT * FROM drivers WHERE driver_id NOT IN (SELECT driver_id FROM tmp_requests WHERE (? <= end) AND (? >= start));";
    var values = [req.body.event_start, req.body.event_end];
        con.query(sql, values, (err, results) => {
          //console.log(req.body.event_start, req.body.event_end)
         if (err){res.send({success: false});} else {res.send({success: results});}
					// console.log(JSON.stringify(results));
//con.end();
   });
});
//get availlable shuttle when selecting shuttles after an approved request
app.post("/get_availlable_shuttles", (req, res) => {
  //console.log(req.body.event_start);
  //var sql="SELECT * FROM vehicles WHERE vehicle_id NOT IN ( SELECT vehicle_id FROM tmp_requests WHERE now() BETWEEN start AND end);";
		var sql="SELECT * FROM vehicles WHERE vehicle_id NOT IN (SELECT vehicle_id FROM tmp_requests WHERE (? <= end) AND (? >= start));";
    var values = [req.body.event_start, req.body.event_end];
        con.query(sql, values, (err, results) => {
          console.log(req.body.event_start, req.body.event_end)
         if (err){res.send({success: false});} else {res.send({success: results});}
					// console.log(JSON.stringify(results));
//con.end();
   });
});

// free vehicles once an assigned request is done
 app.post("/free_vehicles", (req, res) => {
  var sql="UPDATE vehicles SET availability='1' WHERE vehicle_id IN (SELECT vehicle_id FROM tmp_requests  WHERE now() >= end);";
        con.query(sql, (err, results) => {
					//console.log(sql);
					if (err){res.send({success: false});}else{res.send({success: true});}
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

app.post("/get_events", (req, res) => {
  var sql="SELECT * FROM tmp_requests WHERE isapproved='1'";
        con.query(sql, (err, results) => {
         if (err) throw err;
           res.send({success: results});
//con.end();
   });
});
//weekly_schedule
app.post("/myweekly_schedule", (req, res) =>{
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
       con.query(sql, (err, results)=> {
         if (err) throw err;
	 //console.log(results);
           res.redirect("/");
//con.end();
   });
});
app.post("/get_weekly_schedule", (req, res)=> {
  var sql="SELECT * FROM weekly_schedule";
        con.query(sql, (err, results)=> {
          if (err){res.send({success: false});} else {res.send({success: results});}
//con.end();
   });
});


app.post("/add_driver", (req, res)=>{
//console.log(req.body);
var sql = "INSERT INTO drivers (driver_fname, driver_lname) VALUES (?,?);";
var values = [req.body.driver_fname,req.body.driver_lname];
       con.query(sql, values, function(err, results) {
         if (err){res.send({success: false});} else {res.redirect("admin");}
//con.end();
   });
});

app.post("/add_vehicle", (req, res)=>{
//console.log(req.body);
var sql = "INSERT INTO vehicles (vehicle_number, seat_number) VALUES (?,?);";
var values = [req.body.vehicle_number,req.body.seat_number];
       con.query(sql, values, (err, results)=> {
         if (err){res.send({success: false});} else {res.redirect("admin");}
//con.end();
   });
});

app.post("/lift_request", (req, res)=>{
//console.log(req.body);
var sql = "INSERT INTO tmp_requests (start, end, title, arrival_destination_dateTime, destination_dep_dateTime, arrival_PPU_dateTime, email, department, destination, num_passengers, loop_service, auth_name, hotel_name, hotel_address, direction, budget_num) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);";
var values = [req.body.start,req.body.end,req.body.title,req.body.arrival_destination_dateTime,req.body.destination_dep_dateTime,req.body.arrival_PPU_dateTime,req.body.email,req.body.department,req.body.destination,req.body.num_passengers,req.body.loop_service,req.body.auth_name,req.body.hotel_name,req.body.hotel_address,req.body.hotel_direction,req.body.budget_num];
       con.query(sql, values, (err, results) => {
         if (err) throw err;
         //console.log(results);
				 var to = req.body.email;
         var auth_name = req.body.auth_name

				 let mailOptions = {
					 from: 'fousseini',
					 to: to,
					 subject: 'Pointlift Request',
					 text: 'Thank you, '+auth_name,
					 html: '<div><table cellpadding="0" cellspacing="0" width="100%"><tr><td><table align="center" cellpadding="0" cellspacing="0" width="600"><tr><td align="center" style="padding: 40px 0 30px 0;"><img src="http://www.pointpark.edu/About/AdminDepts/PhysicalPlantFacilities/media/About/AdminDeptPhysPlant/Transportation/transportationbanner.jpg" alt="Pointlift" width="600" height="250px" style="display: block;" /></td></tr><tr><td bgcolor="#ffffff" style="padding: 40px 30px 40px 30px;"><table cellpadding="0" cellspacing="0" width="100%"><tr><td>Thank you '+auth_name+',</td></tr><tr><td style="padding: 20px 0 30px 0;">Our team will procede with your request shortly. </td></tr><tr></tr></table></td></tr><tr><td bgcolor="green" style="padding: 30px 30px 30px 30px;"><table cellpadding="0" cellspacing="0" width="100%"><tr><td><a href="http://fkonat.it.pointpark.edu:3000/">&reg; Pointlift<br/></a></td></tr></table></td></tr></table></td></tr></table></div>'
					};

						 smtpTransport.sendMail(mailOptions, (error, response)=>{
							 if(error){
									 console.log(error);
								}else{
									 console.log("Message sent");
							 }
							smtpTransport.close();
						});

           res.redirect("/");
//con.end();
   });
});
// function test(){
// 	var today=new Date().toISOString()
// 	console.log(today.replace(/\..+/, ''));
// }
// test();
app.post("/assign_request", (req, res) =>{
	var sql = "UPDATE tmp_requests SET driver_id ="+ req.body.driver+", vehicle_id="+req.body.vehicle+", isapproved=1 WHERE reqs_id="+req.body.reqs_id;
	console.log(sql);
	con.query(sql, (err, results)=> {
		if (err){res.send({success: false});} else {res.redirect("admin");}
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

app.get("/user", (req, res) => {
        res.render("user");
});

app.listen(app.get('port'), function() {
        console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.' );
});
