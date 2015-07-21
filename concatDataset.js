var fs = require('fs');

if (process.argv.length != 4) {
  console.log('Usage: node concatDataset.js [inFile] [outFile]');
  process.exit(-1);
}

var inFile = process.argv[2];
var outFile = process.argv[3];

var out = {};

var inFiles = fs.readFileSync(inFile, 'utf8').split('\n');
for (var i = 0; i < inFiles.length; ++i) {
  var r = inFiles[i];
  if (!r) continue;

  var json = JSON.parse(fs.readFileSync(r, 'utf8'));
  var title = json.data.metadata.title;
  out[title] = json;
}

fs.writeFileSync(outFile, JSON.stringify(out, undefined, 2));
