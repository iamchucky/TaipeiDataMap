var fs = require('fs');

var lines = fs.readFileSync('pop.csv', 'utf8').split('\n');
var out = {};
var district = '';

for (var i = 0; i < lines.length-1; ++i) {
  if (!lines[i]) continue;

  var l = lines[i].replace('\r','');
  var r = l.split(',');
  var name = r[0];
  var val = parseInt(r[1]);
  
  var isVillage = (name.indexOf('區') < 0);
  if (isVillage) {
    name = district + name;
  } else {
    district = name;
  }

  out[name] = val;
}

fs.writeFileSync('population.json', JSON.stringify(out, null, 2));
