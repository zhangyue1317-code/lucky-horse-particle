
export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandResults {
  multiHandLandmarks: HandLandmark[][];
}

export enum GestureType {
  NONE = 'NONE',
  OPEN_PALM = 'OPEN_PALM',
  FIST = 'FIST',
  PINCH = 'PINCH'
}

export interface ParticleConfig {
  count: number;
  types: string[]; // Emojis and shapes
}

export interface PhotoData {
  id: string;
  url: string;
  aspectRatio: number;
  texture?: any; // THREE.Texture
}

export interface UIConfig {
  // Title
  titleScale: number;
  titleColorStart: string;
  titleColorMid: string;
  titleColorEnd: string;
  titleShadowOpacity: number;
  titleOffsetX: number;
  titleOffsetY: number;
  
  // Container
  containerBgColor: string;
  containerBgOpacity: number;
  containerBlur: number;
  containerBorderOpacity: number;
  containerShineOpacity: number;
  containerPaddingX: number;
  containerPaddingY: number;
  containerOffsetX: number;
  containerOffsetY: number;
}
