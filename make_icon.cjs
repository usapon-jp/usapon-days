const fs = require('fs');
const b64 = fs.readFileSync('public/assets/usa.png').toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" ry="112" fill="#E8F4EC" />
  <image href="data:image/png;base64,${b64}" x="80" y="32" width="352" height="352" />
  <text x="256" y="440" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="56" fill="#888888" text-anchor="middle" letter-spacing="1">UsaponDays</text>
</svg>`;
fs.writeFileSync('public/assets/usapon_icon_b64.svg', svg);
