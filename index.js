var express = require('express');
var app = express();
var handlebars = require('express-handlebars').create({defaultLayout:"main"});
var mysql = require('mysql');

app.engine("handlebars",handlebars.engine);
app.set("view engine","handlebars");
app.set('port', process.env.PORT || 3000);


/* DB Connection
 * USE connect(function(con){}); inside POST to call DB
*/
var con = mysql.createConnection({
    host : 'db.it.pointpark.edu',
    user : 'pointlift',
    password : 'pointlift',
    database : 'db.it.pointpark.edu'
});

function connect(cb){
  if(con.state === 'disconnected'){

    con.connect(function(err){
      if (err){
        console.log('error: ' + err.stack);
        return;
      }
      cb(con);
    });
  } else {
    cb(con);
  }
}

function getMenu(req){
  var menu =[];
//  var isAdmin = req.session.is_admin;
   menu.push({"page": "/", "label": "Home"},{"page": "about", "label": "About"});

//  if(isAdmin){
//    menu.push({"page": "admin", "label": "My Requests"});
//  } else{
//    if(req.session.user_id){
//    } else {
//      menu.push({"page": "addUser", "label": "Sign Up"},{"page": "home-login", "label":
//    }
//  }

  return menu;
};


app.get("/", function(req, res) {
  res.render("home", {
  menu: getMenu(req)
  });
});

app.get("/about", function(req, res) {
  res.render("about", {
  menu: getMenu(req)
  });
});

app.get("/admin", function(req, res) {
  res.render("admin", {
  menu: getMenu(req)
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
