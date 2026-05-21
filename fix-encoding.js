const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public', 'data', 'species.json');

console.log('Reading file as binary to handle encoding...');
const buffer = fs.readFileSync(filePath);

// The issue: UTF-8 text was incorrectly decoded as Latin-1/Windows-1252, then re-encoded as UTF-8
// To fix: interpret the file as if it were Latin-1, then save as UTF-8

// Convert buffer from "UTF-8 incorrectly decoded as Latin-1" back to proper UTF-8
// When UTF-8 bytes (like 0xC3 0xA1 for á) are read as Latin-1, they become characters Ã¡
// To reverse this, we treat the current UTF-8 string as if it were Latin-1 bytes
const latin1Buffer = Buffer.from(buffer.toString('utf8'), 'latin1');

let fixed = latin1Buffer.toString('utf8');

// Additional cleanup for any remaining artifacts
const cleanupReplacements = [
  ['Â°', '°'],
  ['Â»', '»'],
  ['Â«', '«'],
  ['Â©', '©'],
  ['Â®', '®'],
  ['Â™', '™'],
  ['Â', ''],  // leftover control characters
];

for (const [wrong, correct] of cleanupReplacements) {
  fixed = fixed.split(wrong).join(correct);
}

// Validate JSON
try {
  const parsed = JSON.parse(fixed);
  console.log('JSON is valid');
  console.log(`Total species: ${parsed.length}`);
} catch (e) {
  console.error('WARNING: JSON may be invalid after fixes:', e.message);
}

// Write fixed content
fs.writeFileSync(filePath, fixed, 'utf8');
console.log('File encoding fixed and saved!');