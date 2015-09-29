#imports
import wmi
import urllib2
import json
import time

#create the WMI object to be queried
c = wmi.WMI()

#get network adapter names, IP, and gateway address
def getNetworkIO():
	networkDevices = {}

	#get internal ip and default gateway
	query = c.query( "select IPAddress, DefaultIPGateway from Win32_NetworkAdapterConfiguration where IPEnabled=TRUE" )
	
	for i, eth in enumerate(query):
		temp = {}
		temp["ip"] = (str(eth.IPAddress[0]))

		if eth.DefaultIPGateway:
			temp["gateway"] = (str(eth.DefaultIPGateway[0]))
		else:
			temp["gateway"] = ("NA")

		networkDevices["adapter"+str(i)] = temp

	#get adapter name
	queryNetworkDevices = c.query( "select NetConnectionID from Win32_NetworkAdapter where NetEnabled=TRUE" )

	for i, eth in enumerate(queryNetworkDevices):
		networkDevices["adapter"+str(i)]["name"] = str(eth.NetConnectionID)

	return networkDevices

#get public IP address
def getPublicIP():
	publicIP = urllib2.urlopen('http://ip.42.pl/raw').read()

	publicIP = {"ip": publicIP}

	return publicIP

#get hard drive SMART status
def getSmart():
	driveStatus = {}

	queryDrives = c.query( "select Model, Status from Win32_DiskDrive")

	for i, drive in enumerate(queryDrives):
		driveStatus["drive"+str(i)] = {"model": str(drive.Model), "status": str(drive.Status)}

	return driveStatus

#initialize the return object and store the queried values
returnedObject = {}
returnedObject["networkDevices"] = getNetworkIO()
returnedObject["publicIP"] = getPublicIP()
returnedObject["driveStatus"] = getSmart()

#return by dumping a json string back to the JS script (collectData.js)
print json.dumps(returnedObject)