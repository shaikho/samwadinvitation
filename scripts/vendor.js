// Copies browser bundles from node_modules into public/vendor (Vercel doesn't serve node_modules).
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, 'public', 'vendor');
fs.mkdirSync(out, { recursive: true });

const bundles = [
  ['node_modules/motion/dist/motion.js', 'motion.js'],
  ['node_modules/lenis/dist/lenis.min.js', 'lenis.min.js'],
];
for (const [from, to] of bundles) {
  const src = fs.readFileSync(path.join(root, from), 'utf8').replace(/\n\/\/# sourceMappingURL=.*\s*$/, '\n');
  fs.writeFileSync(path.join(out, to), src);
  console.log(`vendor/${to}`);
}
