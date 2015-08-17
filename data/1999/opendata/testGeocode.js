var webpage = require('webpage');
var page = webpage.create();
var fs = require('fs');
var system = require('system');
var addresses = fs.read('uniqueAdd.txt').split('\n');

var curInd = parseInt(system.args[1]);
var sleep = 300;

function onConsoleMsg(msg) {
  var geocoded = addresses[curInd] + '\t' + msg;
  console.log(curInd + ' ' + msg);

  if (msg.indexOf('OVER_QUERY_LIMIT') == 0) {
    page.close();
    page = webpage.create();
    page.onConsoleMessage = onConsoleMsg;
    page.open('http://localhost/geocode.html', function(status) {
      doNext();
    });
  } else {
    addresses[curInd] = geocoded;
    curInd += 1;

    if (curInd % 50 == 0) {
      fs.write('geocoded.txt', addresses.join('\n'));
    }

    if (curInd < addresses.length) {
      setTimeout(doNext, sleep);
    } else {
      fs.write('geocoded.txt', addresses.join('\n'));
      phantom.exit();
    }
  }
};

page.onConsoleMessage = onConsoleMsg;

function doNext() {
  page.evaluate(function(address) {
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode( { 'address': address}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        console.log(results[0].geometry.location);
      } else {
        console.log(status);
      }
    });
  }, addresses[curInd]);
}

page.open('http://localhost/geocode.html', function(status) {
  if (status == 'success') {
    doNext();
  } else {
    console.log('failed loading geocode.html');
  }
});
