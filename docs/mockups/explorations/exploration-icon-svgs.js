// ===== GASTIFY ICON CONCEPTS + SVG DEFINITIONS =====
// Piggy bank explorations in the Gustify style: bold, rounded, bubbly
// Extracted to external file to keep HTML under 800-line limit

var concepts = [
  {
    name: 'Piggy Profile',
    badge: 'Side View',
    variations: [
      { label: 'Classic', fill: 'white', detail: '#4a7c59' },
      { label: 'Bubbles', fill: 'white', detail: '#5b8fa8' },
      { label: 'Coin Drop', fill: 'white', detail: '#e8a87c' },
      { label: 'Round', fill: 'white', detail: '#4a7c59' },
      { label: 'Trotting', fill: 'white', detail: '#18181b' },
      { label: 'Plump', fill: 'white', detail: '#4a7c59' }
    ]
  },
  {
    name: 'Piggy Face',
    badge: 'Front View',
    variations: [
      { label: 'Simple', fill: 'white', detail: '#4a7c59' },
      { label: 'Wink', fill: 'white', detail: '#5b8fa8' },
      { label: 'Blush', fill: 'white', detail: '#e8a87c' },
      { label: 'Big Snout', fill: 'white', detail: '#4a7c59' },
      { label: 'Perky Ears', fill: 'white', detail: '#18181b' },
      { label: 'Sleepy', fill: 'white', detail: '#4a7c59' }
    ]
  },
  {
    name: 'Piggy Pot',
    badge: 'Gustify Style',
    variations: [
      { label: 'Pot Piggy', fill: 'white', detail: '#4a7c59' },
      { label: 'Pot + Coins', fill: 'white', detail: '#5b8fa8' },
      { label: 'Belly Circle', fill: 'white', detail: '#e8a87c' },
      { label: 'Pot Lid', fill: 'white', detail: '#4a7c59' },
      { label: 'Tall Pot', fill: 'white', detail: '#18181b' },
      { label: 'Mug Pig', fill: 'white', detail: '#4a7c59' }
    ]
  },
  {
    name: 'Piggy Symbol',
    badge: 'Iconic',
    variations: [
      { label: 'Badge', fill: 'white', detail: '#4a7c59' },
      { label: 'Silhouette', fill: 'white', detail: '#5b8fa8' },
      { label: 'Coin Split', fill: 'white', detail: '#e8a87c' },
      { label: 'Shield', fill: 'white', detail: '#4a7c59' },
      { label: 'Sparkle', fill: 'white', detail: '#18181b' },
      { label: 'G-Piggy', fill: 'white', detail: '#4a7c59' }
    ]
  },
  {
    name: 'PixelLab',
    badge: 'Pixel Art',
    variations: [
      { label: 'Receipt', fill: 'white', detail: '#4a7c59', pixellab: 'pixellab-icons/receipt-dollar.png' },
      { label: 'Wallet', fill: 'white', detail: '#5b8fa8', pixellab: 'pixellab-icons/wallet-green.png' },
      { label: 'Scan', fill: 'white', detail: '#e8a87c', pixellab: 'pixellab-icons/scan-receipt.png' },
      { label: 'Peso Coin', fill: 'white', detail: '#4a7c59', pixellab: 'pixellab-icons/peso-coin.png' },
      { label: 'Growth Chart', fill: '#4a7c59', detail: '#18181b', pixellab: 'pixellab-icons/chart-growth.png' },
      { label: 'Credit Card', fill: 'white', detail: '#4a7c59', pixellab: 'pixellab-icons/credit-card.png' }
    ]
  },
  {
    name: 'PixelLab 2',
    badge: 'Pixel Art',
    variations: [
      { label: 'Piggy Bank', fill: 'white', detail: '#4a7c59', pixellab: 'pixellab-icons/piggy-bank.png' },
      { label: 'Calculator', fill: 'white', detail: '#5b8fa8', pixellab: 'pixellab-icons/calculator.png' },
      { label: 'Shopping Cart', fill: 'white', detail: '#e8a87c', pixellab: 'pixellab-icons/shopping-cart.png' },
      { label: 'Shield Finance', fill: 'white', detail: '#4a7c59', pixellab: 'pixellab-icons/shield-finance.png' },
      { label: 'Phone Scan', fill: '#4a7c59', detail: '#18181b', pixellab: 'pixellab-icons/phone-scan.png' },
      { label: 'Treasure Chest', fill: 'white', detail: '#4a7c59', pixellab: 'pixellab-icons/treasure-chest.png' }
    ]
  },
  {
    name: 'Piggy Variations',
    badge: 'Pixel Art',
    variations: [
      { label: 'Original', fill: 'white', detail: '#4a7c59', pixellab: 'pixellab-icons/piggy-bank.png' },
      { label: 'Coin Drop', fill: 'white', detail: '#4a7c59', pixellab: 'pixellab-icons/piggy-coin-drop.png' },
      { label: 'Front View', fill: 'white', detail: '#5b8fa8', pixellab: 'pixellab-icons/piggy-front.png' },
      { label: 'Coins Stack', fill: 'white', detail: '#e8a87c', pixellab: 'pixellab-icons/piggy-coins-stack.png' },
      { label: 'Dollar Sign', fill: 'white', detail: '#4a7c59', pixellab: 'pixellab-icons/piggy-dollar.png' },
      { label: 'Green Scarf', fill: 'white', detail: '#4a7c59', pixellab: 'pixellab-icons/piggy-scarf.png' },
      { label: 'With Receipt', fill: 'white', detail: '#5b8fa8', pixellab: 'pixellab-icons/piggy-receipt.png' }
    ]
  },
  {
    name: 'Snowshoe Mascot',
    badge: 'Pixel Art',
    variations: [
      { label: 'Gold Coin', fill: 'white', detail: '#4a7c59', pixellab: 'pixellab-icons/snowshoe-v3-coin.png' },
      { label: 'Receipt', fill: 'white', detail: '#5b8fa8', pixellab: 'pixellab-icons/snowshoe-v3-receipt.png' },
      { label: 'Dollar Sign', fill: 'white', detail: '#e8a87c', pixellab: 'pixellab-icons/snowshoe-v3-dollar.png' },
      { label: 'Waving', fill: 'white', detail: '#4a7c59', pixellab: 'pixellab-icons/snowshoe-v3-wave.png' },
      { label: 'Credit Card', fill: 'white', detail: '#5b8fa8', pixellab: 'pixellab-icons/snowshoe-v3-card.png' }
    ]
  }
];

// ===== SVG ICON ROUTER =====
function getConceptSvg(conceptIdx, varIdx, fillColor, detailColor) {
  switch (conceptIdx) {
    case 0: return getPiggyProfileSvg(varIdx, fillColor, detailColor);
    case 1: return getPiggyFaceSvg(varIdx, fillColor, detailColor);
    case 2: return getPiggyPotSvg(varIdx, fillColor, detailColor);
    case 3: return getPiggySymbolSvg(varIdx, fillColor, detailColor);
    default: return ''; // PixelLab sections use <img>
  }
}

// ===== PIGGY PROFILE — Side view, bold Gustify style =====
function getPiggyProfileSvg(vi, f, d) {
  var body = '<ellipse cx="32" cy="35" rx="16" ry="12" fill="'+f+'"/>';
  var head = '<circle cx="20" cy="28" r="10" fill="'+f+'"/>';
  var sn = '<ellipse cx="12" cy="31" rx="5" ry="3.5" fill="'+f+'"/>';
  var nos = '<circle cx="10" cy="30.5" r="1.3" fill="'+d+'"/><circle cx="14" cy="30.5" r="1.3" fill="'+d+'"/>';
  var eye = '<circle cx="21" cy="25" r="2" fill="'+d+'"/>';
  var ear = '<ellipse cx="23" cy="17" rx="4" ry="6.5" fill="'+f+'" transform="rotate(-20 23 17)"/>';
  var earIn = '<ellipse cx="23" cy="17" rx="2.5" ry="4" fill="'+d+'" opacity="0.15" transform="rotate(-20 23 17)"/>';
  var tail = '<path d="M48 31q3-4 4 0t3 0" fill="none" stroke="'+f+'" stroke-width="2.5" stroke-linecap="round"/>';
  var legs = '<rect x="24" y="44" width="5" height="8" rx="2.5" fill="'+f+'"/><rect x="37" y="44" width="5" height="8" rx="2.5" fill="'+f+'"/>';
  var slot = '<rect x="28" y="22" width="8" height="2.5" rx="1.2" fill="'+d+'" opacity="0.35"/>';
  var base = body+head+sn+nos+eye+ear+earIn+tail+legs+slot;
  switch(vi) {
    case 0: // Classic
      return base;
    case 1: // Bubbles — Gustify steam-bubble accent
      return base +
        '<circle cx="30" cy="13" r="3" fill="'+f+'" opacity="0.5"/>' +
        '<circle cx="39" cy="9" r="2.2" fill="'+f+'" opacity="0.35"/>' +
        '<circle cx="22" cy="10" r="1.8" fill="'+f+'" opacity="0.25"/>';
    case 2: // Coin Drop
      return base +
        '<circle cx="32" cy="12" r="5" fill="'+f+'" opacity="0.7"/>' +
        '<text x="32" y="15" text-anchor="middle" font-family="Outfit,sans-serif" font-weight="800" font-size="7" fill="'+d+'" opacity="0.5">$</text>';
    case 3: // Round — all circles, no ellipses
      return '<circle cx="32" cy="34" r="15" fill="'+f+'"/>' +
        '<circle cx="20" cy="28" r="10" fill="'+f+'"/>' +
        '<circle cx="12" cy="31" r="5" fill="'+f+'"/>' + nos + eye + ear + earIn +
        '<path d="M47 30q3-4 4 0t3 0" fill="none" stroke="'+f+'" stroke-width="2.5" stroke-linecap="round"/>' +
        '<circle cx="26" cy="47" r="3.5" fill="'+f+'"/><circle cx="38" cy="47" r="3.5" fill="'+f+'"/>' + slot;
    case 4: // Trotting — four legs in motion
      return body+head+sn+nos+eye+ear+earIn+tail+slot +
        '<rect x="21" y="43" width="4.5" height="9" rx="2" fill="'+f+'" transform="rotate(-10 23 43)"/>' +
        '<rect x="29" y="44" width="4.5" height="8" rx="2" fill="'+f+'" transform="rotate(8 31 44)"/>' +
        '<rect x="35" y="43" width="4.5" height="9" rx="2" fill="'+f+'" transform="rotate(-6 37 43)"/>' +
        '<rect x="41" y="44" width="4.5" height="8" rx="2" fill="'+f+'" transform="rotate(10 43 44)"/>';
    case 5: // Plump — extra chubby, overlapping circles
      return '<circle cx="33" cy="35" r="16" fill="'+f+'"/>' +
        '<circle cx="20" cy="30" r="11" fill="'+f+'"/>' +
        '<circle cx="11" cy="33" r="5.5" fill="'+f+'"/>' +
        '<circle cx="9" cy="32.5" r="1.3" fill="'+d+'"/><circle cx="13" cy="32.5" r="1.3" fill="'+d+'"/>' +
        '<circle cx="21" cy="26" r="2.3" fill="'+d+'"/>' +
        '<ellipse cx="23" cy="18" rx="5" ry="7" fill="'+f+'" transform="rotate(-15 23 18)"/>' +
        '<ellipse cx="23" cy="18" rx="3" ry="4.5" fill="'+d+'" opacity="0.12" transform="rotate(-15 23 18)"/>' +
        '<path d="M49 31q4-5 5 0t4 0" fill="none" stroke="'+f+'" stroke-width="3" stroke-linecap="round"/>' +
        '<circle cx="27" cy="48" r="4" fill="'+f+'"/><circle cx="40" cy="48" r="4" fill="'+f+'"/>' +
        '<rect x="28" y="21" width="10" height="2.5" rx="1.2" fill="'+d+'" opacity="0.35"/>';
    default: return '';
  }
}

// ===== PIGGY FACE — Front view, round and expressive =====
function getPiggyFaceSvg(vi, f, d) {
  var head = '<circle cx="32" cy="33" r="18" fill="'+f+'"/>';
  var lEar = '<ellipse cx="17" cy="15" rx="6" ry="8" fill="'+f+'" transform="rotate(-15 17 15)"/>';
  var rEar = '<ellipse cx="47" cy="15" rx="6" ry="8" fill="'+f+'" transform="rotate(15 47 15)"/>';
  var lEarIn = '<ellipse cx="17" cy="15" rx="3.5" ry="5" fill="'+d+'" opacity="0.12" transform="rotate(-15 17 15)"/>';
  var rEarIn = '<ellipse cx="47" cy="15" rx="3.5" ry="5" fill="'+d+'" opacity="0.12" transform="rotate(15 47 15)"/>';
  var eyes = '<circle cx="24" cy="30" r="2.5" fill="'+d+'"/><circle cx="40" cy="30" r="2.5" fill="'+d+'"/>';
  var snout = '<ellipse cx="32" cy="40" rx="8" ry="5.5" fill="'+d+'" opacity="0.15"/>';
  var nos = '<circle cx="29" cy="40" r="1.5" fill="'+d+'"/><circle cx="35" cy="40" r="1.5" fill="'+d+'"/>';
  var base = lEar+rEar+lEarIn+rEarIn+head+eyes+snout+nos;
  switch(vi) {
    case 0: // Simple
      return base;
    case 1: // Wink
      return lEar+rEar+lEarIn+rEarIn+head +
        '<path d="M21 30h6" stroke="'+d+'" stroke-width="2.5" stroke-linecap="round"/>' +
        '<circle cx="40" cy="30" r="2.5" fill="'+d+'"/>' + snout+nos;
    case 2: // Blush — cheek circles
      return base +
        '<circle cx="19" cy="37" r="4" fill="'+f+'" opacity="0.25"/>' +
        '<circle cx="45" cy="37" r="4" fill="'+f+'" opacity="0.25"/>';
    case 3: // Big Snout
      return lEar+rEar+lEarIn+rEarIn+head +
        '<circle cx="24" cy="28" r="2" fill="'+d+'"/><circle cx="40" cy="28" r="2" fill="'+d+'"/>' +
        '<ellipse cx="32" cy="41" rx="10" ry="7" fill="'+d+'" opacity="0.15"/>' +
        '<circle cx="28" cy="41" r="2" fill="'+d+'"/><circle cx="36" cy="41" r="2" fill="'+d+'"/>';
    case 4: // Perky Ears — tall, pointy
      return '<ellipse cx="15" cy="10" rx="5" ry="10" fill="'+f+'" transform="rotate(-20 15 10)"/>' +
        '<ellipse cx="49" cy="10" rx="5" ry="10" fill="'+f+'" transform="rotate(20 49 10)"/>' +
        '<ellipse cx="15" cy="10" rx="3" ry="6.5" fill="'+d+'" opacity="0.12" transform="rotate(-20 15 10)"/>' +
        '<ellipse cx="49" cy="10" rx="3" ry="6.5" fill="'+d+'" opacity="0.12" transform="rotate(20 49 10)"/>' +
        head+eyes+snout+nos;
    case 5: // Sleepy — half-closed eyes, zzz
      return lEar+rEar+lEarIn+rEarIn+head +
        '<path d="M21 30h6" stroke="'+d+'" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M37 30h6" stroke="'+d+'" stroke-width="2" stroke-linecap="round"/>' +
        snout+nos +
        '<text x="50" y="17" font-family="Outfit,sans-serif" font-weight="800" font-size="8" fill="'+f+'" opacity="0.4">z</text>' +
        '<text x="54" y="10" font-family="Outfit,sans-serif" font-weight="800" font-size="6" fill="'+f+'" opacity="0.25">z</text>';
    default: return '';
  }
}

// ===== PIGGY POT — Gustify construction: round body, handle-ears, bubble accents =====
function getPiggyPotSvg(vi, f, d) {
  switch(vi) {
    case 0: // Pot Piggy — round body, side ears as pot handles
      return '<circle cx="32" cy="35" r="16" fill="'+f+'"/>' +
        '<ellipse cx="12" cy="35" rx="5" ry="4" fill="'+f+'"/>' +
        '<ellipse cx="52" cy="35" rx="5" ry="4" fill="'+f+'"/>' +
        '<ellipse cx="12" cy="35" rx="3" ry="2.5" fill="'+d+'" opacity="0.12"/>' +
        '<ellipse cx="52" cy="35" rx="3" ry="2.5" fill="'+d+'" opacity="0.12"/>' +
        '<circle cx="26" cy="32" r="2.2" fill="'+d+'"/><circle cx="38" cy="32" r="2.2" fill="'+d+'"/>' +
        '<ellipse cx="32" cy="39" rx="5" ry="3.5" fill="'+d+'" opacity="0.15"/>' +
        '<circle cx="30" cy="39" r="1.3" fill="'+d+'"/><circle cx="34" cy="39" r="1.3" fill="'+d+'"/>' +
        '<rect x="28" y="19" width="8" height="2" rx="1" fill="'+d+'" opacity="0.3"/>';
    case 1: // Pot + Coins — Gustify steam = floating coins
      return '<circle cx="32" cy="37" r="15" fill="'+f+'"/>' +
        '<ellipse cx="13" cy="37" rx="5" ry="4" fill="'+f+'"/>' +
        '<ellipse cx="51" cy="37" rx="5" ry="4" fill="'+f+'"/>' +
        '<ellipse cx="13" cy="37" rx="3" ry="2.5" fill="'+d+'" opacity="0.12"/>' +
        '<ellipse cx="51" cy="37" rx="3" ry="2.5" fill="'+d+'" opacity="0.12"/>' +
        '<circle cx="26" cy="34" r="2" fill="'+d+'"/><circle cx="38" cy="34" r="2" fill="'+d+'"/>' +
        '<ellipse cx="32" cy="41" rx="5" ry="3.5" fill="'+d+'" opacity="0.15"/>' +
        '<circle cx="30" cy="41" r="1.3" fill="'+d+'"/><circle cx="34" cy="41" r="1.3" fill="'+d+'"/>' +
        '<circle cx="24" cy="15" r="3.5" fill="'+f+'" opacity="0.5"/>' +
        '<circle cx="34" cy="10" r="2.5" fill="'+f+'" opacity="0.35"/>' +
        '<circle cx="42" cy="15" r="2" fill="'+f+'" opacity="0.25"/>';
    case 2: // Belly Circle — visible belly ring accent
      return '<circle cx="32" cy="34" r="16" fill="'+f+'"/>' +
        '<ellipse cx="14" cy="26" rx="5" ry="7" fill="'+f+'" transform="rotate(-15 14 26)"/>' +
        '<ellipse cx="50" cy="26" rx="5" ry="7" fill="'+f+'" transform="rotate(15 50 26)"/>' +
        '<ellipse cx="14" cy="26" rx="3" ry="4.5" fill="'+d+'" opacity="0.12" transform="rotate(-15 14 26)"/>' +
        '<ellipse cx="50" cy="26" rx="3" ry="4.5" fill="'+d+'" opacity="0.12" transform="rotate(15 50 26)"/>' +
        '<circle cx="26" cy="31" r="2" fill="'+d+'"/><circle cx="38" cy="31" r="2" fill="'+d+'"/>' +
        '<ellipse cx="32" cy="38" rx="5" ry="3.5" fill="'+d+'" opacity="0.15"/>' +
        '<circle cx="30" cy="38" r="1.3" fill="'+d+'"/><circle cx="34" cy="38" r="1.3" fill="'+d+'"/>' +
        '<circle cx="32" cy="34" r="9" fill="none" stroke="'+d+'" stroke-width="1.5" opacity="0.12"/>';
    case 3: // Pot Lid — horizontal lid line on top
      return '<rect x="22" y="20" width="20" height="3" rx="1.5" fill="'+f+'"/>' +
        '<circle cx="32" cy="20" r="3" fill="'+f+'"/>' +
        '<circle cx="32" cy="37" r="15" fill="'+f+'"/>' +
        '<ellipse cx="13" cy="37" rx="5" ry="4" fill="'+f+'"/>' +
        '<ellipse cx="51" cy="37" rx="5" ry="4" fill="'+f+'"/>' +
        '<circle cx="26" cy="34" r="2" fill="'+d+'"/><circle cx="38" cy="34" r="2" fill="'+d+'"/>' +
        '<ellipse cx="32" cy="41" rx="5" ry="3.5" fill="'+d+'" opacity="0.15"/>' +
        '<circle cx="30" cy="41" r="1.3" fill="'+d+'"/><circle cx="34" cy="41" r="1.3" fill="'+d+'"/>';
    case 4: // Tall Pot — vertical oval body
      return '<ellipse cx="32" cy="36" rx="13" ry="18" fill="'+f+'"/>' +
        '<ellipse cx="14" cy="30" rx="5" ry="4" fill="'+f+'"/>' +
        '<ellipse cx="50" cy="30" rx="5" ry="4" fill="'+f+'"/>' +
        '<ellipse cx="14" cy="30" rx="3" ry="2.5" fill="'+d+'" opacity="0.12"/>' +
        '<ellipse cx="50" cy="30" rx="3" ry="2.5" fill="'+d+'" opacity="0.12"/>' +
        '<circle cx="26" cy="29" r="2" fill="'+d+'"/><circle cx="38" cy="29" r="2" fill="'+d+'"/>' +
        '<ellipse cx="32" cy="36" rx="5" ry="3.5" fill="'+d+'" opacity="0.15"/>' +
        '<circle cx="30" cy="36" r="1.3" fill="'+d+'"/><circle cx="34" cy="36" r="1.3" fill="'+d+'"/>' +
        '<rect x="28" y="17" width="8" height="2" rx="1" fill="'+d+'" opacity="0.3"/>';
    case 5: // Mug Pig — big side handle like a mug
      return '<circle cx="28" cy="34" r="16" fill="'+f+'"/>' +
        '<path d="M44 24c9 0 12 8 12 12s-3 10-12 10" fill="none" stroke="'+f+'" stroke-width="4.5" stroke-linecap="round"/>' +
        '<ellipse cx="14" cy="22" rx="5" ry="7" fill="'+f+'" transform="rotate(-10 14 22)"/>' +
        '<ellipse cx="14" cy="22" rx="3" ry="4.5" fill="'+d+'" opacity="0.12" transform="rotate(-10 14 22)"/>' +
        '<circle cx="22" cy="31" r="2" fill="'+d+'"/><circle cx="34" cy="31" r="2" fill="'+d+'"/>' +
        '<ellipse cx="28" cy="38" rx="5" ry="3.5" fill="'+d+'" opacity="0.15"/>' +
        '<circle cx="26" cy="38" r="1.3" fill="'+d+'"/><circle cx="30" cy="38" r="1.3" fill="'+d+'"/>';
    default: return '';
  }
}

// ===== PIGGY SYMBOL — Iconic/abstract piggy representations =====
function getPiggySymbolSvg(vi, f, d) {
  switch(vi) {
    case 0: // Badge — piggy inside circle outline
      return '<circle cx="32" cy="32" r="22" fill="none" stroke="'+f+'" stroke-width="2.5"/>' +
        '<ellipse cx="32" cy="35" rx="11" ry="8" fill="'+f+'"/>' +
        '<circle cx="24" cy="30" r="7" fill="'+f+'"/>' +
        '<ellipse cx="19" cy="33" rx="3.5" ry="2.5" fill="'+f+'"/>' +
        '<circle cx="17.5" cy="32.5" r="1" fill="'+d+'"/><circle cx="20.5" cy="32.5" r="1" fill="'+d+'"/>' +
        '<circle cx="25" cy="27" r="1.5" fill="'+d+'"/>' +
        '<ellipse cx="26" cy="22" rx="3" ry="4.5" fill="'+f+'" transform="rotate(-15 26 22)"/>' +
        '<path d="M43 32q2-3 3 0t2 0" fill="none" stroke="'+f+'" stroke-width="2" stroke-linecap="round"/>';
    case 1: // Silhouette — solid, no internal detail
      return '<ellipse cx="32" cy="34" rx="16" ry="12" fill="'+f+'"/>' +
        '<circle cx="20" cy="28" r="10" fill="'+f+'"/>' +
        '<ellipse cx="12" cy="31" rx="5" ry="3.5" fill="'+f+'"/>' +
        '<ellipse cx="23" cy="17" rx="4" ry="6.5" fill="'+f+'" transform="rotate(-20 23 17)"/>' +
        '<path d="M48 31q3-4 4 0t3 0" fill="none" stroke="'+f+'" stroke-width="2.5" stroke-linecap="round"/>' +
        '<rect x="24" y="44" width="5" height="8" rx="2.5" fill="'+f+'"/>' +
        '<rect x="37" y="44" width="5" height="8" rx="2.5" fill="'+f+'"/>';
    case 2: // Coin Split — half piggy, half coin
      return '<circle cx="32" cy="32" r="18" fill="'+f+'" opacity="0.25"/>' +
        '<path d="M32 14A18 18 0 0 0 32 50z" fill="'+f+'"/>' +
        '<circle cx="26" cy="28" r="2" fill="'+d+'"/>' +
        '<ellipse cx="21" cy="33" rx="3.5" ry="2.5" fill="'+d+'" opacity="0.2"/>' +
        '<circle cx="20" cy="33" r="1" fill="'+d+'"/>' +
        '<ellipse cx="25" cy="21" rx="3" ry="5" fill="'+f+'" transform="rotate(-15 25 21)"/>' +
        '<text x="43" y="37" text-anchor="middle" font-family="Outfit,sans-serif" font-weight="800" font-size="14" fill="'+f+'" opacity="0.6">$</text>';
    case 3: // Shield — piggy inside shield shape
      return '<path d="M32 8l18 6v16c0 12-8 22-18 26C22 52 14 42 14 30V14z" fill="'+f+'" opacity="0.15"/>' +
        '<path d="M32 8l18 6v16c0 12-8 22-18 26C22 52 14 42 14 30V14z" fill="none" stroke="'+f+'" stroke-width="2"/>' +
        '<ellipse cx="32" cy="35" rx="10" ry="8" fill="'+f+'"/>' +
        '<circle cx="25" cy="30" r="6.5" fill="'+f+'"/>' +
        '<ellipse cx="21" cy="33" rx="3" ry="2" fill="'+f+'"/>' +
        '<circle cx="19.5" cy="32.5" r="0.8" fill="'+d+'"/><circle cx="22.5" cy="32.5" r="0.8" fill="'+d+'"/>' +
        '<circle cx="26" cy="28" r="1.5" fill="'+d+'"/>' +
        '<ellipse cx="28" cy="23" rx="3" ry="4.5" fill="'+f+'" transform="rotate(-15 28 23)"/>';
    case 4: // Sparkle — piggy with sparkle/star accents
      return '<ellipse cx="32" cy="35" rx="14" ry="11" fill="'+f+'"/>' +
        '<circle cx="21" cy="29" r="9" fill="'+f+'"/>' +
        '<ellipse cx="14" cy="32" rx="4.5" ry="3" fill="'+f+'"/>' +
        '<circle cx="12.5" cy="31.5" r="1.2" fill="'+d+'"/><circle cx="15.5" cy="31.5" r="1.2" fill="'+d+'"/>' +
        '<circle cx="22" cy="26" r="1.8" fill="'+d+'"/>' +
        '<ellipse cx="24" cy="19" rx="3.5" ry="5.5" fill="'+f+'" transform="rotate(-15 24 19)"/>' +
        '<path d="M47 32q2-3 3 0" fill="none" stroke="'+f+'" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M51 15v-4M49 13h4" stroke="'+f+'" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>' +
        '<path d="M10 17v-3M8.5 15.5h3" stroke="'+f+'" stroke-width="1.2" stroke-linecap="round" opacity="0.4"/>' +
        '<path d="M45 50v-3M43.5 48.5h3" stroke="'+f+'" stroke-width="1.2" stroke-linecap="round" opacity="0.3"/>';
    case 5: // G-Piggy — letter G shaped with piggy features
      return '<path d="M42 18c-8-6-22-4-24 12s4 20 16 20c6 0 10-4 10-8h-12" fill="none" stroke="'+f+'" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<circle cx="22" cy="27" r="2" fill="'+f+'"/>' +
        '<ellipse cx="16" cy="34" rx="3.5" ry="2.5" fill="'+d+'" opacity="0.2"/>' +
        '<circle cx="14.5" cy="34" r="1" fill="'+f+'"/><circle cx="17.5" cy="34" r="1" fill="'+f+'"/>' +
        '<ellipse cx="24" cy="16" rx="3.5" ry="5.5" fill="'+f+'" opacity="0.5" transform="rotate(-20 24 16)"/>';
    default: return '';
  }
}
