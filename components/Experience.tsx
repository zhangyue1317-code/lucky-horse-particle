import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { GestureType, PhotoData } from '../types';
import { getFuPoints } from '../services/horseShape';
import { createEmojiTexture, createShapeTexture } from '../services/textureGen';

interface ExperienceProps {
  gesture: GestureType;
  pinchDistance: number; // Normalized roughly 0 to 1+
  photos: PhotoData[];
  handOpenAmount: number; // 0 to 1
}

const PARTICLE_COUNT = 3000; 
// Removed 'triangle' from the types list
const PARTICLES_TYPES = ['🧧', '🎆', '🎉', '✨', '🎁', '🀄', 'circle', 'square'];
const EMOJI_TYPES = ['🧧', '🎆', '🎉', '✨', '🎁', '🀄'];

export const Experience: React.FC<ExperienceProps> = ({ gesture, pinchDistance, photos, handOpenAmount }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  
  // Refs to hold latest props
  const gestureRef = useRef(gesture);
  const pinchDistanceRef = useRef(pinchDistance);
  const photosRef = useRef(photos);
  const handOpenAmountRef = useRef(handOpenAmount);

  // Gesture State Tracking
  const prevGestureRef = useRef<GestureType>(GestureType.NONE);
  const activePhotoIndexRef = useRef<number>(-1);

  useEffect(() => {
    gestureRef.current = gesture;
    pinchDistanceRef.current = pinchDistance;
    photosRef.current = photos;
    handOpenAmountRef.current = handOpenAmount;
  }, [gesture, pinchDistance, photos, handOpenAmount]);

  // Use Fu Points
  const shapeTargetPoints = useMemo(() => getFuPoints(PARTICLE_COUNT), []);
  
  // Scene references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const containerGroupRef = useRef<THREE.Group | null>(null);
  const photosGroupRef = useRef<THREE.Group | null>(null);
  
  // Particle Data Storage
  const particleData = useRef<{ 
    mesh: THREE.InstancedMesh, 
    instanceIndex: number,
    currentPos: THREE.Vector3,
    basePos: THREE.Vector3,
    phase: number,
    rotation: number,
    rotationSpeed: number,
    scale: number,
    type: string,
    opacityFactor: number 
  }[]>([]);

  useEffect(() => {
    if (!mountRef.current) return;

    // --- SETUP ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Add Fog for Depth perception (Atmosphere)
    // Starts clear, adjusted in animation loop
    scene.fog = new THREE.FogExp2(0x000000, 0.0);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 12;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Remove ToneMapping for standard color representation without bloom
    renderer.toneMapping = THREE.NoToneMapping;
    mountRef.current.appendChild(renderer.domElement);

    // --- PARTICLES ---
    const containerGroup = new THREE.Group();
    scene.add(containerGroup);
    containerGroupRef.current = containerGroup;

    // Generate Textures
    const textureMap = new Map<string, THREE.Texture>();
    PARTICLES_TYPES.forEach(type => {
        let texture;
        if (['circle', 'square'].includes(type)) {
            texture = createShapeTexture(type as any);
        } else {
            texture = createEmojiTexture(type);
        }
        textureMap.set(type, texture);
    });

    // Assign types and count
    const particleAssignments = [];
    const typeCounts: Record<string, number> = {};
    PARTICLES_TYPES.forEach(t => typeCounts[t] = 0);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const type = PARTICLES_TYPES[Math.floor(Math.random() * PARTICLES_TYPES.length)];
        particleAssignments.push(type);
        typeCounts[type]++;
    }

    // Create Instanced Meshes
    const instancedMeshes: THREE.InstancedMesh[] = [];
    const meshMap = new Map<string, THREE.InstancedMesh>();
    
    PARTICLES_TYPES.forEach(type => {
        const count = typeCounts[type];
        if (count > 0) {
            const geo = new THREE.PlaneGeometry(1, 1);
            
            // Allocate attribute for Opacity
            const opacityArray = new Float32Array(count);
            // Initialize with 1.0 (will be updated in data loop)
            opacityArray.fill(1.0);
            geo.setAttribute('instanceOpacity', new THREE.InstancedBufferAttribute(opacityArray, 1));

            const mat = new THREE.MeshBasicMaterial({
                map: textureMap.get(type),
                transparent: true,
                opacity: 1.0, 
                color: 0xffffff,
                // Switch to NormalBlending to remove "glowing" additive overlap, relies on custom alpha
                blending: THREE.NormalBlending, 
                depthWrite: false,
                side: THREE.DoubleSide
            });
            
            // Custom Shader Injection for Instance Opacity
            mat.onBeforeCompile = (shader) => {
                shader.vertexShader = `
                  attribute float instanceOpacity;
                  varying float vAlpha;
                  ${shader.vertexShader}
                `.replace(
                  '#include <begin_vertex>',
                  `
                  #include <begin_vertex>
                  vAlpha = instanceOpacity;
                  `
                );
                shader.fragmentShader = `
                  varying float vAlpha;
                  ${shader.fragmentShader}
                `.replace(
                  '#include <color_fragment>',
                  `
                  #include <color_fragment>
                  diffuseColor.a *= vAlpha;
                  `
                );
            };

            const mesh = new THREE.InstancedMesh(geo, mat, count);
            mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            containerGroup.add(mesh);
            instancedMeshes.push(mesh);
            meshMap.set(type, mesh);
        }
    });

    // Initialize Particle Data
    particleData.current = [];
    const currentIndices: Record<string, number> = {};
    PARTICLES_TYPES.forEach(t => currentIndices[t] = 0);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const type = particleAssignments[i];
        const mesh = meshMap.get(type)!;
        const instanceIdx = currentIndices[type]++;

        // Initial Random Position
        const x = (Math.random() - 0.5) * 30;
        const y = (Math.random() - 0.5) * 20;
        const z = (Math.random() - 0.5) * 15;

        // Determine random opacity factor: 10% to 80%
        const opacityFactor = 0.1 + Math.random() * 0.7;

        // Set opacity attribute for this instance
        const opacityAttr = mesh.geometry.attributes.instanceOpacity as THREE.InstancedBufferAttribute;
        opacityAttr.setX(instanceIdx, opacityFactor);

        particleData.current.push({
            mesh: mesh,
            instanceIndex: instanceIdx,
            currentPos: new THREE.Vector3(x, y, z),
            basePos: new THREE.Vector3(x, y, z),
            phase: Math.random() * Math.PI * 2,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 3.0, 
            scale: 0.35 + Math.random() * 0.25,
            type: type,
            opacityFactor: opacityFactor
        });
    }
    
    // Mark attributes as needing update
    instancedMeshes.forEach(mesh => {
        if (mesh.geometry.attributes.instanceOpacity) {
            mesh.geometry.attributes.instanceOpacity.needsUpdate = true;
        }
    });

    // --- PHOTOS GROUP ---
    const photosGroup = new THREE.Group();
    scene.add(photosGroup);
    photosGroupRef.current = photosGroup;

    // --- ANIMATION LOOP ---
    const clock = new THREE.Clock();
    let animationFrameId: number;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Refs
      const currentGesture = gestureRef.current;
      const currentHandOpen = handOpenAmountRef.current;
      const currentPinchDist = pinchDistanceRef.current;
      const currentPhotos = photosRef.current;

      // Logic
      let targetMode = 'RANDOM'; 
      if (currentGesture === GestureType.FIST) targetMode = 'FU'; 
      else if (currentGesture === GestureType.OPEN_PALM) targetMode = 'RANDOM';
      else if (currentGesture === GestureType.PINCH) targetMode = 'RANDOM'; 

      // --- DYNAMIC ATMOSPHERE (Depth of Field via Fog) ---
      // When clustered (FU), clear fog to see text. When scattered, increase fog for depth.
      if (scene.fog instanceof THREE.FogExp2) {
        const targetDensity = (targetMode === 'FU') ? 0.002 : 0.035; 
        scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, targetDensity, delta * 1.5);
      }

      // Group Rotation
      if (currentGesture === GestureType.OPEN_PALM) {
        containerGroup.rotation.y += delta * 0.2;
      } else {
        containerGroup.rotation.y = THREE.MathUtils.lerp(containerGroup.rotation.y, 0, delta * 3);
      }

      // --- CYCLE ACTIVE PHOTO LOGIC ---
      const isPinchedState = currentGesture === GestureType.PINCH;
      // Rising edge detection (Start of pinch)
      if (isPinchedState && prevGestureRef.current !== GestureType.PINCH) {
         if (currentPhotos.length > 0) {
             activePhotoIndexRef.current = (activePhotoIndexRef.current + 1) % currentPhotos.length;
         }
      }
      prevGestureRef.current = currentGesture;

      // Determine the currently active photo ID (if any)
      const activePhoto = (currentPhotos.length > 0 && activePhotoIndexRef.current >= 0)
          ? currentPhotos[activePhotoIndexRef.current]
          : null;
      const activePhotoId = activePhoto ? activePhoto.id : null;


      // Identify active visible photos for repulsion
      // Only the actively displayed photo should repel
      const activeRepulsionPoints: {pos: THREE.Vector3, radius: number}[] = [];
      if (photosGroupRef.current) {
         photosGroupRef.current.children.forEach(child => {
            // Only consider the currently active photo that is actually scaled up
            if (child.userData.id === activePhotoId && child.scale.x > 1.0) { 
                activeRepulsionPoints.push({
                    pos: child.position,
                    radius: child.scale.y * 0.7 
                });
            }
         });
      }

      // Update Particles
      particleData.current.forEach((data, i) => {
        let targetPos = new THREE.Vector3();

        if (targetMode === 'FU') {
           // Cycle through shape points
           const pointIndex = i % shapeTargetPoints.length;
           targetPos.copy(shapeTargetPoints[pointIndex]);
           targetPos.x += Math.sin(time * 2 + data.phase) * 0.05;
           targetPos.y += Math.cos(time * 1.5 + data.phase) * 0.05;
        } else {
           const spread = 1.0 + (currentHandOpen * 2.0); 
           targetPos.copy(data.basePos).multiplyScalar(spread);
           targetPos.y += Math.sin(time * 0.5 + data.phase) * 0.5;
        }

        // --- PARTICLE REPULSION FROM PHOTOS ---
        // If photos are active, push particles away
        if (activeRepulsionPoints.length > 0 && targetMode !== 'FU') {
            activeRepulsionPoints.forEach(photoInfo => {
                const distToPhoto = targetPos.distanceTo(photoInfo.pos);
                const repelRadius = photoInfo.radius + 1.0; 
                
                if (distToPhoto < repelRadius) {
                    const repelDir = new THREE.Vector3().subVectors(targetPos, photoInfo.pos).normalize();
                    const force = (repelRadius - distToPhoto) * 2.0; 
                    targetPos.add(repelDir.multiplyScalar(force));
                }
            });
        }

        const lerpFactor = targetMode === 'FU' ? 0.06 : 0.03;
        data.currentPos.lerp(targetPos, lerpFactor);

        if (targetMode !== 'FU') {
            data.rotation += data.rotationSpeed * delta;
        } else {
            data.rotation = THREE.MathUtils.lerp(data.rotation, 0, delta * 4);
        }

        dummy.position.copy(data.currentPos);
        dummy.quaternion.copy(camera.quaternion); 
        dummy.rotateZ(data.rotation); 
        
        // --- DEPTH OF FIELD SIMULATION ---
        // Calculate distance from "Focus Plane" (Z=0)
        const zDepth = data.currentPos.z;
        const distFromFocus = Math.abs(zDepth);
        let dofScale = 1.0;
        let dofDim = 1.0;

        // Apply DoF simulation only when scattered (to keep Text crisp)
        if (targetMode !== 'FU') {
             // Calculate blur amount based on distance from focus
             // "Circle of Confusion" simulation: Out of focus items get larger and blurrier (simulated via scale + dimming)
             const blurStrength = THREE.MathUtils.smoothstep(distFromFocus, 2.0, 15.0);
             
             // Scale up out-of-focus particles (Bokeh effect)
             dofScale = 1.0 + (blurStrength * 0.8); 
             // Dim out-of-focus particles to push them into background
             dofDim = 1.0 - (blurStrength * 0.5); 
        }

        let s = data.scale * dofScale;
        
        // --- COLOR LOGIC ---
        if (['circle', 'square'].includes(data.type)) {
            color.setHSL(0.0, 1.0, 0.5); // Red
        } else if (data.type === '🧧') {
            color.setHSL(0.0, 0.0, 1.0); // White
        } else {
            color.setHSL(0.6, 0.1, 0.8); // Neutral
        }

        // Pulse + DoF Dimming
        // This pulse affects RGB brightness. Combined with static instanceOpacity, creates shimmering.
        const pulse = 0.8 + 0.2 * Math.sin(time * 3 + data.phase);
        color.multiplyScalar(pulse * dofDim);
        
        // Use a black color mix to simulate density/fog on top of the actual scene fog
        // This helps the particles truly fade into the dark background
        if (targetMode !== 'FU') {
            const fogMix = THREE.MathUtils.smoothstep(distFromFocus, 8.0, 20.0);
            color.lerp(new THREE.Color(0x000000), fogMix * 0.8);
        }
        
        dummy.scale.set(s, s, 1);
        dummy.updateMatrix();
        
        data.mesh.setMatrixAt(data.instanceIndex, dummy.matrix);
        data.mesh.setColorAt(data.instanceIndex, color);
      });

      instancedMeshes.forEach(mesh => {
         mesh.instanceMatrix.needsUpdate = true;
         if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      });

      // --- PHOTOS LOGIC ---
      if (photosGroupRef.current) {
        currentPhotos.forEach((photo) => {
          let sprite = photosGroupRef.current?.children.find(c => c.userData.id === photo.id) as THREE.Sprite;
          if (!sprite) {
            const map = new THREE.TextureLoader().load(photo.url);
            map.colorSpace = THREE.SRGBColorSpace;
            const mat = new THREE.SpriteMaterial({ map: map, color: 0xffffff });
            sprite = new THREE.Sprite(mat);
            sprite.userData = { id: photo.id, aspectRatio: photo.aspectRatio };
            sprite.scale.set(0,0,0);
            sprite.position.set((Math.random()-0.5)*2, (Math.random()-0.5)*2, 0.5);
            photosGroupRef.current?.add(sprite);
          }
        });

        photosGroupRef.current.children.forEach((child, idx) => {
            const sprite = child as THREE.Sprite;
            const spriteAspectRatio = sprite.userData.aspectRatio || 1.0;
            
            // Check if this sprite is the active photo
            const isActive = sprite.userData.id === activePhotoId;
            const isPinched = isPinchedState && currentPinchDist < 0.3;
            
            // Increased by 40% from 6.0 to 8.4
            const baseScale = 8.4;
            // Only scale up if it is the active one AND we are actively pinching
            const targetHeight = (isPinched && isActive) ? baseScale : 0.0;
            const targetWidth = targetHeight * spriteAspectRatio;

            sprite.scale.x = THREE.MathUtils.lerp(sprite.scale.x, targetWidth, delta * 5);
            sprite.scale.y = THREE.MathUtils.lerp(sprite.scale.y, targetHeight, delta * 5);

            if (isPinched && isActive) {
                 sprite.position.y += Math.sin(time + idx) * 0.002;
                 sprite.material.color.setScalar(1.0); 
            }
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, [shapeTargetPoints]); 

  return <div ref={mountRef} className="absolute inset-0 z-0" />;
};