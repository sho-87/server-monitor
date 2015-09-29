//imports
var express = require('express'),
	path = require('path'),
	MongoClient = require('mongodb').MongoClient, 
	Server = require('mongodb').Server;
	collectData = require('./collectData')

//system variables
var app = express(),
	serverPort = 80,
	staticDir = path.join(__dirname, '../client');

app.use(express.static(staticDir));

//database variables
var host = "localhost",
	mongoPort = 27017,
	dbName = "systemMonitor",
	mongoclient = new MongoClient(new Server(host, mongoPort)),
	dbConnector  = mongoclient.db(dbName),
	db;

//api routes
app.get('/', function(req, response){
	response.status(200);
	response.redirect('/index.html');
});

app.get("/api/system", function(request, response){
	response.status(200)

	var collection = db.collection('systemInfo');

	collection.find({}, {_id: 0}).toArray(function(err, data) {
		if (err) throw error;

    	response.send(data);
    });
})

app.get("/api/drives", function(request, response){
	response.status(200)

	var collection = db.collection('driveInfo');

	collection.find({}, {_id: 0}).toArray(function(err, data) {
		if (err) throw error;

    	response.send(data);
    });
})

app.get("/api/cpu", function(request, response){
	response.status(200)

	var collection = db.collection('cpuInfo');

	collection.find({}, {_id: 0}).toArray(function(err, data) {
		if (err) throw error;

    	response.send(data);
    });
})

app.get("/api/memory", function(request, response){
	response.status(200)

	var collection = db.collection('memoryInfo');

	collection.find({}, {_id: 0}).toArray(function(err, data) {
		if (err) throw error;

    	response.send(data);
    });
})

app.get("/api/processes", function(request, response){
	response.status(200)

	var collection = db.collection('systemInfo');

	collection.find({}, {_id: 0, processes: 1}).toArray(function(err, data) {
		if (err) throw error;

    	response.send(data);
    });
})

app.get("/api/services", function(request, response){
	response.status(200)

	var collection = db.collection('systemInfo');

	collection.find({}, {_id: 0, services: 1}).toArray(function(err, data) {
		if (err) throw error;

    	response.send(data);
    });
})

//connect to database
dbConnector.open(function(err, opendb) {
    if(err) throw err;
    console.log("Connected to database...")

    db = opendb;

    app.listen(serverPort)

    //start data collection
	collectData.collect(db)
})