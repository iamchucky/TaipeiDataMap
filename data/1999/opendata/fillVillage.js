var fs = require('fs');
var webpage = require('webpage');
var page = webpage.create();

var lines = [];

page.onConsoleMessage = function(msg) {
  if (msg === 'done') {
    fs.write('geocoded_withVillage.txt', lines.join('\n'));
    phantom.exit();
    return;
  } else if (msg.indexOf('console: ') == 0) {
    console.log(msg);
    return;
  }

  lines.push(msg);
  if (lines.length % 500 == 0) {
    fs.write('geocoded_withVillage.txt', lines.join('\n'));
    console.log(lines.length);
  }
};

function ajax(method, url, callback, payload) {
  var xmlhttp;
  if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
    xmlhttp = new XMLHttpRequest();
  } else {// code for IE6, IE5
    xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
  }
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState==4 && xmlhttp.status==200) {
      if (callback) {
        callback(xmlhttp);
      }
    }
  };
  xmlhttp.open(method, url, true);
  xmlhttp.send();
}

function doNext() {
  page.evaluate(function() {
    console.log('console: start evaulate');

    var map;
    // Create a simple map.
    map = new google.maps.Map(document.getElementById('map-canvas'), {
      zoom: 12,
      center: { lat: 25.08, lng: 121.55 },
      disableDefaultUI: true
    });

    console.log('console: now get village kml');

    ajax('GET', 'villages.kml', function(xmlhttp) {
      var g = toGeoJSON.kml(xmlhttp.responseXML);
      var polys = [];
      var polysDis = {};
      for (var i = 0; i < g.features.length; ++i) {
        var r = g.features[i];
        var vert = r.geometry.coordinates[0];
        var coords = [];
        for (var j = 0; j < vert.length; ++j) {
          var l = new google.maps.LatLng(vert[j][1], vert[j][0]);
          coords.push(l);
        }

        var poly = new google.maps.Polygon({ paths: coords });
        var pObj = {
          d: r.properties.belong,
          n: r.properties.belong + r.properties.name,
          p: poly
        };
        polys.push(pObj);
        if (!polysDis[r.properties.belong]) {
          polysDis[r.properties.belong] = [];
        }
        polysDis[r.properties.belong].push(pObj);
      }
      console.log('console: constructed poly');

      ajax('GET', 'data/1999/opendata/geocoded.txt', function(xmlhttp) {
        console.log('console: loaded geocoded.txt');

        var geocoded = xmlhttp.responseText.split('\n');
        console.log('console: has lines '+geocoded.length);
        for (var i = 0; i < geocoded.length; ++i) {
          var r = geocoded[i];
          if (!r) continue;

          r = r.split('\t');
          var rn = r[0];
          if (r[1] == 'ZERO_RESULTS') {
            console.log(geocoded[i]);
            continue;
          }

          var dis = r[0].substr(3, 3);

          r = r[1].replace(/[()]/g, '').split(', ');

          var village = '';
          var latLng = new google.maps.LatLng(r[0], r[1]);

          for (var j = 0; j < polysDis[dis].length; ++j) {
            if (google.maps.geometry.poly.containsLocation(latLng, polysDis[dis][j].p)) {
              village = polysDis[dis][j].n;
              break;
            }
          }

          if (!village) {
            for (var j = 0; j < polys.length; ++j) {
              if (polys[j].d == dis) continue;

              if (google.maps.geometry.poly.containsLocation(latLng, polys[j].p)) {
                village = polys[j].n;
                break;
              }
            }
          }
          console.log(geocoded[i] + '\t' + village);

        }
        console.log('done');
      });
    });
  });
}

page.open('http://localhost/geocode.html', function(status) {
  console.log('loaded');
  if (status == 'success') {
    doNext();
  } else {
    console.log('failed loading geocode.html');
  }
});
