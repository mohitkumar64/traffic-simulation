const fs = require('fs');
const buffer = fs.readFileSync('public/models/low_poly_cars.glb');
const chunkLength = buffer.readUInt32LE(12);
const jsonBuf = buffer.slice(20, 20 + chunkLength);
const json = JSON.parse(jsonBuf.toString('utf8'));

for(let i=0; i<3; i++) {
   const node = json.nodes[i];
   console.log('Node', i, node.name);
   if (node.matrix) console.log(`  matrix:`, node.matrix);
}
