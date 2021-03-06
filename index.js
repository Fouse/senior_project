var express = require('express');
var formidable = require('formidable');
var app = express();
var fs = require("fs");
var mysql = require("mysql");
var credentials = require("./credentials");
var handlebars = require('express-handlebars').create({defaultLayout:"main"});
var expressValidator = require('express-validator');
var bcrypt = require('bcryptjs');
var randomstring = require("randomstring");
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


var con = mysql.createConnection(credentials.connection);

//
// Link to the home page
//
app.get("/", function(req, res) {
	res.render("home");
});

//
// Link to the admin page
//
app.get("/admin", function(req, res) {
        res.render("admin");
});

//
// Link to the contacts page
//
app.get("/contact", function(req, res) {
        res.render("contact");
});

//
// Link to get the about page
//
app.get("/about", function(req, res) {
        res.render("about");
});

app.get("/about", function(req, res) {
	res.render("about");
});
app.get("/admin", function(req, res) {
  if(req.session.role){res.render("admin");}
  else {res.render("user");}
});

//
// Get the registration page to have a user create an account so they can log in
//
app.get("/register_page", function(req, res) {
	res.render("register_page");
});

//
// Get the login page so the user can log in with their credentials
//
app.get("/login", function(req, res) {
	res.render("login");
});

//
// Get the graph of peak times of students  throughout the day compared to the time of day
//
app.get("/my_graph", function(req, res) {
  res.render("my_graph");
});
app.get("/driver_form", function(req, res) {
	res.render("driver_form");
});
app.get("/van_form", function(req, res) {
	res.render("van_form");
});

//
// When a user creates an account, they get a screen that welcomes them to PointLift
//
app.get("/welcome_new_user", function(req, res) {
  if(req.session.role){res.render("welcome_new_user");}
  else{res.render("home");}
});

//
// Get the schedule to view
//
app.get("/view_schedule", function(req, res) {
	if(req.session.role){res.render("view_schedule");}
  else{res.render("home");}
});

//
// Get the bus form 
//
app.get("/bus_rental_form", function(req, res) {
	res.render("bus_rental_form");
});

app.get("/maintenance", function(req, res) {
  if(req.session.role){res.render("maintenance");}
  else {res.render("login");}
});

app.get("/forgot_password", function(req, res) {
	res.render("forgot_password");
});

app.get("/bus_rental_request", function(req, res) {
  // if(req.session.request_id ){
  // console.log(req.session.request_id);
    var link = req.query.link;
    var pwdLink = req.query.pwd;
    var details
    var sql = "SELECT * FROM requests WHERE request_id = "+link;
    console.log(sql);
    con.query(sql, (err, results)=>{
      if(err) throw err;
      if(pwdLink === results[0].link){
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
          comment:results[0].comment,
          requester_email:results[0].request_email,
          requester_name:results[0].auth_name

        });
      }else {
        //show error
        res.render("bus_rental_request");
      }
    });
  // } else{
  //   res.redirect("/pointlift");
  // }
});


 app.post("/create_user", (req, res)=>{
   req.checkBody('first_name', 'First name cannot be empty.').notEmpty();
   req.checkBody('last_name', 'Last name cannot be empty.').notEmpty();
   req.checkBody('email', 'The email you have entered is invalid, please try again.').isEmail();
   req.checkBody('password', 'Password must be between 4-100 characters long, please try again.').len(4, 100);
   req.checkBody('password', 'Password cannot be empty.').notEmpty();
   req.checkBody('reEnterPassword', 'Re-Enter Password must be between 4-100 characters long, please try again.').len(4, 100);
   req.checkBody('reEnterPassword', 'Re-Enter Password cannot be empty.').notEmpty();
   req.checkBody('reEnterPassword', 'Passwords do not match.').equals(req.body.password);
   var errors = req.validationErrors();
   if(errors){
     res.render('register_page', {errors: errors});
   }else {
     var first_name = req.body.first_name;
     var last_name = req.body.last_name;
     var email = req.body.email;
     var password = req.body.password;
     var reEnterPassword = req.body.reEnterPassword;
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

//
//Log into PointLift with account created. Must have an email and password.
//
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
             //req.session.cookie.maxAge = 9000000;
             req.session.cookie.maxAge = (5 * 86400000);
             res.redirect(303,"user");
           }
         });
        }
       });
    }
 });

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
          else if(result[0].role === 'maintenance'){
            res.render("maintenance",info);
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

//
// Link to the logout of an account
//
app.get("/logout", function(req, res){
  delete req.session.user_id;
  delete req.session.is_admin
  delete req.session.request_id;
  res.redirect("/pointlift");
});
//find user email at reset password
app.post("/find_user_email", (req, res)=>{
  var email = req.body.email;
    var sql = "SELECT first_name, user_id FROM users WHERE email=?";
    console.log(sql);
    console.log(email);
    con.query(sql, [email] ,(err, results)=>{
      if (err){
        res.send({success:false});
      }else{
        res.send({success:results});
      }

    });
});
app.post("/reset_password", (req, res)=>{
  req.checkBody('password', 'Password must be between 4-100 characters long, please try again.').len(4, 100);
  req.checkBody('password', 'Password cannot be empty.').notEmpty();
  req.checkBody('reEnterPassword', 'Re-Enter Password must be between 4-100 characters long, please try again.').len(4, 100);
  req.checkBody('reEnterPassword', 'Re-Enter Password cannot be empty.').notEmpty();
  req.checkBody('reEnterPassword', 'Passwords do not match.').equals(req.body.password);
  var errors = req.validationErrors();
  if(errors){
    console.log(errors)
    res.render('reset_password', {errors: errors});
  }else{
    var password = req.body.password;
    var user_id = req.body.user_id;
    console.log(user_id);
    console.log(password);
    bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(password, salt, function(err, hash) {
        console.log(salt);
         var sql = "UPDATE users SET password=?, salt=? WHERE user_id=?"
         var values = [hash, salt, user_id];
         con.query(sql, values, (err, results)=>{
           if(err){
             throw err;
           } else{
             console.log("passwor updated with success!");
             res.render("login");
           }
         });
      });
    });
  }
});

//print requests of the date
app.post("/print_request_of_aDay", (req, res)=>{
  var from = req.body.from;
  var to = req.body.to;
  console.log("from: "+from);
  console.log("to: "+to);
  sql="select r.request_id, r.start, r.end, r.request_department, vhd.drivers_driver_id, vhd.vehicles_vehicle_id, d.driver_fname, d.driver_lname, v.vehicle_number from requests r join vehicles_has_drivers vhd on r.request_id = vhd.requests_request_id join drivers d on vhd.drivers_driver_id = d.driver_id join vehicles v on vhd.vehicles_vehicle_id = v.vehicle_id and r.isapproved = 1 and r.start between ? and ?";
  console.log(sql);
  con.query(sql, [req.body.from, req.body.to], (err, results)=>{
    if(err){
      throw err;
    }
    else{
      res.send({success:results});
    }
  });

});

//get bus company_contact info
//
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

//update bus company_contact info
app.post("/update_bus_company_contact", (req, res)=>{
  if(req.session.user_id){
    console.log(req.session.user_id);
    var sql = "UPDATE bus_company_contact SET ";
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
      sql += " WHERE id = 1;";
      console.log(sql);
    con.query(sql ,(err, results)=>{
      if(err) res.send({success: false});
      res.send({success:true});
    });
  }
});

app.post("/bus_request", function(req, res){
//console.log(req.body);
var sql = "INSERT INTO requests (title,destination, start, end, num_passengers, departure_location, arrival_location, estimate_arrival, return_time, hotel_name, hotel_address, hotel_num, hotel_directions, return_location, event_person, event_person_num, request_department, request_email, auth_name, budget_num, comment) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);"
var values = [req.body.title,req.body.destination,req.body.start,req.body.end,
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
        var random_link = randomstring.generate(30);
          console.log(random_link);
          var sql3 = "UPDATE requests SET link = ? WHERE request_id=?";
          var values = [random_link, id];
          console.log(sql3);
          con.query(sql3, values, (err, results)=>{
            if (err){
              throw err;
            } else{
              var sql4 = "SELECT * from bus_company_contact WHERE id =1"
              con.query(sql4, (err, results)=>{
                if(err){
                  throw err;
                } else{
                  console.log("request id: ", id);
                  req.session.request_id = id;
                  req.session.cookie.maxAge = (5 * 86400000);
                  console.log(req.session.request_id);
                  var b_company_email = results[0].email;
                  var b_company_fname = results[0].fname;
                  var b_company_lname = results[0].lname;
                  console.log(b_company_email + b_company_fname + b_company_lname);
                  console.log("last request id inserted: "+id);
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
                    to: b_company_email,
                    subject: 'Pointlift',
                    text: "blala",
                    html: "<p>Hello "+b_company_fname+",</p><p>You have a new bus request from Point Park University <a href='https://fkonat.it.pointpark.edu/pointlift/bus_rental_request?link="+id+"&pwd="+random_link+"'>Please click here for more detail.</a></p>"
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
                }
              });
            }
          });
      }
    }
         res.redirect("/pointlift");
  });
});

//post van form data to database
app.post("/submit_request", function(req, res){
 var sql = "INSERT INTO requests (title, start, end, num_passengers, destination, departure_location, arrival_location, estimate_arrival, return_time, loop_service, request_department, budget_num, auth_name, request_email, comment) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);"
 var values = [req.body.title,req.body.start,req.body.end,req.body.num_passengers,
               req.body.destination,req.body.departure_location,req.body.arrival_location,
               req.body.estimate_arrival,req.body.return_time,req.body.loop_service,
               req.body.request_department,req.body.budget_num,req.body.auth_name,
               req.body.request_email,req.body.comment];
               con.query(sql, values, function(err, results) {
                 if (err) throw err;
                 res.redirect("/pointlift");
               });
             });

//post driver form data to database
app.post("/submit_request2", function(req, res){
//console.log(req.body);
var sql = "INSERT INTO requests (title,start, end, num_passengers, destination, departure_location, arrival_location, estimate_arrival, return_time, loop_service, directions, trip_purpose, auth_name, budget_num, request_email, comment) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);"
var values = [req.body.title,req.body.start,req.body.end,req.body.num_passengers,
             req.body.destination,req.body.departure_location,req.body.arrival_location,
             req.body.estimate_arrival,req.body.return_time,req.body.loop_service,
             req.body.directions,req.body.trip_purpose,req.body.auth_name,
             req.body.budget_num,req.body.request_email,req.body.comment];
       con.query(sql, values, function(err, results) {
         if (err) throw err;
  //console.log(results);
           res.redirect("/pointlift");
          //con.end();
             });
          });



//
// Post the request approved from the bus company to the database when the fields have been filled out.

app.post("/request_approve_by_bcompany", (req, res)=>{
  console.log("req id: "+req.body.request_id);
  console.log("requester email: "+req.body.requester_email);
  console.log("requester name: "+req.body.requester_name);
  var requester_name = req.body.requester_name;
  var requester_email = req.body.requester_email;
    var sql = "UPDATE requests SET bus_company = ?, ref_num = ?, bus_driver=?, bus_num=?, bus_driver_phone=?, bus_phone=?, emergency_contact=? WHERE request_id=?;";
    var values =[req.body.bus_company, req.body.ref_num, req.body.bus_driver, req.body.bus_num, req.body.bus_driver_phone, req.body.bus_phone, req.body.emergency_contact,req.body.request_id];
    console.log(values);
    console.log(sql);
    con.query(sql, values ,(err, results)=>{
      if(err){
        throw err;
        res.send({success: false});
      }else{
        var sql2 = "UPDATE requests SET approved_by_bCompany = 1 WHERE request_id= "+req.body.request_id;
        console.log(sql2);
        con.query(sql2, (err, results)=>{
          if(err){
            throw err;
          } else{
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
            let approved_request_by_bCompany = {
              from: 'fousseini.test@gmail.com',
              to: requester_email,
              subject: 'Pointlift',
              text: "Dear "+requester_name,
              html: '<div><table cellpadding="0" cellspacing="0" width="100%"><tr><td><table align="center" cellpadding="0" cellspacing="0" width="600"><tr><td align="center" style="padding: 40px 0 30px 0;"><img src="http://www.pointpark.edu/About/AdminDepts/PhysicalPlantFacilities/media/About/AdminDeptPhysPlant/Transportation/transportationbanner.jpg" alt="Pointlift" width="600" height="250px" style="display: block;" /></td></tr><tr><td bgcolor="#ffffff" style="padding: 40px 30px 40px 30px;"><table cellpadding="0" cellspacing="0" width="100%"><tr><td>Dear '+requester_name+',</td></tr><tr><td style="padding: 20px 0 30px 0;">Your request has been approved by the bus company. </td></tr><tr></tr></table></td></tr><tr><td bgcolor="green" style="padding: 30px 30px 30px 30px;"><table cellpadding="0" cellspacing="0" width="100%"><tr><td><a href="http://fkonat.it.pointpark.edu:3000/">&reg; Pointlift<br/></a></td></tr></table></td></tr></table></td></tr></table></div>'
             };
             send_mail(approved_request_by_bCompany);
            console.log("successfully approved by the company");
          }
        });
      }
      res.redirect("/pointlift");
    });
});

//
// Post the users who have had an account to correlate from the database to the current fields being filled out
// proving the account is valid. Only when the users already have an account.
//
 app.post("/get_users", (req, res)=>{
     console.log(req.session.user_id);
     var sql = "SELECT drivers.*, users.* FROM users LEFT OUTER JOIN drivers ON drivers.driver_id = users.user_id WHERE user_id=?";
     con.query(sql, [req.session.user_id] ,(err, results)=>{
       if(err) res.send({success: false});
       res.send({success:results});
     });
 });

//
// Get new users and post the the database of a new account that has been created.
//
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

//
// Post new users that have been approved by the admin 
//
 app.post("/approve_new_user", (req, res)=>{
   // if(req.session.user_id){
   console.log(req.session.user_id);
   console.log("user: "+ req.body.user_id);
   console.log("position: "+ req.body.position);
   console.log("email: "+ req.body.email);
   console.log("first_name: "+ req.body.first_name);
     var sql = "UPDATE users set role='"+req.body.position+"' where user_id="+req.body.user_id;
     console.log(sql);
     con.query(sql, (err, results)=>{
       if(err) {
         res.send({success: false});
       }else{
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
         let approve_new_user = {
           from: 'fousseini.test@gmail.com',
           to: req.body.email,
           subject: 'Pointlift',
           text: "Dear "+req.body.first_name,
           html: "<p>Dear "+req.body.first_name+",</p><p>Your account has been approved!!, <a href='https://fkonat.it.pointpark.edu/pointlift/login'>Please click here to login.</a></p>"
          };
          send_mail(approve_new_user);
       }
       res.send({success: true});
     });
   //}
 });

//
// Post the van form data to database when the fields have been filled out.
//
 app.post("/submit_request", function(req, res){
 	var sql = "INSERT INTO requests (start, end, num_passengers, destination, departure_location, arrival_location, estimate_arrival, return_time, loop_service, request_department, budget_num, auth_name, request_email, comment) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?);"
 	var values = [req.body.start,req.body.end,req.body.num_passengers,
 		      req.body.destination,req.body.departure_location,req.body.arrival_location,
 		      req.body.estimate_arrival,req.body.return_time,req.body.loop_service,
		      req.body.request_department,req.body.budget_num,req.body.auth_name,
		      req.body.request_email,req.body.comment];
 		      con.query(sql, values, function(err, results) {
 		        if (err) throw err;
 			res.redirect("/");
 		      });
 });

//
// Post the driver form data to database when the form has been submitted after the fields have been filled out.
//
 app.post("/submit_request2", function(req, res){
 //console.log(req.body);
 var sql = "INSERT INTO requests (start, end, num_passengers, destination, departure_location, arrival_location, estimate_arrival, return_time, loop_service, directions, trip_purpose, auth_name, budget_num, request_email, comment) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);"
 var values = [req.body.start,req.body.end,req.body.num_passengers,
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

//
// Post the bus form data to database when the fields have been filled out and submitted.
//
app.post("/submit_request3", function(req, res){
//console.log(req.body);
  var sql = "INSERT INTO requests (destination, start, end, num_passengers, departure_location, arrival_location, estimate_arrival, return_time, hotel_name, hotel_address, hotel_num, hotel_directions, return_location, event_person, event_person_num, request_department, request_email, auth_name, budget_num, comment, bus_company, ref_num, bus_driver, bus_num, bus_driver_phone, bus_phone, emergency_contact) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);"
  var values = [req.body.destination,req.body.start,req.body.end,
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

//
// Post the form fields after filled out by user and direct them to the database.
//
app.post("/get_form_fields", function(req, res){
	let sql="SELECT * FROM requests where request_id=" + parseInt(req.query.mod_form);
	con.query(sql, function(err, results){
		if (err){
			res.send({success: false});
}
	else if (results) {
		var Something = JSON.parse(JSON.stringify(results))[0]
		res.send({success: results});}
	});
});

 /*app.post("/get_form_fields", (req, res)=> {
		var sql="SELECT * FROM requests WHERE request_id =" + Number(req.body.mod_form);
		con.query(sql, (err, results)=> {
			if (err){res.send({success: false});} else {
				console.log("hello");
				res.send({success: results});}
 //con.end();
    });
 });*/

//
// Post the drivers that have accounts already and correlate them that they have accounts in the database.
//
app.post("/get_drivers", (req, res) => {
  var sql="SELECT users.*, drivers.* FROM users LEFT OUTER JOIN drivers ON drivers.driver_id = users.user_id WHERE (users.role='driver' OR users.role='maintenance') AND drivers.availability=1;";
        con.query(sql, (err, results) => {
         if (err){res.send({success: false});} else {res.send({success: results});}
//con.end();
   });
});


//
// Post to remove drivers from the admin perspective
//
app.post("/remove_driver", (req, res) => {
  console.log(req.body.driver_id);
   var sql="UPDATE drivers SET availability = 2 WHERE driver_id = ?";
        con.query(sql,req.body.driver_id, (err, results) => {
          if (err){res.send({success: false});} else {res.send({success:true});}
   });
});


//
// Post to add driver back to available drivers 
//
app.post("/add_driver_back_to_available_drivers", (req, res) => {
  console.log(req.body.driver_id);
    var sql="UPDATE drivers SET availability = 1 WHERE driver_id = ?";
        con.query(sql,req.body.driver_id, (err, results) => {
          if (err){res.send({success: false});} else {res.send({success:true});}
   });
});


//
// Post to get all the disabled shuttles so they are not selected
//
app.post("/get_unavailable_drivers", (req, res) => {
   var sql="SELECT users.*, drivers.* FROM users LEFT OUTER JOIN drivers ON drivers.driver_id = users.user_id WHERE users.is_admin=0 AND drivers.availability = 2";
        con.query(sql,(err, results) => {
          if (err){res.send({success: false});} else {res.send({success: results});}
   });
});


//
// Post to get the total requests so that the red box on the admin page so the
// admin can see the total number of requests available.
//
app.post("/get_req_count", (req, res)=> {
  var sql="SELECT COUNT(*) AS count FROM requests WHERE isapproved=0";
        con.query(sql,(err, results)=> {
         if (err){res.send({success: false});} else {res.send({success: results});}
   });
});

// 
// Post to get the new user accounts that have been created that need approved
//
app.post("/get_new_user_count", (req, res)=> {
  var sql="SELECT COUNT(*) AS count FROM users WHERE role='new'";
        con.query(sql,(err, results)=> {
         if (err){res.send({success: false});} else {res.send({success: results});}
   });
});


//
//Post to change reuest isapprove to 1 when approved
//
app.post("/update_req_status", (req, res) => {
	  var sql="UPDATE requests SET isapproved = 1 WHERE request_id=?";
        con.query(sql, req.body.request_id, (err, results) => {
         if (err){res.send({success: false});} else {res.send({success: results});}
   });
});


//
// Post to get the requests so that the admin can view and make a decision
//
app.post("/get_reqs", (req, res) => {
  // var sql="SELECT * FROM requests WHERE isapproved='0'";
	  var sql="SELECT * FROM requests WHERE isapproved=0";
        con.query(sql,(err, results) => {
         if (err){res.send({success: false});} else {res.send({success: results});}
   });
});


// 
// Post to get all the vehicles 
//
app.post("/get_vehicles", (req, res) => {
  var sql="SELECT * FROM vehicles WHERE availability=1";
  con.query(sql,(err, results)=> {
  if (err){res.send({success: false});} else {res.send({success: results});}
  });
});


//
// Post to get requests status so see if requests have been approved or denied
//
app.post("/get_reqs_status", (req, res) => {

		var sql="SELECT drivers.*, vehicles.*, requests.* FROM vehicles_has_drivers LEFT OUTER JOIN requests ON requests.request_id = vehicles_has_drivers.requests_request_id LEFT OUTER JOIN drivers ON drivers.driver_id = vehicles_has_drivers.drivers_driver_id LEFT OUTER JOIN vehicles ON vehicles.vehicle_id = vehicles_has_drivers.vehicles_vehicle_id WHERE requests.isapproved=1;"
        con.query(sql, (err, results) => {
          if (err){res.send({success: false});} else {res.send({success: results});}
	//console.log(JSON.stringify(results));
//con.end();
   });
});


//
// Post to get requests ongoing
//
app.post("/get_reqs_ongoing", (req, res) => {
		var sql="SELECT drivers.*, vehicles.*, requests.* FROM vehicles_has_drivers LEFT OUTER JOIN requests ON requests.request_id = vehicles_has_drivers.requests_request_id LEFT OUTER JOIN drivers ON drivers.driver_id = vehicles_has_drivers.drivers_driver_id LEFT OUTER JOIN vehicles ON vehicles.vehicle_id = vehicles_has_drivers.vehicles_vehicle_id WHERE requests.isapproved=1 AND now() BETWEEN start AND end";

        con.query(sql, (err, results) => {
          if (err){res.send({success: false});} else {res.send({success: results});}
   });
});


//
// Post to get req Completed
//
app.post("/get_reqs_completed", (req, res) => {
		var sql="SELECT drivers.*, vehicles.*, requests.* FROM vehicles_has_drivers LEFT OUTER JOIN requests ON requests.request_id = vehicles_has_drivers.requests_request_id LEFT OUTER JOIN drivers ON drivers.driver_id = vehicles_has_drivers.drivers_driver_id LEFT OUTER JOIN vehicles ON vehicles.vehicle_id = vehicles_has_drivers.vehicles_vehicle_id WHERE requests.isapproved=1 AND now() >= end";

        con.query(sql, (err, results) => {
         if (err){res.send({success: false});} else {res.send({success: results});}
					 //console.log(JSON.stringify(results));
   });
});


//
// Post to mark requests as Completed
//
app.post("/mark_completed_reqs", (req, res) => {
		var sql="UPDATE requests SET is_completed= 1 WHERE isapproved=1 AND now() >= end;";
        con.query(sql, (err, results) => {
         if (err){res.send({success: false});} else {res.send({success: true});}
					 //console.log(JSON.stringify(results));
   });
});


//
//Post to get available drivers when selecting driver after an approved request
//
app.post("/get_availlable_drivers", (req, res)=> {
    var sql = "SELECT drivers.* FROM drivers WHERE drivers.availability=1 AND drivers.driver_id  NOT IN (SELECT vehicles_has_drivers.drivers_driver_id FROM vehicles_has_drivers  LEFT OUTER JOIN  requests ON  requests.request_id = vehicles_has_drivers.requests_request_id  LEFT OUTER JOIN drivers ON drivers.driver_id = vehicles_has_drivers.drivers_driver_id WHERE (drivers.position='driver '  OR drivers.position='maintenance') AND requests.request_id is not null and  (? <= end) AND (? >= start));"
    var values = [req.body.event_end, req.body.event_start];
        con.query(sql, values, (err, results)=> {
          console.log("availlable driver: "+req.body.event_start, req.body.event_end);
         if (err){throw err; res.send({success: false});} else {res.send({success: results});}
   });
});

//look for vehicle to reasign a requests
app.post("/look_for_vehicle_at_reasign", (req, res)=> {
    var sql = "SELECT vehicles.* FROM vehicles WHERE vehicles.vehicle_id  NOT IN (SELECT vehicles_has_drivers.vehicles_vehicle_id FROM vehicles_has_drivers  LEFT OUTER JOIN  requests ON  requests.request_id = vehicles_has_drivers.requests_request_id  LEFT OUTER JOIN vehicles ON vehicles.vehicle_id = vehicles_has_drivers.vehicles_vehicle_id WHERE requests.request_id is not null and  (? <= Start or  ? >= End));"
    var values = [req.body.event_end,req.body.event_start];
    console.log(sql);
        con.query(sql, values, (err, results)=> {
          console.log(sql);
          console.log(req.body.event_start, req.body.event_end);
         if (err){throw err; res.send({success: false});} else {res.send({success: results});}
   });
});
//look for driver to reasign a requests

app.post("/look_for_driver_at_reasign", (req, res)=> {
    var sql = "SELECT drivers.* FROM drivers WHERE drivers.availability=1 AND drivers.driver_id  NOT IN (SELECT vehicles_has_drivers.drivers_driver_id FROM vehicles_has_drivers  LEFT OUTER JOIN  requests ON  requests.request_id = vehicles_has_drivers.requests_request_id  LEFT OUTER JOIN drivers ON drivers.driver_id = vehicles_has_drivers.drivers_driver_id WHERE (drivers.position='driver '  OR drivers.position='maintenance') AND requests.request_id is not null and  (? <= Start or  ? >= End));"
    var values = [req.body.event_end,req.body.event_start];
        con.query(sql, values, (err, results)=> {
          console.log(sql);
          console.log(req.body.event_start, req.body.event_end);
         if (err){throw err; res.send({success: false});} else {res.send({success: results});}
   });
});


//
// Post to select drivers when in need to reasign.
//
app.post("/select_driver_at_reasign", (req, res)=> {
  var sql="UPDATE vehicles_has_drivers SET drivers_driver_id = "+req.body.new_driver_id+" WHERE drivers_driver_id= "+req.body.old_driver_id;
  //var values = [req.body.drivers_driver_id, req.body.drivers_driver_id];
  console.log("reselect driver: "+sql);
  //console.log(values);
        con.query(sql, (err, results)=> {
         if (err){
           throw err; res.send({success: false});
         } else {
           res.send({success: true});
         }
   });
});

app.post("/select_vehicle_at_reasign", (req, res)=> {
  var sql="UPDATE vehicles_has_drivers SET vehicles_vehicle_id = "+req.body.new_vehicle_id+" WHERE vehicles_vehicle_id= "+req.body.old_vehicle_id;
  //var values = [req.body.drivers_driver_id, req.body.drivers_driver_id];
  console.log("reselect vehicle: "+sql);
  //console.log(values);
        con.query(sql, (err, results)=> {
         if (err){throw err; res.send({success: false});} else {res.send({success: true});}
   });
});


//
// Post to get availlable shuttle when selecting shuttles after an approved request
//
app.post("/get_availlable_shuttles", (req, res) => {
  var sql = "SELECT vehicles.* FROM vehicles WHERE vehicles.vehicle_id  NOT IN (SELECT vehicles_has_drivers.vehicles_vehicle_id FROM vehicles_has_drivers  LEFT OUTER JOIN  requests ON  requests.request_id = vehicles_has_drivers.requests_request_id  LEFT OUTER JOIN vehicles ON vehicles.vehicle_id = vehicles_has_drivers.vehicles_vehicle_id WHERE requests.request_id is not null and  (? <= end) AND (? >= start));"
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


//
// Post to display and check for free vehicles once an assigned request is done
// 
app.post("/free_vehicles", (req, res) => {
  var sql="UPDATE vehicles SET availability='1' WHERE vehicle_id IN (SELECT vehicle_id FROM tmp_requests  WHERE now() >= end);";
        con.query(sql, (err, results) => {
	//console.log(sql);
	if (err){res.send({success: false});}else{res.send({success: true});}
   });
 });

//
// Post to remove a shuttle out of the Available fleet
//
 app.post("/remove_shuttle", (req, res) => {
   console.log(req.body.vehicle_id);
 		var sql="UPDATE vehicles SET availability = 0 WHERE vehicle_id = ?";
         con.query(sql,req.body.vehicle_id, (err, results) => {
           if (err){res.send({success: false});} else {res.send({success: true});}
    });
 });

//
// Post to get all the disabled shuttles
//
 app.post("/get_unavailable_shuttle", (req, res) => {
 		var sql="SELECT * FROM vehicles WHERE availability = 0";
         con.query(sql,(err, results) => {
           if (err){res.send({success: false});} else {res.send({success: results});}
    });
 });


//
// Post to add a shuttle back into the available fleet
//
 app.post("/add_shuttle_back_fleet", (req, res) => {
   console.log(req.body.vehicle_id);
     var sql="UPDATE vehicles SET availability = 1 WHERE vehicle_id = ?";
         con.query(sql,req.body.vehicle_id, (err, results) => {
           if (err){res.send({success: false});} else {res.send({success: true});}
    });
 });


//
// Post to receive events requested
//
app.post("/get_events", (req, res) => {
  var sql="SELECT drivers.*, vehicles.*, requests.* FROM vehicles_has_drivers LEFT OUTER JOIN requests ON requests.request_id = vehicles_has_drivers.requests_request_id LEFT OUTER JOIN drivers ON drivers.driver_id = vehicles_has_drivers.drivers_driver_id LEFT OUTER JOIN vehicles ON vehicles.vehicle_id = vehicles_has_drivers.vehicles_vehicle_id WHERE requests.isapproved=1";
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

//edit requests
app.post("/edit_request", (req, res) =>{
    var sql="UPDATE requests SET ";
    var firstcondition= true;
    for (var property in req.body) {
      var value = req.body[property];
      if (value !== ""&& value!==req.body.request_id) {
	      if (firstcondition) {
		      firstcondition = false;
	      } else {sql += ", "}
      if(value!==req.body.request_id){sql +=  property+ " = " + mysql.escape(value);}
      }
    }
    sql += " WHERE request_id = "+req.body.request_id;
    console.log(sql);
       con.query(sql, (err, results)=> {
         if (err){throw err;}
         else{res.send({success: true});}
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
         else{res.redirect("home");}
   });
});


//
// Post to get the link of the weekly schedule
//
app.post("/get_weekly_schedule", (req, res)=> {
  var sql="SELECT * FROM weekly_schedule";
        con.query(sql, (err, results)=> {
          if (err){res.send({success: false});} else {res.send({success: results});}
//con.end();
   });
});


//
// Post to add a driver to a fleet or a request
//
app.post("/add_driver", (req, res)=>{
//console.log(req.body);
  var sql = "INSERT INTO drivers (driver_fname, driver_lname) VALUES (?,?);";
  var values = [req.body.driver_fname,req.body.driver_lname];
       con.query(sql, values, function(err, results) {
         if (err){
           res.send({success: false});
         } else {
           res.redirect("admin");
         }
//con.end();
   });
});


app.post("/add_new_shuttle", (req, res)=>{
//console.log(req.body);
var sql = "INSERT INTO vehicles (vehicle_number, seat_number, inspect_date) VALUES (?,?,?);";
var values = [req.body.vehicle_number,req.body.seat_number, req.body.inspect_date];
       con.query(sql, values, (err, results)=> {
         if (err){res.send({success: false});} else {res.send({success: true});}
//con.end();
   });
});


//
// Post to receive the requests submitted by a user and the process of approving/dening, and 
// assigning them to a driver.
//
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

           res.redirect("/pointlift");
//con.end();

   });
});
// function test(){
// 	var today=new Date().toISOString()
// 	console.log(today.replace(/\..+/, ''));
// }
// test();
//assign request to driver


//
// Post to assign the requests to a driver when advised
//
app.post("/assign_request_to_driver", (req, res) =>{
  // var sql = "INSERT INTO drivers_has_requests (drivers_has_requests.drivers_driver_id, drivers_has_requests.requests_request_id) VALUES("+req.body.driver+","+req.body.request_id+");";
  var sql = "INSERT INTO vehicles_has_drivers (drivers_driver_id, vehicles_vehicle_id, requests_request_id) VALUES";
  // var firstcondition = true;
  var value = req.body;
  console.log(value,"value");
  console.log("length: ",value.number_of_driver);
  if(value.number_of_driver === "1"){
    sql += "(" +value.drivers_driver_id+","+value.vehicles_vehicle_id+","+value.request_id+")";
  }

  else {
    for( var i =0; i<value.number_of_driver; i++){
       sql += (i===0?"":",")+ "(" +value.drivers_driver_id[i]+","+value.vehicles_vehicle_id[i]+","+value.request_id+")";
    }
  }


   sql+=";";
	console.log(sql);
	con.query(sql, (err, results)=> {
		if (err){throw err;} else {res.send({success: true});}
		});
});


//
// Post to get driver info when signed
//
app.post("/get_driver_info", (req, res)=> {
  console.log(req.session.user_id);
  var sql="SELECT * FROM drivers WHERE driver_id=?";
        con.query(sql,[req.session.user_id], (err, results)=> {
          if (err){res.send({success: false});} else {res.send({success: results});}
   });

});


//
// Post to get driver requests if any when signed
//
app.post("/get_driver_request", (req, res)=> {
  console.log(req.session.user_id);
  var sql="SELECT drivers.*, vehicles.*, requests.* FROM vehicles_has_drivers LEFT OUTER JOIN requests ON requests.request_id = vehicles_has_drivers.requests_request_id LEFT OUTER JOIN drivers ON drivers.driver_id = vehicles_has_drivers.drivers_driver_id LEFT OUTER JOIN vehicles ON vehicles.vehicle_id = vehicles_has_drivers.vehicles_vehicle_id WHERE drivers.driver_id=?";
        con.query(sql,[req.session.user_id], (err, results)=> {
          if (err){res.send({success: false});} else {res.send({success: results});}
   });
});


//
// Post to update driver info when edited
//
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


//
// The route to open the webpage and the link call
app.listen(app.get('port'), function() {
        console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.' );

});
