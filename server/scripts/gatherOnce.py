#imports
import wmi
import json

#create the WMI object to be queried
c = wmi.WMI()

#get the computer hostname
def getHostName():
	#query just the system name
	queryHostname = c.query( "select Name from Win32_ComputerSystem")

	for computer in queryHostname:
		name = computer.Name

	hostname = {"name": str(name)}

	return hostname

#get information about the cpu
def getCPUInfo():

	#select the cpu information
	queryCPUInfo = c.query( "select Name, NumberOfCores, MaxClockSpeed from Win32_Processor")

	#if multiple cpus, pull their information
	for cpu in queryCPUInfo:
		cpuType = cpu.Name
		cores = cpu.NumberOfCores
		speed = round(float(cpu.MaxClockSpeed) / 1000, 1)

	cpuInfo = {"type": str(cpuType), "numCores": int(cores), "speed": str(speed)}

	return cpuInfo

#initialize the return object and store the queried values
returnedObject = {}
returnedObject["host"] = getHostName()
returnedObject["cpu"] = getCPUInfo()

#return by dumping a json string back to the JS script (collectData.js)
print json.dumps(returnedObject)