var xls = require('xlsjs');
var fs = require('fs');

if (process.argv.length != 4) {
  console.log('Usage: node xlsToJson.js [inFile] [outFile]');
  process.exit(-1);
}

var inFile = process.argv[2];
var outFile = process.argv[3];
var wb = xls.readFile(inFile);

var out = {
  lastModified: new Date().toJSON(),
  license: 'CC0',
  source: '臺北市資訊局',
  data: {
    metadata: {
      title: '公司及商業登記家數統計',
      notes: '',
      hasVillage: false
    },
    body: {
      categories: wb.SheetNames,
      categoriesWithChart: [],
      properties: {},
      stats: {}
    }
  }
};


for (var sn in wb.Sheets) {
  if (!out.data.body.properties[sn]) {
    out.data.body.properties[sn] = [];
  }

  if (sn != '總') {
    out.data.body.categoriesWithChart.push(sn);
  }
  var ws = wb.Sheets[sn];
  var wsJson = xls.utils.sheet_to_json(ws, { raw: true });

  for (var i = 0; i < wsJson.length; ++i) {
    var r = wsJson[i];

    var d = r['行政區'];

    if (!out.data.body.stats[sn]) {
      out.data.body.stats[sn] = {};
    }
    if (!out.data.body.stats[sn][d]) {
      out.data.body.stats[sn][d] = {};
    }
    
    for (var prop in r) {
      if (prop == 'undefined') continue;
      if (prop == '行政區') continue;

      out.data.body.stats[sn][d][prop] = r[prop];

      if (i == 0) {
        out.data.body.properties[sn].push(prop);
      }
    }
  }
}

fs.writeFileSync(outFile, JSON.stringify(out, undefined, 2));
