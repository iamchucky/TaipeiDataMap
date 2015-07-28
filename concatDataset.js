var fs = require('fs');

var inFile = 'dataset.txt'; //process.argv[2];

var out = {};

var inFiles = fs.readFileSync(inFile, 'utf8').split('\n');
for (var i = 0; i < inFiles.length; ++i) {
  var r = inFiles[i];
  if (!r) continue;

  var json = JSON.parse(fs.readFileSync(r, 'utf8'));
  var title = json.data.metadata.title;
  out[title] = json;
}

fs.writeFileSync('dataset.json', JSON.stringify(out));
fs.writeFileSync('dataset_human.json', JSON.stringify(out, undefined, 2));
