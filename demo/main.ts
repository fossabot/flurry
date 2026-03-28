import { generateSnowflake } from "../src/index.js";

const input = document.getElementById("input") as HTMLTextAreaElement;
const preview = document.getElementById("preview")!;
const generateBtn = document.getElementById("generate") as HTMLButtonElement;
const copySvgBtn = document.getElementById("copy-svg") as HTMLButtonElement;
const downloadBtn = document.getElementById("download-svg") as HTMLButtonElement;
const copyDataUriBtn = document.getElementById("copy-datauri") as HTMLButtonElement;
const gallery = document.getElementById("gallery")!;
const snowfall = document.getElementById("snowfall")!;

let currentSvg = "";

function randomHex(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function update() {
  const value = input.value.trim();
  if (!value) {
    preview.innerHTML =
      '<p style="color: var(--text-dim); font-size: 0.9rem;">Type something above...</p>';
    currentSvg = "";
    return;
  }
  currentSvg = await generateSnowflake(value);
  preview.innerHTML = currentSvg;
}

// Debounce input
let timer: ReturnType<typeof setTimeout>;
input.addEventListener("input", () => {
  clearTimeout(timer);
  timer = setTimeout(update, 150);
});

// Generate random
generateBtn.addEventListener("click", () => {
  input.value = randomHex(32);
  update();
});

// Example buttons
document.querySelectorAll("[data-value]").forEach((btn) => {
  btn.addEventListener("click", () => {
    input.value = (btn as HTMLElement).dataset.value!;
    update();
  });
});

// Copy SVG
copySvgBtn.addEventListener("click", async () => {
  if (!currentSvg) return;
  await navigator.clipboard.writeText(currentSvg);
  flash(copySvgBtn, "Copied!");
});

// Download SVG
downloadBtn.addEventListener("click", () => {
  if (!currentSvg) return;
  const blob = new Blob([currentSvg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "flurry-snowflake.svg";
  a.click();
  URL.revokeObjectURL(url);
});

// Copy data URI
copyDataUriBtn.addEventListener("click", async () => {
  if (!currentSvg) return;
  const uri = "data:image/svg+xml;base64," + btoa(currentSvg);
  await navigator.clipboard.writeText(uri);
  flash(copyDataUriBtn, "Copied!");
});

function flash(btn: HTMLButtonElement, text: string) {
  const original = btn.textContent;
  btn.textContent = text;
  btn.classList.add("copied");
  setTimeout(() => {
    btn.textContent = original;
    btn.classList.remove("copied");
  }, 1500);
}

// Gallery
const galleryItems = [
  { label: "GitHub SSH", value: "SHA256:nThbg6kXUpJWGl7E1IGOCspRomTxdCARLviKw6E5SY8" },
  { label: "Bitcoin Genesis", value: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa" },
  { label: "vitalik.eth", value: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" },
  { label: "Linus Torvalds", value: "ABAF 11C6 5A29 70B1 30AB E3C4 79BE 3E43 0041 1886" },
  { label: "UUID v4", value: "550e8400-e29b-41d4-a716-446655440000" },
  { label: "MD5 example", value: "d41d8cd98f00b204e9800998ecf8427e" },
  { label: "IPFS CID", value: "QmcRD4wkPPi6dig81r5sLj9Zm1gDCL4zgpEj9CfuRrGbzF" },
  { label: "Ed25519 key", value: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIM0+" },
];

async function buildGallery() {
  for (const item of galleryItems) {
    const svg = await generateSnowflake(item.value, { size: 200 });
    const div = document.createElement("div");
    div.className = "gallery-item";
    div.innerHTML = `${svg}<span>${item.label}</span>`;
    div.addEventListener("click", () => {
      input.value = item.value;
      update();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    div.style.cursor = "pointer";
    gallery.appendChild(div);
  }
}

// Falling snow particles
function createSnowParticles() {
  const count = 30;
  for (let i = 0; i < count; i++) {
    const flake = document.createElement("div");
    flake.className = "snowflake-particle";
    flake.textContent = "\u2744";
    flake.style.left = Math.random() * 100 + "%";
    flake.style.animationDuration = 8 + Math.random() * 12 + "s";
    flake.style.animationDelay = Math.random() * 10 + "s";
    flake.style.fontSize = 6 + Math.random() * 10 + "px";
    flake.style.opacity = String(0.2 + Math.random() * 0.4);
    snowfall.appendChild(flake);
  }
}

// Init
createSnowParticles();
update();
buildGallery();
