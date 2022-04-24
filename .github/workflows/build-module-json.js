var fs = require('fs');

const version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;

var mod = JSON.parse(fs.readFileSync('module-template.json', 'utf8'));

mod.version = version;
mod.download = `https://github.com/mrprimate/GritNGlory/releases/download/${version}/GritNGlory.zip`;

console.log(JSON.stringify(mod));
