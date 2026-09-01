// scripts/validate-structure.js

import fs from 'fs';
import path from 'path';

const requiredDirectories = [
	'src/routes',
	'src/lib/components',
	'src/lib/features',
	'src/lib/services',
	'src/lib/utils'
];

const optionalRecommendedDirectories = ['src/lib/stores', 'src/lib/types', 'src/lib/constants'];

let hasErrors = false;

console.log('🔍 Validating project structure...\n');

requiredDirectories.forEach((dir) => {
	const fullPath = path.resolve(dir);

	if (!fs.existsSync(fullPath)) {
		console.error(`❌ Missing required directory: ${dir}`);
		hasErrors = true;
	} else {
		console.log(`✅ ${dir}`);
	}
});

console.log('\n📦 Recommended directories');

optionalRecommendedDirectories.forEach((dir) => {
	const fullPath = path.resolve(dir);

	if (!fs.existsSync(fullPath)) {
		console.warn(`⚠️  Recommended: ${dir}`);
	} else {
		console.log(`✅ ${dir}`);
	}
});

if (hasErrors) {
	console.error('\n🚨 Structure validation failed');
	process.exit(1);
}

console.log('\n🎉 Structure validation passed');
process.exit(0);
