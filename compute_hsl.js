const colors = {
  primary: "#0047FF",
  secondary: "#071A3D",
  accent: "#16C784",
  success: "#16C784",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
  background: "#F8FAFC",
  foreground: "#0F172A",
  card: "#FFFFFF",
  card_foreground: "#0F172A",
  popover: "#FFFFFF",
  popover_foreground: "#0F172A",
  surface: "#FFFFFF",
  surface_hover: "#F1F5F9",
  muted: "#CBD5E1",
  muted_foreground: "#64748B",
  border: "#E2E8F0",
  input: "#E2E8F0"
};

const dark_mode_colors = {
  primary: "#0047FF",
  secondary: "#071A3D",
  accent: "#16C784",
  success: "#16C784",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
  background: "#0B1220",
  foreground: "#F8FAFC",
  card: "#111827",
  card_foreground: "#F8FAFC",
  popover: "#111827",
  popover_foreground: "#F8FAFC",
  surface: "#111827",
  surface_hover: "#1E293B",
  muted: "#475569",
  muted_foreground: "#94A3B8",
  border: "#334155",
  input: "#334155"
};

const hexToHslString = (hex) => {
  if (!hex || !hex.startsWith('#')) return '0 0% 0%';
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;

  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

console.log("LIGHT:");
for (const [k, v] of Object.entries(colors)) {
  console.log(`--${k.replace('_', '-')}: ${hexToHslString(v)};`);
}

console.log("\nDARK:");
for (const [k, v] of Object.entries(dark_mode_colors)) {
  console.log(`--${k.replace('_', '-')}: ${hexToHslString(v)};`);
}
