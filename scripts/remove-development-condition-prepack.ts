import fs from 'fs';

const filePath = 'package.json';
const packageJson = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
if (
  !(
    packageJson &&
    typeof packageJson === 'object' &&
    'exports' in packageJson &&
    packageJson.exports &&
    typeof packageJson.exports === 'object'
  )
) {
  throw new Error('package.json file does not contain exports object');
}

// Remove "development" condition from each entry in exports
packageJson.exports = Object.fromEntries(
  Object.entries(packageJson.exports).map(([path, { development, ...conditions }]) => [path, conditions]),
);

fs.writeFileSync(filePath, `${JSON.stringify(packageJson, null, 2)}\n`);
