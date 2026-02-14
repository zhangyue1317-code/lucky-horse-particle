import * as THREE from 'three';

/**
 * Generates points in the shape of the Chinese character 'Fu' (福)
 * by rendering it to an offscreen canvas and sampling the pixels.
 */
export const getFuPoints = (count: number): THREE.Vector3[] => {
    // 1. Setup Canvas - Increased resolution for better sampling
    const width = 300;
    const height = 300;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (!ctx) return [];

    // 2. Draw '福' Calligraphy
    // Use 'Ma Shan Zheng' font, fallback to standard calligraphic fonts
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height); // Background
    
    // Increased font size to fill the canvas
    ctx.font = 'bold 240px "Ma Shan Zheng", "Kaiti", "STKaiti", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff'; // Text color for sampling
    // Draw slightly offset to center perfectly visually
    ctx.fillText('福', width / 2, height / 2 + 10); 

    // 3. Extract Pixels
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const validPixels: {x: number, y: number}[] = [];

    // Sample pixels
    for (let i = 0; i < data.length; i += 4) {
        // Check Red channel (since text is white)
        // Lower threshold to capture softer edges of calligraphy
        if (data[i] > 30) { 
            const index = i / 4;
            const x = index % width;
            const y = Math.floor(index / width);
            validPixels.push({ x, y });
        }
    }

    const points: THREE.Vector3[] = [];
    if (validPixels.length === 0) return points;

    // 4. Generate Particles
    // Reduced scale to make the character smaller as requested
    // 300px * 0.05 = 15 units wide (previously 0.08 / 24 units)
    const scale = 0.05; 
    
    for (let i = 0; i < count; i++) {
        // Randomly sample from valid pixels to form the shape
        const pixel = validPixels[Math.floor(Math.random() * validPixels.length)];
        
        // Map canvas coordinates to 3D world coordinates
        // Center the shape (width/2, height/2)
        const wx = (pixel.x - width / 2) * scale;
        const wy = -(pixel.y - height / 2) * scale; // Invert Y for 3D
        
        // Add randomized Z depth to give the character volume
        // Reduced thickness slightly to match smaller scale
        const wz = (Math.random() - 0.5) * 1.5;

        // Add slight jitter to prevent grid artifacts from pixel sampling
        const jitter = 0.05;
        const jx = (Math.random() - 0.5) * jitter;
        const jy = (Math.random() - 0.5) * jitter;

        points.push(new THREE.Vector3(wx + jx, wy + jy, wz));
    }

    return points;
};