const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.jsx')) results.push(file);
    }
  });
  return results;
}

const files = walk('c:/Users/grego/Desktop/Proyectos/G04ProyectoTutoria/frontend/src/pages');
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('localStorage.getItem(\'user\')') || content.includes('localStorage.getItem(\"user\")')) {
    content = content.replace(/localStorage\.getItem\(['"]user['"]\)/g, 'sessionStorage.getItem(\'user\')');
    fs.writeFileSync(f, content, 'utf8');
    console.log('Updated ' + f);
  }
});
