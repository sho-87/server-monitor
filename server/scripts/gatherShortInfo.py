#imports
import psutil
import wmi
import time
import datetime
import json

#create the WMI object to be queried
c = wmi.WMI()

#function to convert time to unixtime
def toUnixTime(tempTime):
    year = tempTime[:4]
    month = tempTime[4:6]
    day = tempTime[6:8]
    hour = tempTime[8:10]
    min = tempTime[10:12]
    sec = tempTime[12:14]

    timeString = year + "/" + month + "/" + \
        day + "/" + hour + "/" + min + "/" + sec

    unixTime = time.mktime(
        datetime.datetime.strptime(timeString, "%Y/%m/%d/%H/%M/%S").timetuple())

    return unixTime

#get current system uptime
def getSystemUptime():
    for os in c.Win32_OperatingSystem():
        bootTime = toUnixTime(os.LastBootUpTime)

    currentTime = int(time.time())

    upTime = currentTime - bootTime

    minutes, seconds = divmod(upTime, 60)
    hours, minutes = divmod(minutes, 60)
    days, hours = divmod(hours, 24)
    weeks, days = divmod(days, 7)

    return {"weeks": weeks, "days": days, "hours": hours, "minutes": minutes, "seconds": seconds}

#get current cpu time
def getCPUTime():
    cpuTime = {}

    query = c.query(
        "select Name, PercentProcessorTime from Win32_PerfFormattedData_PerfOS_Processor")

    for cpu in query:
        cpuTime[str("cpu"+cpu.Name)] = int(cpu.PercentProcessorTime)

    return cpuTime

#get current RAM usage
def getMemory():
    memory = psutil.virtual_memory()

    return {"total": memory[0], "available": memory[1], "used": memory[3], "percentUsed": memory[2]}

#get current hard drive space usage and IO, for all drives
def getDrives():
    diskUsage = []
    diskDict = {}

    drivePartitions = psutil.disk_partitions()

    #loop over all drives, check disk space usage
    for i in range(len(drivePartitions)):
        # cache disk usage data, in loop
        diskUsage.append(psutil.disk_usage(drivePartitions[i][1]))

        temp = {}
        temp["device"] = drivePartitions[i][0]
        temp["filesystem"] = drivePartitions[i][2]
        temp["total"] = diskUsage[i][0]
        temp["used"] = diskUsage[i][1]
        temp["free"] = diskUsage[i][2]
        temp["percent"] = diskUsage[i][3]

        diskDict[temp["device"][0]] = temp

    #check disk IO
    query = c.query(
        "select DiskBytesPerSec, Name from Win32_PerfFormattedData_PerfDisk_PhysicalDisk")

    for disk in query:
        if disk.Name != "_Total":
            driveLetter = disk.Name.split(" ")[1][0]
            currentUse = disk.DiskBytesPerSec

            diskDict[driveLetter]["io"] = int(currentUse)

    return diskDict

#get a list of all running processes
def getProcesses():
    processes = []

    query = c.query(
        "select Name, IDProcess, PercentProcessorTime, WorkingSet from Win32_PerfFormattedData_PerfProc_Process where PercentProcessorTime != '0' and Name != '_Total' and Name != 'Idle'")

    for process in query:
        temp = {}
        temp["pid"] = int(process.IDProcess)
        temp["name"] = str(process.Name)
        temp["cpu"] = int(process.PercentProcessorTime)
        temp["memory"] = int(process.WorkingSet)

        processes.append(temp)

    return processes

#specify a list of services that should be running, check that they're up
def getServices():
    runningProcesses = []
    nonRunningProcesses = []

    # list of services that should be running
    shouldBeRunning = ['CouchPotato', 'NzbDrone.Console',
                       'openvpn', 'openvpn-gui', 'Plex Media Server']

    queryString = "select Name from Win32_PerfFormattedData_PerfProc_Process where "

    for i in range(len(shouldBeRunning)):
        if i != len(shouldBeRunning)-1:
            queryString += "Name = '" + shouldBeRunning[i] + "' or "
        else:
            queryString += "Name = '" + shouldBeRunning[i] + "'"

    query = c.query(queryString)

    for process in query:
        runningProcesses.append(str(process.Name))

    for el in shouldBeRunning:
        if el not in runningProcesses:
            nonRunningProcesses.append(el)

    #return a dictionary containing both running and non-running services (from the list above)
    return {"running": runningProcesses, "nonRunning": nonRunningProcesses}

#initialize the return object and store the queried values
returnedObject = {}
returnedObject["uptime"] = getSystemUptime()
returnedObject["cpuUsage"] = getCPUTime()
returnedObject["memory"] = getMemory()
returnedObject["drives"] = getDrives()
returnedObject["processes"] = getProcesses()
returnedObject["services"] = getServices()
returnedObject["timeCollected"] = int(time.time())

#return by dumping a json string back to the JS script (collectData.js)
print json.dumps(returnedObject)