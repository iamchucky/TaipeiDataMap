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

  var d = new Date(r[2]);
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
  stats[district] = [];
  for (var i = 0; i < types.length; ++i) {
    stats[district].push(Array.apply(null, new Array(13)).map(Number.prototype.valueOf,0));
  }
}

for (var id in out) {
  var r = out[id];
  var typeInd = types.indexOf(r.type);
  stats[r.district][typeInd][0] += 1;

  var month = (new Date(r.time.getTime() + 8*3600000)).getMonth()+1;
  stats[r.district][typeInd][month] += 1;

  if (r.village) {
    stats[r.village][typeInd][0] += 1;
    stats[r.village][typeInd][month] += 1;
  }
}

var statsOut = {
  lastModified: new Date().toJSON(),
  license: 'CC0',
  source: '臺北市資訊局',
  data: {
    metadata: {
      title: '1999通報',
      notes: '',
      raw: 'https://www.google.com/fusiontables/data?docid=1o7BPfxOIHF2RMxRaa9HF25uIPh8rfBRToTto2tl3',
      hasVillage: true,
      hasTime: true
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

