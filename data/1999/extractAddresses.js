var fs = require('fs');
var lines = fs.readFileSync('1999.txt', 'utf8').split('\n');

var out = {};
var noaddress = {};
var count = 0;
//var justaddress = '';
var stats = {};
var types = [];
var seenAddress = {};
var uniqueAddress = [];
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
    if (add && seenAddress[fullAddress] === undefined) {
      seenAddress[fullAddress] = true;
      uniqueAddress.push(fullAddress);
    }

    var d = new Date(r[1]);
    out[r[0]] = {
      type: r[2],
      time: new Date(d.getTime() - 8*3600000),
      district: district,
      address: add
    };
    if (add) {
      count += 1;
 //     justaddress += r[0] + '\t台北市' + district+add + '\n';
    }
  } else {
    noaddress[r[0]] = {
      type: r[2],
      str: lines[i]
    }
  }
}
for (var district in stats) {
  for (var i = 0; i < types.length; ++i) {
    stats[district][types[i]] = 0;
  }
}

for (var id in out) {
  stats[out[id].district][out[id].type] += 1;
}

var statsOut = {
  lastModified: new Date().toJSON(),
  license: 'CC0',
  source: '臺北市資訊局',
  data: {
    metadata: {
      title: '1999通報',
      notes: '',
      hasVillage: false
    },
    body: {
      categories: '總',
      categoriesWithChart: ['總'],
      properties: { '總': types },
      stats: { '總': stats }
    }
  }
};

fs.writeFileSync('1999.json', JSON.stringify(out, null, 2));
fs.writeFileSync('noaddress.json', JSON.stringify(noaddress, null, 2));
fs.writeFileSync('uniqueAdd.txt', uniqueAddress.join('\n'));
//fs.writeFileSync('justaddress.txt', justaddress);
fs.writeFileSync('data.json', JSON.stringify(statsOut, null, 2));

console.log('counted '+count);
