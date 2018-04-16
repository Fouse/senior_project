var express = require('express');
var formidable = require('formidable');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var app = express();
var fs = require("fs");
var mysql = require("mysql");
var credentials = require("./credentials");
var handlebars = require('express-handlebars').create({defaultLayout:"main"});
var expressValidator = require('express-validator');
var bcrypt = require('bcryptjs');
const saltRounds = 10;
var passport = require("passport");



app.use(express.static(__dirname +'/public'));
app.use(require('body-parser').urlencoded({extended:false}));
app.use(expressValidator());
app.use(require('express-session')({
 secret:'fous',
 resave:false,
 saveUninitialized:false
 //cookie:{secure:true}
}));
app.use(passport.initialize());
app.use(passport.session());

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
  if(req.session.role){res.render("admin");}
  else {res.render("user");}
});
app.get("/register_page", function(req, res) {
	res.render("register_page");
});
app.get("/login", function(req, res) {
	res.render("login");
});
app.get("/my_graph", function(req, res) {
	res.render("my_graph");
});
app.get("/welcome_new_user", function(req, res) {
  if(req.session.role){res.render("welcome_new_user");}
  else{res.render("home");}
});
app.get("/view_schedule", function(req, res) {
	res.render("view_schedule");
});

app.get("/bus_rental_form", function(req, res) {
	res.render("bus_rental_form");
});
app.get("/bus_rental_request", function(req, res) {
  var link = req.query.link;
  var details
  var sql = "SELECT * FROM requests WHERE request_id = "+link;
  console.log(sql);
  con.query(sql, (err, results)=>{
    if(err) throw err;
    res.render("bus_rental_request",{
      id:results[0].request_id,
      start: results[0].start,
      end: results[0].end,
      destination: results[0].destination,
      num_passengers: results[0].num_passengers,
      departure_location: results[0].departure_location,
      arrival_location: results[0].arrival_location,
      estimate_arrival:results[0].estimate_arrival,
      return_time:results[0].return_time,
      hotel_name:results[0].hotel_name,
      hotel_address:results[0].hotel_address,
      hotel_num:results[0].hotel_num,
      hotel_directions:results[0].hotel_directions,
      return_location:results[0].return_location,
      event_person:results[0].event_person,
      comment:results[0].comment
    });
  });
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
 // app.post("/free_drivers", (req, res) => {
 //  var sql="UPDATE drivers SET availability='1' WHERE driver_id IN (SELECT driver_id FROM tmp_requests  WHERE now() >= end);";
 //        con.query(sql, (err, results) => {
	// 				//console.log(sql);
 //         if (err){res.send({success: false});}
	// 			 else{res.send({success: true});}
 //   });
 // });

 app.post("/create_user", (req, res)=>{
   req.checkBody('first_name', 'first name cannot be empty.').notEmpty();
   req.checkBody('last_name', 'last name cannot be empty.').notEmpty();
   req.checkBody('email', 'The email you have entered is invalid, please try again.').isEmail();
   req.checkBody('password', 'password must be between 4-100 characters long, please try again.').len(4, 100);
   req.checkBody('password', 'password cannot be empty.').notEmpty();
   var errors = req.validationErrors();
   if(errors){
     // console.log(`errors: ${JSON.stringify(errors)}`);
     res.render('register_page', {errors: errors});
   }else {
     var first_name = req.body.first_name;
     var last_name = req.body.last_name;
     var email = req.body.email;
     var password = req.body.password;
     var dob = req.body.dob;
     var position = req.body.position;
     bcrypt.genSalt(10, function(err, salt) {
     bcrypt.hash(password, salt, function(err, hash) {
       //console.log(salt);
       var sql = "INSERT INTO users (first_name, last_name, email, position, password, salt, dob) VALUES(?,?,?,?,?,?,?);"
       var values = [first_name, last_name, email, position, hash, salt, dob];
       //console.log(hash);
       con.query(sql, values, (err, results)=>{
         if (err){
           res.send({success: false})
           console.log("create user err"+err);
         } else {
           if(results.insertId) {
             // console.log(results.insertId);
             // Redirects new user to their own page
             console.log("New record created successfully. Last inserted ID is: " + results.insertId );
             req.session.user_id = results.insertId;
             req.session.user_first_name = req.body.first_name;
             req.session.cookie.maxAge = 90000000;
             // console.log(req.session.user_first_name);
             res.redirect(303, 'user');
             if(position === "driver" || position === "maintenance"){
               var sql2 = "INSERT INTO drivers (driver_fname, driver_lname, driver_id, position) VALUES(?, ?, ?, ?);"
               var values = [first_name, last_name, results.insertId, position];
               con.query(sql2, values, function(err, results){
                 if (err){throw err;}
                 else {console.log("id inserted into drivers");}
               });
             }
           }
         }
       });
       });
     });
   }
 });


 app.post('/login', function(req, res){
   req.check('email','the email you entered is invalid, please try again.').isEmail();
   var errors = req.validationErrors();
   if(errors){
      req.session.errors = errors;
      res.redirect(303,"login");
    } else{
      var email=req.body.email;
      var password=req.body.password;
      var sql = "SELECT * FROM users WHERE email =?";
      // console.log(sql);
      con.query(sql,email, function(err, results){
       if(err){
         res.send({success: false});
         console.log("loggin err"+err);
       };
       // console.log("results");
       // console.log(results);
       // console.log("---");
       if(!results[0]){
           var errors = "something went wrong, please try again";
           res.render('login', {errors: errors});
       }

       if(results[0]){
         var salt = results[0].salt;
         // console.log(salt);
         // console.log("password");
         // console.log(results[0].password);
         bcrypt.compare(password, results[0].password, function(err, response){
           if(response === true){
             console.log("it worked!");
             req.session.user_id = results[0].user_id;
             req.session.role = results[0].role;
             // req.session.is_new_user = results[0].is_new_user;
             req.session.cookie.maxAge = 9000000;
             res.redirect(303,"user");
           }
         });
        }
       });
    }
 });

 // app.get("/user", (req, res) => {
 //   console.log(req.user);
 //   console.log(req.isAuthenticated());
 //   //if(req.session.user_id){
 //     var sql = "SELECT first_name, last_name FROM users WHERE user_id=?";
 //     con.query(sql, [req.session.user_id], function(err, results){
 //       if(err){
 //         throw err;
 //       }
 //       if(results[0]){
 //         console.log(JSON.stringify(results));
 //         var user_info = {fname:results[0].first_name, lname:results[0].last_name}
 //         res.render("user", user_info);
 //       }
 //     });
 //   //}
 // });
app.get("/user", (req, res)=>{
  if(req.session.user_id){
    var sql = "SELECT first_name, last_name, role, dob, email FROM users WHERE user_id=?;";
      con.query(sql, [req.session.user_id],function (err, result, fields) {
      if(err){
        res.send({success: false});
         console.log("user err"+err);
       }
        if(result[0]){
          req.session.user = result[0].users_id;
          var info={
            first_name: result[0].first_name,
            login:req.session.user_id?req.session.user_id:false
          };
          //console.log(result[0].is_admin);
          if(result[0].role === 'admin'){
            res.render("admin",info);
          }
          else if(result[0].role === 'new'){
            res.render("welcome_new_user",info);
          }
          else if(result[0].role === 'driver'){
            res.render("user",info);
          }
          else if(result[0].role === 'viewer'){
            res.render("view_schedule" ,info);
          }
          // else  {
          //   res.render("user",info);
          // }

          // else{res.render("user",info);}
        }
    });

}else {
  res.redirect("login");
}
});

app.get("/logout", function(req, res){
  delete req.session.user_id;
  delete req.session.is_admin;
  res.render("home");
});
//get bus company_contact info
app.post("/get_bus_company_contact", (req, res)=>{
  if(req.session.user_id){
    console.log(req.session.user_id);
    var sql = "SELECT * FROM bus_company_contact WHERE id=1;";
    con.query(sql ,(err, results)=>{
      if(err) res.send({success: false});
      res.send({success:results});
    });
  }
});
app.post("/bus_request", function(req, res){
//console.log(req.body);
var sql = "INSERT INTO requests (destination, start, end, num_passengers, departure_location, arrival_location, estimate_arrival, return_time, hotel_name, hotel_address, hotel_num, hotel_directions, return_location, event_person, event_person_num, request_department, request_email, auth_name, budget_num, comment) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);"
var values = [req.body.destination,req.body.start,req.body.end,
              req.body.num_passengers,req.body.departure_location, req.body.arrival_location,
              req.body.estimate_arrival,req.body.return_time,req.body.hotel_name,
              req.body.hotel_address,req.body.hotel_num,req.body.hotel_directions,
              req.body.return_location,req.body.event_person,req.body.event_person_num,
              req.body.request_department,req.body.request_email,req.body.auth_name,
              req.body.budget_num,req.body.comment
            ];

  con.query(sql, values, function(err, results) {
    if (err){
      throw err;
    } else{
      if(results.insertId){
        var to = req.body.request_email;
        var auth_name = req.body.auth_name;
        var id =results.insertId;
        console.log("last request id inserted: "+results.insertId);
        function send_mail(email_option){
          smtpTransport.sendMail(email_option, (error, response)=>{
            if(error){
                console.log("msg err"+error);
             }else{
                console.log("Message sent");
            }
           smtpTransport.close();
         });
        }
        let bus_company_email = {
          from: 'fousseini.test@gmail.com',
          to: "konatef06@gmail.com",
          subject: 'Pointlift',
          text: "blala",
          html: "<p>You have a new bus request from Point Park University.<a href='https://fkonat.it.pointpark.edu/pointlift/bus_rental_request?link="+id+"'>Please click here for more detail</a></p>"
         };
         send_mail(bus_company_email);
         let requester_email = {
           from: 'fousseini.test@gmail.com',
           to: to,
           subject: 'Pointlift',
           text: "balal",
           // html: "<p>your request has been sent with success</p>"
           html: '<div><table cellpadding="0" cellspacing="0" width="100%"><tr><td><table align="center" cellpadding="0" cellspacing="0" width="600"><tr><td align="center" style="padding: 40px 0 30px 0;"><img src="http://www.pointpark.edu/About/AdminDepts/PhysicalPlantFacilities/media/About/AdminDeptPhysPlant/Transportation/transportationbanner.jpg" alt="Pointlift" width="600" height="250px" style="display: block;" /></td></tr><tr><td bgcolor="#ffffff" style="padding: 40px 30px 40px 30px;"><table cellpadding="0" cellspacing="0" width="100%"><tr><td>Thank you '+auth_name+',</td></tr><tr><td style="padding: 20px 0 30px 0;">Your request has been sent with success!</td></tr><tr></tr></table></td></tr><tr><td bgcolor="green" style="padding: 30px 30px 30px 30px;"><table cellpadding="0" cellspacing="0" width="100%"><tr><td><a href="http://fkonat.it.pointpark.edu:3000/">&reg; Pointlift<br/></a></td></tr></table></td></tr></table></td></tr></table></div>'
          };
          send_mail(requester_email);
        //  smtpTransport.sendMail(bus_company_email,requester_email, (error, response)=>{
        //    if(error){
        //        console.log("msg err"+error);
        //     }else{
        //        console.log("Message sent");
        //    }
        //   smtpTransport.close();
        // });
      }
    }
        res.redirect("home");
  });
});


app.post("/request_approve_by_bcompany", (req, res)=>{
    var sql = "UPDATE requests SET bus_company = ?, ref_num = ?, bus_driver=?, bus_num=?, bus_driver_phone=?, bus_phone=?, emergency_contact=? WHERE request_id=?;";
    var values =[req.body.bus_company, req.body.ref_num, req.body.bus_driver, req.body.bus_num, req.body.bus_driver_phone, req.body.bus_phone, req.body.emergency_contact,];
    con.query(sql, values ,(err, results)=>{
      if(err) res.send({success: false});
      res.send({success:results});
    });
});


 app.post("/get_users", (req, res)=>{
     console.log(req.session.user_id);
     var sql = "SELECT drivers.*, users.* FROM users LEFT OUTER JOIN drivers ON drivers.driver_id = users.user_id WHERE user_id=?";
     con.query(sql, [req.session.user_id] ,(err, results)=>{
       if(err) res.send({success: false});
       res.send({success:results});
     });
 });
 //get new users
 app.post("/get_new_users", (req, res)=>{
   if(req.session.user_id){
     console.log(req.session.user_id);
     var sql = "SELECT drivers.*, users.* FROM users LEFT OUTER JOIN drivers ON drivers.driver_id = users.user_id WHERE role='new'";
     con.query(sql,(err, results)=>{
       if(err) res.send({success: false});
       res.send({success:results});
     });
   }
 });

 //approve new users
 app.post("/approve_new_user", (req, res)=>{
   // if(req.session.user_id){
   console.log(req.session.user_id);
   console.log("user: "+ req.body.user_id);
     console.log("position: "+ req.body.position);
     var sql = "UPDATE users set role='"+req.body.position+"' where user_id="+req.body.user_id;
     console.log(sql);
     con.query(sql, (err, results)=>{
       if(err) res.send({success: false});
       res.send({success: true});
     });
   //}
 });


app.post("/get_drivers", (req, res) => {
  var sql="SELECT users.*, drivers.* FROM users LEFT OUTER JOIN drivers ON drivers.driver_id = users.user_id WHERE (users.role='driver' OR users.role='maintenance') AND drivers.availability=1;";
        con.query(sql, (err, results) => {
         if (err){res.send({success: false});} else {res.send({success: results});}
//con.end();
   });
});
//remove driver
app.post("/remove_driver", (req, res) => {
  console.log(req.body.driver_id);
   var sql="UPDATE drivers SET availability = 2 WHERE driver_id = ?";
        con.query(sql,req.body.driver_id, (err, results) => {
          if (err){res.send({success: false});} else {res.send({success:true});}
   });
});
//add driver back to availlable driver
app.post("/add_driver_back_to_available_drivers", (req, res) => {
  console.log(req.body.driver_id);
    var sql="UPDATE drivers SET availability = 1 WHERE driver_id = ?";
        con.query(sql,req.body.driver_id, (err, results) => {
          if (err){res.send({success: false});} else {res.send({success:true});}
   });
});


//get all the desabled shuttles
app.post("/get_unavailable_drivers", (req, res) => {
   var sql="SELECT users.*, drivers.* FROM users LEFT OUTER JOIN drivers ON drivers.driver_id = users.user_id WHERE users.is_admin=0 AND drivers.availability = 2";
        con.query(sql,(err, results) => {
          if (err){res.send({success: false});} else {res.send({success: results});}
   });
});

app.post("/get_req_count", (req, res)=> {
  var sql="SELECT COUNT(*) AS count FROM requests WHERE isapproved=0";
        con.query(sql,(err, results)=> {
         if (err){res.send({success: false});} else {res.send({success: results});}
   });
});
app.post("/get_new_user_count", (req, res)=> {
  var sql="SELECT COUNT(*) AS count FROM users WHERE role='new'";
        con.query(sql,(err, results)=> {
         if (err){res.send({success: false});} else {res.send({success: results});}
   });
});
//change reuest isapprove to 1 when approved
app.post("/update_req_status", (req, res) => {
	  var sql="UPDATE requests SET isapproved = 1 WHERE request_id=?";
        con.query(sql, req.body.request_id, (err, results) => {
         if (err){res.send({success: false});} else {res.send({success: results});}
   });
});

app.post("/get_reqs", (req, res) => {
  // var sql="SELECT * FROM requests WHERE isapproved='0'";
	  var sql="SELECT * FROM requests WHERE isapproved=0";
        con.query(sql,(err, results) => {
         if (err){res.send({success: false});} else {res.send({success: results});}
   });
});

app.post("/get_vehicles", (req, res) => {
		var sql="SELECT * FROM vehicles WHERE availability=1";
        con.query(sql,(err, results)=> {
          if (err){res.send({success: false});} else {res.send({success: results});}
   });
});
//get requests status
app.post("/get_reqs_status", (req, res) => {
		var sql="SELECT requests.*, vehicles_has_requests.*, drivers_has_requests.*, drivers.*, vehicles.* FROM requests  LEFT OUTER JOIN drivers_has_requests ON drivers_has_requests.requests_request_id = requests.request_id LEFT OUTER JOIN drivers ON drivers_has_requests.drivers_driver_id = drivers.driver_id LEFT OUTER JOIN vehicles_has_requests ON vehicles_has_requests.requests_request_id = requests.request_id LEFT OUTER JOIN vehicles ON vehicles_has_requests.vehicles_vehicle_id = vehicles.vehicle_id WHERE isapproved=1";
        con.query(sql, (err, results) => {
          if (err){res.send({success: false});} else {res.send({success: results});}
					 //console.log(JSON.stringify(results));
//con.end();
   });
});

//get requests ongoing
app.post("/get_reqs_ongoing", (req, res) => {
		var sql="SELECT requests.*, vehicles_has_requests.*, drivers_has_requests.*, drivers.*, vehicles.* FROM requests  LEFT OUTER JOIN drivers_has_requests ON drivers_has_requests.requests_request_id = requests.request_id LEFT OUTER JOIN drivers ON drivers_has_requests.drivers_driver_id = drivers.driver_id LEFT OUTER JOIN vehicles_has_requests ON vehicles_has_requests.requests_request_id = requests.request_id LEFT OUTER JOIN vehicles ON vehicles_has_requests.vehicles_vehicle_id = vehicles.vehicle_id WHERE isapproved=1 AND now() BETWEEN start AND end";
        con.query(sql, (err, results) => {
          if (err){res.send({success: false});} else {res.send({success: results});}
   });
});
//get req Completed
app.post("/get_reqs_completed", (req, res) => {
		var sql="SELECT requests.*, vehicles_has_requests.*, drivers_has_requests.*, drivers.*, vehicles.* FROM requests  LEFT OUTER JOIN drivers_has_requests ON drivers_has_requests.requests_request_id = requests.request_id LEFT OUTER JOIN drivers ON drivers_has_requests.drivers_driver_id = drivers.driver_id LEFT OUTER JOIN vehicles_has_requests ON vehicles_has_requests.requests_request_id = requests.request_id LEFT OUTER JOIN vehicles ON vehicles_has_requests.vehicles_vehicle_id = vehicles.vehicle_id WHERE isapproved=1 AND now() >= end";
        con.query(sql, (err, results) => {
         if (err){res.send({success: false});} else {res.send({success: results});}
					 //console.log(JSON.stringify(results));
   });
});
//mark requests as Completed
app.post("/mark_completed_reqs", (req, res) => {
		var sql="UPDATE requests SET is_completed= 1 WHERE isapproved=1 AND now() >= end;";
        con.query(sql, (err, results) => {
         if (err){res.send({success: false});} else {res.send({success: true});}
					 //console.log(JSON.stringify(results));
   });
});
//get availlable drivers when selecting driver after an approved request
app.post("/get_availlable_drivers", (req, res)=> {
    var sql = "SELECT drivers.* FROM drivers WHERE (drivers.position='driver' OR drivers.position='maintenance') AND (drivers.position='driver' OR drivers.position='maintenance') AND drivers.driver_id NOT IN ( SELECT drivers_has_requests.drivers_driver_id FROM requests LEFT OUTER JOIN drivers_has_requests ON drivers_has_requests.requests_request_id = requests.request_id WHERE requests.request_id is not null and  (? <= end) AND (? >= start));"
    var values = [req.body.event_end, req.body.event_start];
        con.query(sql, values, (err, results)=> {
          console.log("availlable driver: "+req.body.event_start, req.body.event_end);
         if (err){throw err; res.send({success: false});} else {res.send({success: results});}
   });
});
//look for driver to reasign a requests
app.post("/look_for_driver_at_reasign", (req, res)=> {
    var sql = "SELECT drivers.* FROM drivers WHERE (drivers.position='driver' OR drivers.position='maintenance') AND (drivers.position='driver' OR drivers.position='maintenance') AND drivers.driver_id NOT IN ( SELECT drivers_has_requests.drivers_driver_id FROM requests LEFT OUTER JOIN drivers_has_requests ON drivers_has_requests.requests_request_id = requests.request_id WHERE requests.request_id is not null and  (? <= end) AND (? >= start));"
    var values = [req.body.event_end,req.body.event_start];
        con.query(sql, values, (err, results)=> {
          console.log(req.body.event_start, req.body.event_end);
         if (err){throw err; res.send({success: false});} else {res.send({success: results});}
   });
});

//select driver at reasign.
app.post("/select_driver_at_reasign", (req, res)=> {
    var sql = "UPDATE drivers_has_requests SET drivers_has_requests.drivers_driver_id =? WHERE drivers_has_requests.drivers_driver_id=?"
    var values = [req.body.new_driver_id, req.body.old_driver_id];
    console.log(values);
        con.query(sql, values, (err, results)=> {
         if (err){throw err; res.send({success: false});} else {res.send({success: true});}
   });
});

//get availlable shuttle when selecting shuttles after an approved request
app.post("/get_availlable_shuttles", (req, res) => {
    var sql = "SELECT vehicles.* FROM vehicles WHERE vehicles.availability= 1 AND vehicles.vehicle_id NOT IN ( SELECT vehicles_has_requests.vehicles_vehicle_id FROM requests LEFT OUTER JOIN vehicles_has_requests ON vehicles_has_requests.requests_request_id = requests.request_id WHERE requests.request_id is not null and  (? <= end) AND (?>= start));"
    var values = [req.body.event_end, req.body.event_start];
        con.query(sql, values, (err, results) => {
          console.log(req.body.event_start, req.body.event_end)
         if (err){console.log("get get_availlable_shuttles err"+ err);res.send({success: false});}
         else {
           //console.log("results"+JSON.stringify(results));
           res.send({success: results});}
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

 //remove shuttle out of the Available fleet
 app.post("/remove_shuttle", (req, res) => {
   console.log(req.body.vehicle_id);
 		var sql="UPDATE vehicles SET availability = 0 WHERE vehicle_id = ?";
         con.query(sql,req.body.vehicle_id, (err, results) => {
           if (err){res.send({success: false});} else {res.send({success: true});}
    });
 });

 //get all the desabled shuttles
 app.post("/get_unavailable_shuttle", (req, res) => {
 		var sql="SELECT * FROM vehicles WHERE availability = 0";
         con.query(sql,(err, results) => {
           if (err){res.send({success: false});} else {res.send({success: results});}
    });
 });

//add shuttle back fleet
 app.post("/add_shuttle_back_fleet", (req, res) => {
   console.log(req.body.vehicle_id);
     var sql="UPDATE vehicles SET availability = 1 WHERE vehicle_id = ?";
         con.query(sql,req.body.vehicle_id, (err, results) => {
           if (err){res.send({success: false});} else {res.send({success: true});}
    });
 });


app.post("/get_events", (req, res) => {
  var sql="SELECT  requests.*, drivers_has_requests.drivers_driver_id, vehicles_has_requests.vehicles_vehicle_id, drivers.*, vehicles.* FROM drivers_has_requests LEFT OUTER JOIN drivers ON drivers.driver_id = drivers_has_requests.drivers_driver_id LEFT OUTER JOIN vehicles ON vehicles.vehicle_id = drivers_has_requests.requests_request_id LEFT OUTER JOIN requests ON requests.request_id = drivers_has_requests.requests_request_id LEFT OUTER JOIN vehicles_has_requests ON vehicles_has_requests.requests_request_id = drivers_has_requests.drivers_driver_id WHERE requests.isapproved=1;";
  // var sql="SELECT * FROM tmp_requests WHERE isapproved='1'";
        con.query(sql, (err, results) => {
         if (err){
           console.log("get events err"+err);
           res.send({success: false});
         } else {
           res.send({success: results});
         }
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
         if (err){res.send({success: false});}
         else{res.redirect("/");}
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
var sql = "INSERT INTO requests (start, end, title, arrival_destination_dateTime, destination_dep_dateTime, arrival_PPU_dateTime, email, department, destination, num_passengers, loop_service, auth_name, hotel_name, hotel_address, direction, budget_num) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);";
var values = [req.body.start,req.body.end,req.body.title,req.body.arrival_destination_dateTime,req.body.destination_dep_dateTime,req.body.arrival_PPU_dateTime,req.body.email,req.body.department,req.body.destination,req.body.num_passengers,req.body.loop_service,req.body.auth_name,req.body.hotel_name,req.body.hotel_address,req.body.hotel_direction,req.body.budget_num];
       con.query(sql, values, (err, results) => {
         if (err) throw err;
         //console.log(results);
				 var to = req.body.email;
         var auth_name = req.body.auth_name

				 let mailOptions = {
					 from: 'fousseini.test@gmail.com',
					 to: to,
					 subject: 'Pointlift Request',
					 text: 'Thank you, '+auth_name,
					 html: '<div><table cellpadding="0" cellspacing="0" width="100%"><tr><td><table align="center" cellpadding="0" cellspacing="0" width="600"><tr><td align="center" style="padding: 40px 0 30px 0;"><img src="http://www.pointpark.edu/About/AdminDepts/PhysicalPlantFacilities/media/About/AdminDeptPhysPlant/Transportation/transportationbanner.jpg" alt="Pointlift" width="600" height="250px" style="display: block;" /></td></tr><tr><td bgcolor="#ffffff" style="padding: 40px 30px 40px 30px;"><table cellpadding="0" cellspacing="0" width="100%"><tr><td>Thank you '+auth_name+',</td></tr><tr><td style="padding: 20px 0 30px 0;">Our team will procede with your request shortly. </td></tr><tr></tr></table></td></tr><tr><td bgcolor="green" style="padding: 30px 30px 30px 30px;"><table cellpadding="0" cellspacing="0" width="100%"><tr><td><a href="http://fkonat.it.pointpark.edu:3000/">&reg; Pointlift<br/></a></td></tr></table></td></tr></table></td></tr></table></div>'
					};

						 smtpTransport.sendMail(mailOptions, (error, response)=>{
							 if(error){
									 console.log("msg err"+error);
								}else{
									 console.log("Message sent");
							 }
							smtpTransport.close();
						});

           res.redirect("home");
//con.end();
   });
});
// function test(){
// 	var today=new Date().toISOString()
// 	console.log(today.replace(/\..+/, ''));
// }
// test();
//assign request to driver
app.post("/assign_request_to_driver", (req, res) =>{
  // var sql = "INSERT INTO drivers_has_requests (drivers_has_requests.drivers_driver_id, drivers_has_requests.requests_request_id) VALUES("+req.body.driver+","+req.body.request_id+");";
  var sql = "INSERT INTO drivers_has_requests (drivers_has_requests.drivers_driver_id, drivers_has_requests.requests_request_id) VALUES";
  var firstcondition = true;
  for (var property in req.body) {
    var value = req.body[property];
    if (value !== "") {
      if (firstcondition) {
        firstcondition = false;
      } else {sql += ", "}
      if(value!==req.body.request_id){sql +=  " (" +value+","+ req.body.request_id+ ") " ;}
    }
  }
  sql +=";"
  var sql1 = sql.split(",");
  sql1.splice(-1, 1);
  sql1+=";";
	console.log(sql1);
	con.query(sql1, (err, results)=> {
		if (err){throw err;} else {res.send({success: true});}
				// console.log("reqid "+req.body.request_id);
		});
});
//assign request to vehicles
app.post("/assign_request_to_vehicle", (req, res) =>{
//  var sql = "INSERT INTO vehicles_has_requests (vehicles_has_requests.vehicles_vehicle_id, vehicles_has_requests.requests_request_id) VALUES("+req.body.vehicle+","+req.body.request_id+");";
var sql = "INSERT INTO vehicles_has_requests (vehicles_has_requests.vehicles_vehicle_id, vehicles_has_requests.requests_request_id) VALUES";
var firstcondition = true;
for (var property in req.body) {
  var value = req.body[property];
  if (value !== "") {
    if (firstcondition) {
      firstcondition = false;
    } else {sql += ", "}
    if(value!==req.body.request_id){sql +=  " (" +value+","+ req.body.request_id+ ") " ;}
  }
}
sql +=";"
var sql1 = sql.split(",");
sql1.splice(-1, 1);
sql1+=";";
	console.log(sql);
	con.query(sql1, (err, results)=> {
		if (err){throw err; res.send({success: false});} else {res.send({success: true});}
				// console.log("reqid "+req.body.request_id);
		});
});
//get driver info when signed
app.post("/get_driver_info", (req, res)=> {
  console.log(req.session.user_id);
  var sql="SELECT * FROM drivers WHERE driver_id=?";
        con.query(sql,[req.session.user_id], (err, results)=> {
          if (err){res.send({success: false});} else {res.send({success: results});}
   });
});
//get driver request if any when signed
app.post("/get_driver_request", (req, res)=> {
  console.log(req.session.user_id);
  var sql="SELECT  requests.* FROM drivers_has_requests LEFT OUTER JOIN requests ON requests.request_id = drivers_has_requests.requests_request_id WHERE drivers_has_requests.drivers_driver_id =?";
        con.query(sql,[req.session.user_id], (err, results)=> {
          if (err){res.send({success: false});} else {res.send({success: results});}
   });
});
app.post("/update_driver_infos", (req, res) =>{
  console.log(req.session.user_id);
    var sql="UPDATE drivers SET ";
    var firstcondition= true;
    for (var property in req.body) {
      var value = req.body[property];
      if (value !== "") {
	      if (firstcondition) {
		      firstcondition = false;
	      } else {sql += ", "}
      sql +=  property+ " = " + mysql.escape(value);
      }
    }
    sql += " WHERE driver_id = "+req.session.user_id;
    console.log(sql);
       con.query(sql, (err, results)=> {
         if (err){
           throw err;
           // res.send({success: false});
         }
         else{res.redirect("user");}
   });
});

// app.post("/get_bus_rental_request", (req, res)=>{
//    //var link = req.query.link;
//   //var link = 23;
//   var sql = "SELECT * FROM requests WHERE request_id = "+link;
//   console.log(sql);
//   con.query(sql, (err, results)=>{
//     if(err) throw err;
//     res.send({success: results});
//   });
// });

app.listen(app.get('port'), function() {
        console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.' );
});
