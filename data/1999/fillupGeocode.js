var fs = require('fs');
var lines = fs.readFileSync('1999.txt', 'utf8').split('\n');

var geocodedLines = fs.readFileSync('geocoded_withVillage.txt', 'utf8').split('\n');
var geocoded = {};
for (var i = 0; i < geocodedLines.length; ++i) {
  if (!geocodedLines[i]) continue;
  var r = geocodedLines[i].split('\t');
  if (r[1] == 'ZERO_RESULTS') continue;

  var geoSplit = r[1].replace(/[()]/g, '').split(', ');
  geocoded[r[0]] = {
    lat: geoSplit[0],
    lng: geoSplit[1]
  };
  if (r[2]) {
    geocoded[r[0]].vil = r[2];
  }
}


var out = 'id\ttype\ttime\tdistrict\tvillage\taddress\tlatitude\tlongitude\n';
var stats = {};
var types = [];
for (var i = 0; i < lines.length; ++i) {
  if (!lines[i]) continue;
  var r = lines[i].split('\t');
  var regex = /((?:松山|信義|大安|中山|中正|大同|萬華|文山|南港|內湖|士林|北投)區)((?:\S+?巷)?(?:\S+?弄)?(?:\S+?號)?)/g;
  var result = regex.exec(lines[i].replace(/\t/g,''));
  var district = '';
  var add = '';
  if (result && result.length == 3) {
    district = result[1];
    add = result[2];

    if (types.indexOf(r[2]) < 0) {
      types.push(r[2]);
    }
    if (stats[district] === undefined) {
      stats[district] = {};
    }

    var fullAddress = '台北市' + district + add;

    var d = new Date(r[1]);
    var time = (new Date(d.getTime() - 8*3600000)).toJSON();
    var lat = '';
    var lng = '';
    var address = '';
    var village = '';
    
    if (geocoded[fullAddress]) {
      lat = geocoded[fullAddress].lat;
      lng = geocoded[fullAddress].lng;
    }
    if (add) {
      address = add;
    }
    if (geocoded[fullAddress]) {
      village = geocoded[fullAddress].vil;
    }
    var row = [ r[0], r[2], time, district, village, address, lat, lng ].join('\t');
    out += row + '\n';

  }
}

fs.writeFileSync('1999_processed.txt', out);
