var express = require('express');
var app = express();
var handlebars = require('express-handlebars').create({defaultLayout:"main"});

app.engine("handlebars",handlebars.engine);
app.set("view engine","handlebars");
app.set('port', process.env.PORT || 3000);

app.get("/", function(req, res) {
	res.render("home");
});

app.get("/admin", function(req, res) {
        res.render("admin");
});

app.get("/user", function(req, res) {
        res.render("user");
});

app.listen(app.get('port'), function() {
        console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.' );
});



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



