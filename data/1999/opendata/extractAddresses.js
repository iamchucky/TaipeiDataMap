var fs = require('fs');
var lines = fs.readFileSync('case1999-opendata-150805.csv', 'utf8').split('\n');

var out = {};
var noaddress = {};
var count = 0;
var types = [];
var seenAddress = {};
var uniqueAddress = [];
for (var i = 0; i < lines.length; ++i) {
  if (!lines[i]) continue;
  var r = lines[i].split(',');
  var regex = /((?:松山|信義|大安|中山|中正|大同|萬華|文山|南港|內湖|士林|北投)區)((?:\S+?巷)?(?:\S+?弄)?(?:\S+?號)?)/g;
  var result = regex.exec(r[2]);
  var district = '';
  var add = '';
  if (result && result.length == 3) {
    district = result[1];
    add = result[2];

    if (types.indexOf(r[1]) < 0) {
      types.push(r[1]);
    }

    var fullAddress = '台北市' + district + add;
    if (add && seenAddress[fullAddress] === undefined) {
      seenAddress[fullAddress] = true;
      uniqueAddress.push(fullAddress);
    }

    var d = new Date(r[3]);
    out[r[0]] = {
      type: r[1],
      time: new Date(d.getTime() - 8*3600000),
      district: district,
      address: add
    };
    if (add) {
      count += 1;
    }
  } else {
    noaddress[r[0]] = {
      type: r[1],
      str: lines[i]
    }
  }
}

fs.writeFileSync('noaddress.json', JSON.stringify(noaddress, null, 2));
fs.writeFileSync('uniqueAdd.txt', uniqueAddress.join('\n'));

console.log('counted '+count);
