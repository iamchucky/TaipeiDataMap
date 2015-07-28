var fs = require('fs');
var lines = fs.readFileSync('1999_processed.txt', 'utf8').split('\n');

var out = {};
//var justaddress = '';
var stats = {};
var types = [];
for (var i = 1; i < lines.length; ++i) {
  if (!lines[i]) continue;
  var r = lines[i].split('\t');

  var district = r[3];
  var village = r[4];

  if (types.indexOf(r[1]) < 0) {
    types.push(r[1]);
  }
  if (stats[district] === undefined) {
    stats[district] = {};
  }
  if (village && stats[village] === undefined) {
    stats[village] = {};
  }

  var d = new Date(r[1]);
  out[r[0]] = {
    type: r[1],
    time: d,
    district: district,
  };
  if (village) {
    out[r[0]].village = village;
  }
}
for (var district in stats) {
  for (var i = 0; i < types.length; ++i) {
    stats[district][types[i]] = 0;
  }
}

for (var id in out) {
  var r = out[id];
  stats[r.district][r.type] += 1;
  if (r.village) {
    stats[r.village][r.type] += 1;
  }
}

// convert to just arrays under districts
for (var district in stats) {
  var tArray = [];
  for (var i = 0; i < types.length; ++i) {
    tArray.push(stats[district][types[i]]);
  }
  stats[district] = tArray;
}

var statsOut = {
  lastModified: new Date().toJSON(),
  license: 'CC0',
  source: '臺北市資訊局',
  data: {
    metadata: {
      title: '1999通報',
      notes: '',
      hasVillage: true
    },
    body: {
      categories: '總',
      categoriesWithChart: ['總'],
      properties: { '總': types },
      stats: { '總': stats }
    }
  }
};

fs.writeFileSync('data.json', JSON.stringify(statsOut));
fs.writeFileSync('data_human.json', JSON.stringify(statsOut, null, 2));

