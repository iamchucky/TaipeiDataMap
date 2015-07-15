var map;
function initialize() {
  // Create a simple map.
  map = new google.maps.Map(document.getElementById('map-canvas'), {
    zoom: 12,
    center: {lat: 25.08, lng: 121.55}
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
	  
	  // When the user hovers, tempt them to click by outlining the letters.
	  // Call revertStyle() to remove all overrides. This will use the style rules
	  // defined in the function passed to setStyle()
	  map.data.addListener('mouseover', function(event) {
      map.data.revertStyle();
      map.data.overrideStyle(event.feature, { fillColor: 'red', strokeColor: 'red', strokeWeight: 3});
      
      var district = event.feature.getProperty('name');
      var elem = document.getElementById('district-text');
      if (elem) {
        elem.textContent = district;
      }
	  });

	  map.data.addListener('mouseout', function(event) {
      map.data.revertStyle();
	  });
  };
}

google.maps.event.addDomListener(window, 'load', initialize);

