import * as THREE from 'three';

export const createEmojiTexture = (emoji: string): THREE.Texture => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    ctx.font = '90px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (emoji === '🧧') {
        // Special "Self-luminous" edge effect for Red Envelope
        // Layer 1: Strong Gold Glow (simulating edge emission)
        ctx.shadowColor = 'rgba(255, 215, 0, 0.9)'; // Gold glow
        ctx.shadowBlur = 15; // Tight, bright glow
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Draw the emoji with the shadow
        ctx.fillText(emoji, 64, 64);
        
        // Optional: Draw it again without shadow to ensure the core is sharp
        ctx.shadowBlur = 0;
        ctx.fillText(emoji, 64, 64);
    } else {
        // Standard slight glow for others to separate from background
        ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
        ctx.shadowBlur = 8;
        ctx.fillStyle = 'white';
        ctx.fillText(emoji, 64, 64);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
};

// Create a simple shape texture (Circle/Square)
// Removed 'triangle' from the allowed types
export const createShapeTexture = (type: 'circle' | 'square'): THREE.Texture => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#ffffff';
    // Add a slight self-luminous feel to shapes too
    ctx.shadowColor = '#ffffcc';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    ctx.beginPath();
    if (type === 'circle') {
      // Reduced radius slightly to accommodate the blur within 64x64 canvas
      ctx.arc(32, 32, 18, 0, Math.PI * 2);
    } else {
      // Reduced rect size slightly to accommodate the blur
      ctx.rect(14, 14, 36, 36);
    }
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
};