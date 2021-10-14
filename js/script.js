var metaDataF;
var stationArray = [];

function metaData() { //Get the metadata from digitraffic which has all the possible station names
  var url = "https://rata.digitraffic.fi/api/v1/metadata/stations";
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET",url, true);
  xmlhttp.send();
  xmlhttp.onreadystatechange = function() {
    var correctTimeTable;
    if (xmlhttp.readyState==4 && xmlhttp.status==200){
      metaDataF = JSON.parse(xmlhttp.responseText);
      var datalistItems = "";
      for (var i = 0; i < metaDataF.length; i++) { //Go through all station names
        var nameInput = metaDataF[i].stationName;
        stationArray[i] = nameInput; //Make an array for my own use of the stations
        datalistItems += "<li onclick='getData(this)'>"+nameInput+"</li>" //Add list elements with the station names and onclick events that get return their station name
      }
      document.getElementById("datalist").innerHTML = datalistItems; //Add the list elements to the datalist search display
    }
  }
}

function returnFunction() { //Function for when the return button is pressed it hides the schedule and shows the search display again
    document.getElementById("searchDisplay").style.display = "block";
    document.getElementById("scheduleDisplay").style.display = "none";
}

document.getElementById("scheduleDisplay").style.display = "none";

  function autoCompleter(value) { //Function for autocompleting search inputs, function receives the value of the text written in the input
    var totalStations = metaDataF.length; //Amount of total stations
    document.getElementById('datalist').innerHTML = ''; //Empty suggestion list to prevent same station name to be displayed multiple times on the list and remove station names that don't match
    var inputLength = value.length; //Length of the inputted characters
      for (var i = 0; i < totalStations; i++) { //Go through all station names
          if(((stationArray[i].toLowerCase()).indexOf(value.toLowerCase()))>-1) //Check if the given characters in the same order exist in any station name
            {
              var node = document.createElement("li"); //Create element for the suggested station name
              var nameMatch = document.createTextNode(stationArray[i]); //Create text node for matching station name
              node.appendChild(nameMatch); //Add the matching station name onto the node
              node.setAttribute("onclick", "getData(this)")
              document.getElementById("datalist").appendChild(node); //Add the node onto the datalist
            }
          }
        }

  function getData(stationClick) { //Main function for displaying the schedule, function gets the value of the station name we have clicked on the search display
    var selectedStation = stationClick.innerHTML;
    var stationShort;
    for (var i = 0; i < metaDataF.length; i++) { //Go through the metadata station names
        if (metaDataF[i].stationName.toLowerCase() == selectedStation.toLowerCase()) { //Find the same station name as the one we clicked on the search dislay
          stationShort = metaDataF[i].stationShortCode; //Get the short code for the station name from metadata
        }
      }


    var url = "https://rata.digitraffic.fi/api/v1/live-trains?arrived_trains=0&arriving_trains=0&departed_trains=0&departing_trains=30&station="+stationShort; //Set the short code to the url
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET",url, true);
    xmlhttp.send();
    xmlhttp.onreadystatechange = function() {
      var correctTimeTable;
      if (xmlhttp.readyState==4 && xmlhttp.status==200){
        var sortArr = [];
        document.getElementById("searchDisplay").style.display = "none";
        document.getElementById("scheduleDisplay").style.display = "block";
        var jsonObj = JSON.parse(xmlhttp.responseText);
        var scheduleInput = "<tr><th>Juna</th><th>Lähtöaika</th><th>Raide</th><th>Pääteasema</th>"; //Set a new string to add all necessary html elements and information of the trains

        for (var i = 0; i < jsonObj.length; i++) { //Go through the whole json response
          
          var commuterID = jsonObj[i].commuterLineID; //Get the train ID for each train in the schedule
            if (commuterID == "") { //If there is no commuter ID
              commuterID = jsonObj[i].trainType + jsonObj[i].trainNumber; //Use train type and train number instead
            }

          var stationsTotal = jsonObj[i].timeTableRows.length - 1; //Get the number of total stations
          var finalStop = jsonObj[i].timeTableRows[stationsTotal].stationShortCode; //Determine the last stop using the final number of stations and get its station short code
          var finalStationName;
          for (var x = 0; x < metaDataF.length; x++) { //Go through metadata
            if (metaDataF[x].stationShortCode.toLowerCase() == finalStop.toLowerCase()) { //Look for match for the short code we have from metadata
              finalStationName = metaDataF[x].stationName; //When match is found get its full station name
            }
          }

          for (y = 0; y < jsonObj[i].timeTableRows.length; y++) { //Go through every time table in one train
            if (jsonObj[i].timeTableRows[y].stationShortCode == stationShort && jsonObj[i].timeTableRows[y].type == "DEPARTURE") { //Look for the timetable where it stops on the station we have selected and check that it is departuring
              correctTimeTable = jsonObj[i].timeTableRows[y]; //Set it as the correct timetable to use
              sortArr[i] = jsonObj[i].timeTableRows[y]; //Set to new array for sorting
              sortArr[i].finalStop = finalStationName; //Add the final station name to the same object
              sortArr[i].commuterId = commuterID; //Add the commuter id to the same object
            }
          }
        }

          sortArr.sort(function(a, b) { //Sort the trains using their scheduled time and using it to position them in the array
            if (a.scheduledTime > b.scheduledTime) {
              return 1;
            }

            if (b.scheduledTime > a.scheduledTime) {
              return -1;
            }
            if (a.scheduledTime == b.scheduledTime) {
              return 0;
            }
          });

          for(var i = 0; i < sortArr.length; i++) { //Go through the sorted objects

          var trainEstimate = new Date(sortArr[i].scheduledTime) //Get date from scheduled time of the train
          var hour = trainEstimate.getHours() //Get hours
          var minute = trainEstimate.getMinutes() //Get minutes
          if (minute < 10) { //If minutes is less than 10 add a zero so it is display for example 01
            minute = '0' + minute;
          }

        scheduleInput += "<tr><td>"+sortArr[i].commuterId+"</td>" //Add all our necessary information with html elemts to our string
        scheduleInput += "<td>"+hour+"."+minute+"</td>"
        scheduleInput += "<td>"+sortArr[i].commercialTrack+"</td>"
        scheduleInput += "<td>"+sortArr[i].finalStop+"</td>"
        scheduleInput += "</tr>"

        document.getElementById("scheduleTable").innerHTML = scheduleInput; //Set the string as the new inner html of the schedule table element
      }
    }
  }
}