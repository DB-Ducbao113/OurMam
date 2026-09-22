const fs = require('fs');
const files = [
  'src/components/modals.js',
  'src/components/locketFeed.js',
  'src/main.js'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Remove backslash before $ in ${
  content = content.replace(/\\\$\{/g, '${');
  // Remove backslash before backtick
  content = content.replace(/\\`/g, '`');
  fs.writeFileSync(file, content);
  console.log('Fixed', file);
});
