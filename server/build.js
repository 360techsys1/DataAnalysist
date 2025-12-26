import { mkdirSync, writeFileSync } from 'fs';
mkdirSync('dist', { recursive: true });
writeFileSync('dist/.vercel.json', '{}');
console.log('Build completed');

