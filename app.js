$(document).ready(function() {

var dataset = null;
function loadData() {
  var xmlhttp;
  if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
    xmlhttp = new XMLHttpRequest();
  } else {// code for IE6, IE5
    xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
  }
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState==4 && xmlhttp.status==200) {
      dataset = JSON.parse(xmlhttp.responseText);
    }
  };
  xmlhttp.open("GET","population_1040712.json",true);
  xmlhttp.send();
}

function genInfoWindowContent(dataName) {
  if (!dataset) return;
  if (dataset.data.body.districts.indexOf(dataName) < 0) return;

  var out = '<b>' + dataName + '</b>';
  var stats = dataset.data.body.stats;
  for (var cat in stats) {
    var r = stats[cat];
    out += '<ul>'+cat;
    for (var prop in r[dataName]) {
      var v = r[dataName][prop];
      out += '<li>' + prop + ': ' + v + '</li>';
    }
    out += '</ul>';
  }

  return out;
}

var map;
function initialize() {
  loadData();

  // Create a simple map.
  map = new google.maps.Map(document.getElementById('map-canvas'), {
    zoom: 12,
    center: { lat: 25.08, lng: 121.55 },
    disableDefaultUI: true
  });
  
  var xmlhttp;
  if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
    xmlhttp = new XMLHttpRequest();
  } else {// code for IE6, IE5
    xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
  }
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState==4 && xmlhttp.status==200) {
      onKMLDocFetched(xmlhttp.responseXML);
    }
  };
  xmlhttp.open("GET","taipei.kml",true);
  xmlhttp.send();

  var lastInfoWindowOpened = null;
  function onKMLDocFetched(kml) {
	  var geoJson = toGeoJSON.kml(kml);
	  // Load a GeoJSON from the same server as our demo.
	  //map.data.loadGeoJson('taipei.json');
	  map.data.addGeoJson(geoJson);
	  
	  map.data.setStyle(function(feature) {
      var color = 'gray';
      return /** @type {google.maps.Data.StyleOptions} */({
        fillColor: color,
        strokeColor: color,
        strokeWeight: 1
      });
	  })
	  
	  var clickedFeature = null;
	  map.data.addListener('click', function(event) {
	    clickedFeature = event.feature;
      map.data.overrideStyle(clickedFeature, { fillColor: 'red', strokeColor: 'red', strokeWeight: 3});
	    var dataName = event.feature.getProperty('name');
	    var contentString = genInfoWindowContent(dataName);
	    if (contentString) {
        var infoWindow = new google.maps.InfoWindow({ 
          content: contentString
        });
        infoWindow.setPosition(event.latLng);
        if (lastInfoWindowOpened) {
          lastInfoWindowOpened.close();
        }
        lastInfoWindowOpened = infoWindow;
        infoWindow.open(map);
      }
    });

	  // When the user hovers, tempt them to click by outlining the letters.
	  // Call revertStyle() to remove all overrides. This will use the style rules
	  // defined in the function passed to setStyle()
	  map.data.addListener('mouseover', function(event) {
      map.data.revertStyle();
      map.data.overrideStyle(event.feature, { strokeWeight: 3});
      map.data.overrideStyle(clickedFeature, { fillColor: 'red', strokeColor: 'red', strokeWeight: 3});
      
      var district = event.feature.getProperty('name');
      $('.pageTitle').text(district);
	  });

	  map.data.addListener('mouseout', function(event) {
      map.data.revertStyle();
      map.data.overrideStyle(clickedFeature, { fillColor: 'red', strokeColor: 'red', strokeWeight: 3});
	  });
  };
}

google.maps.event.addDomListener(window, 'load', initialize);

$(".button-collapse").sideNav();
});
