// Note: This example requires that you consent to location sharing when
// prompted by your browser. If you see the error "The Geolocation service
// failed.", it means you probably did not give permission for the browser to
// locate you.

// Script variables
var map, infoWindow, center, service;
// Store list of coffee shops in array
var coffeeShops = [];
// Store day of the week to retrieve store business hours
var day = new Date().getDay() - 1;
// Store markers by type
var markerGroups = {
  "cafe": [],
  "restaurant": [],
  "gas_station": []
};
//List of fast food locaiton with coffee
var fastFood = [

];

// Script to set center of map
function calculateCenter() {
  center = map.getCenter();
}

function initMap() {
  // Default pos value is Athens, GA
  var pos = {lat: 33.9519347, lng: -83.357567};

  // Initialize map
  map = new google.maps.Map(document.getElementById('map'), {
    center: pos,
    zoom: 13
  });

  // Try HTML5 geolocation.
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

    // Place marker in user's current location
  	var userMarker = new google.maps.Marker({
  		map: map,
  		animation: google.maps.Animation.DROP,
  		position: pos
  	});
    
    // Resize event listeners after finding user location
    google.maps.event.addDomListener(map, 'idle', function() {
      calculateCenter();
    });
    google.maps.event.addDomListener(window, 'resize', function() {
      map.setCenter(center);
    });

    // Center map to user location
    map.setCenter(pos);

    // Search query
    // 20 mile (32186.9 meter) search radius around user location for coffee shops
    var request = {
      location: pos,
      radius: '32186.9',
      query: '(coffee)'
    };

    infoWindow = new google.maps.InfoWindow();
    service = new google.maps.places.PlacesService(map);
    service.textSearch(request, callback);
    }, function() {
      handleLocationError(true, infoWindow, map.getCenter());
    });
  } else {
    // Browser doesn't support geolocation
    handleLocationError(false, infoWindow, map.getCenter());
  }
}

// Script to handle geolocation error
function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(browserHasGeolocation ?
                        'Error: The Geolocation service failed.' :
                        'Error: Your browser doesn\'t support geolocation.');
  infoWindow.open(map);
}

// Function to request next page of results
function nextPage() {
    service.textSearch(request, callback, pagnation);
}

// Search
function callback(results, status, pagnation) {
    console.log(results.length);
    console.log(results);
    if (status === google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {

            // Using setTimeout and closure because limit of 10 queries /second for getDetails */
            (function (j) {
                var request = {
                    placeId: results[i]['place_id']
                };

                service = new google.maps.places.PlacesService(map);
                setTimeout(function() {
                    service.getDetails(request, callback);
                }, j*1000);


            })(i);

            function callback(place, status) {
                if (status == google.maps.places.PlacesServiceStatus.OK) {
                    createMarker(place);
                    console.log(place.name +  results.length + coffeeShops.length);
                    coffeeShops.push([place.name, place.website, place.rating, place.opening_hours.weekday_text[day], place.url, place.types]);

                    if(results.length == coffeeShops.length){
                        console.log(coffeeShops);
                        var request = new XMLHttpRequest();
                        request.open('POST', 'http://localhost/agency-map/src/save.php', true);
                        request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
                        request.send(JSON.stringify(coffeeShops));
                    }
                }
            }
        }
    }

    // If there were more than 20 results, request next page
    if(pagnation.hasNextPage) {
      //sleep: 2;
      pagnation.nextPage();
    }
  }

  // Toggles visibility of select marker group
  function toggleGroup(type) {
    for (var i = 0; i < markerGroups[type].length; i++) {
        // alert(markerGroups[type][i]);
        var marker = markerGroups[type][i];
        if (!marker.getVisible()) {
            marker.setVisible(true);
        } else {
            marker.setVisible(false);
        }
    }
  }

  // Creates a marker with an infowindow to display shop info
  function createMarker(place) {
    var image = "images/coffee.png";
    var placeLoc = place.geometry.location;
    var marker = new google.maps.Marker({
      map: map,
      icon: image,
      type: place.types,
      position: place.geometry.location,
      animation: google.maps.Animation.DROP
    });
    google.maps.event.addListener(marker, 'click', function() {
      infoWindow.setContent("<b>" + place.types + '</b><br><a href="' + place.website + '"" target="new">' + place.website + "</a><br>" + place.opening_hours.weekday_text[day] + '<br><a href="' + place.url + '"" target="new">Navigate</a><br>');
      infoWindow.open(map, this);
    });

    // Place marker in corresponding marker group
    var markerType = marker.type;

    // Fast food or restaurant
    if(markerType.includes("restaurant")) {
        markerGroups["restaurant"].push(marker);
        return;
    }
    // Gas station
    if(markerType.includes("gas_station")) {
        markerGroups["gas_station"].push(marker);
        return;
    }
    // Traditional coffee shop (local shop, starbucks, jittery joes, etc)
    if(markerType.includes("cafe")) {
        markerGroups["cafe"].push(marker);
    }
  }