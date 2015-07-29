var xls = require('xlsjs');
var fs = require('fs');

if (process.argv.length != 3) {
  console.log('Usage: node xlsToJson.js [inFile]');
  process.exit(-1);
}

var inFile = process.argv[2];
var wb = xls.readFile(inFile);

var out = {
  lastModified: new Date().toJSON(),
  license: 'CC0',
  source: '臺北市資訊局',
  data: {
    metadata: {
      title: '社會福利',
      notes: '',
      raw: 'https://docs.google.com/spreadsheets/d/12PJicXFxkvzI1__t9YAGIqJXbxRDBxn9el7fVSWVR_0',
      hasVillage: true
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
      out.data.body.stats[sn][d] = [];
    }
    
    for (var prop in r) {
      if (prop == '行政區') continue;

      out.data.body.stats[sn][d].push(r[prop]);

      if (i == 0) {
        out.data.body.properties[sn].push(prop);
      }
    }
  }
}

fs.writeFileSync('data.json', JSON.stringify(out));
fs.writeFileSync('data_human.json', JSON.stringify(out, undefined, 2));
