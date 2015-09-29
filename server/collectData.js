//Imports
var PythonShell = require('python-shell')

//BEGIN user variables
//Set frequency (in seconds) to poll for hardware information.
//shortestTime is frequency of polling for frequently changing information (e.g. CPU usage)
//longestTime is frequency of polling for more stable information that doesn't change often (e.g. IP address)
var shortestTime = 2,
	longestTime = 10,
	consoleVerbose = false;
	
//END user variables

//Set python-shell options
var options = { mode: 'json', scriptPath: './' },
	counter = 0,
	dataObject,
	minutesToStore = 60;

module.exports = 
{
	collect: function(db){
		//create collections if they don't already exist. Only used on first run/if collections are empty.
	    var systemCollection = db.collection('systemInfo'),
		    driveCollection = db.collection('driveInfo'),
		    cpuCollection = db.collection('cpuInfo'),
		    memoryCollection = db.collection('memoryInfo');

	    //systemCollection is not capped - it gets updated every interval. Create blank object if collection is empty
	    systemCollection.find().count(function(err, count) {
	    	if(err) throw err;

	        if (count === 0) {
	        	var systemObject = {
	        		"host" : 0,
	        		"cpu" : 0,
	        		"publicIP" : 0,
					"driveStatus" : 0,
					"uptime" : 0,
					"services" : 0,
					"networkDevices" : 0,
					"processes" : 0,
					"timeCollected" : 0
	        	}

	        	systemCollection.insert(systemObject, function(err, result){
	        		console.log("Creating systemInfo collection...");
	        	})
	        }
	    })

	    //check if each collections exists, if not (i.e. if empty): create each as capped
	    //hard drive information
	    driveCollection.find().count(function(err, count) {
	    	if(err) throw err;

	        if (count === 0) {
	            db.createCollection("driveInfo",
	                                { "capped": true,
	                                  "size": 1000000,
	                                  "max": (60/shortestTime)*minutesToStore },
	                                function(err, collection) {
	                if(err) throw err;              
	                console.log("Creating driveInfo collection...");
	            });
	        }
	    })

	    //cpu information
	    cpuCollection.find().count(function(err, count) {
	    	if(err) throw err;

	        if (count === 0) {
	            db.createCollection("cpuInfo",
	                                { "capped": true,
	                                  "size": 1000000,
	                                  "max": (60/shortestTime)*minutesToStore },
	                                function(err, collection) {
	                if(err) throw err;              
	                console.log("Creating cpuInfo collection...");
	            });
	        }
	    })
	    
	    //RAM information
	    memoryCollection.find().count(function(err, count) {
	    	if(err) throw err;

	        if (count === 0) {
	            db.createCollection("memoryInfo",
	                                { "capped": true,
	                                  "size": 1000000,
	                                  "max": (60/shortestTime)*minutesToStore },
	                                function(err, collection) {
	                if(err) throw err;              
	                console.log("Creating memoryInfo collection...");
	            });
	        }
	    })


		//gather all information once initially on db connect / restart
		collectInitial()
		collectInfo_short()
		collectInfo_long()
		
		//function to collect stable system information. Only run once.
		function collectInitial(){
			PythonShell.run('./scripts/gatherOnce.py', options, function (err, results) {
				if (err) throw err;

				// results is an array consisting of messages collected during python script execution
				dataObject = results[0];

				systemCollection.find().sort([["_id", -1]]).limit(1).nextObject(function(err, item) {       
				    if(err) throw err;
				    //update the systemCollection with host and cpu info.
				    systemCollection.update({ "_id": item._id },
				              { "$set": { "host": dataObject.host, "cpu" : dataObject.cpu }},
				              function(err, result) {
				        if(err) throw err;
				        consoleVerbose ? console.log("Initial system information stored.") : null;
				    });
				});
			});
		}

		//function to store SHORT time interval information
		function collectInfo_short(){
			console.log(" ***** getting short interval data *****")

			PythonShell.run('./scripts/gatherShortInfo.py', options, function (err, results) {
				if (err) throw err;

				// results is an array consisting of messages collected during python script execution
				dataObject = results[0]

				//get time, drive, cpu, and RAM information from returned python object
				var timeCollected = dataObject.timeCollected,
				driveObject = {"timeCollected": timeCollected, "drives": dataObject.drives},
				cpuObject = {"timeCollected": timeCollected, "cpuUsage": dataObject.cpuUsage},
				memoryObject = {"timeCollected": timeCollected, "memory": dataObject.memory};

				//insert data into the drive collection
				driveCollection.insert(driveObject, function(err, result) {
	                if (err) throw err;
	                consoleVerbose ? console.log("Hard drive information updated.") : null;
	            });

				//insert data into the cpu collection
	            cpuCollection.insert(cpuObject, function(err, result) {
	                if (err) throw err;
	                consoleVerbose ? console.log("CPU usage information updated.") : null;
	            });

	            //insert data into the RAM collection
	            memoryCollection.insert(memoryObject, function(err, result) {
	                if (err) throw err;
	                consoleVerbose ? console.log("Memory information updated."): null;
	            });

	            //find the last entry and update system info collection
	            systemCollection.find().sort([["_id", -1]]).limit(1).nextObject(function(err, item) {       
				    if(err) throw err;
				    //do the collection update
				    systemCollection.update({ "_id": item._id },
				              { "$set":
				              	{
				              	"uptime": dataObject.uptime,
				              	"services" : dataObject.services,
				              	"processes" : dataObject.processes,
				              	"timeCollected" : dataObject.timeCollected
				              	}
				              },
				              function(err, result) {
				        if(err) throw err;
				        consoleVerbose ? console.log("System information updated.") : null;
				    });
				});

			});
		}

		//function to store LONG time interval information
		function collectInfo_long(){
			console.log(" ********** getting long interval data **********")

			PythonShell.run('./scripts/gatherLongInfo.py', options, function (err, results) {
				if (err) throw err;

				// results is an array consisting of messages collected during python script execution
				dataObject = results[0];

				//insert the relatively stable information into the system collection.
				systemCollection.find().sort([["_id", -1]]).limit(1).nextObject(function(err, item) {       
				    if(err) throw err;
				    //do the collection update
				    systemCollection.update({ "_id": item._id },
				              { "$set": 
				              	{
				              	"networkDevices": dataObject.networkDevices,
				              	"publicIP" : dataObject.publicIP,
				              	"driveStatus" : dataObject.driveStatus
				              	}
				              },
				              function(err, result) {
				        if(err) throw err; 
				    });
				});
			});
		}


		//background processes - gathers SHORT time interval information on timer
		setInterval(function(){
			counter += shortestTime
			//only run if current time != longest time
			if(counter % longestTime !== 0){
				collectInfo_short()
				} else {
				counter = 0;
				}
		}, shortestTime*1000)

		//background processes - gathers LONG time interval information on timer
		setInterval(function(){
			// run both short and long code when longest time is reached
			collectInfo_short()
			collectInfo_long()
		}, longestTime*1000)
	}
}