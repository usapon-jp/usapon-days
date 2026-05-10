const fs = require('fs');
const b64 = fs.readFileSync('public/assets/usa.png').toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#E8F4EC" />
  <image href="data:image/png;base64,${b64}" x="16" y="16" width="480" height="480" />
  <text x="256" y="484" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="64" fill="#888888" text-anchor="middle" letter-spacing="1">UsaponDays</text>
</svg>`;
fs.writeFileSync('public/assets/usapon_icon_b64.svg', svg);
