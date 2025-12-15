import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";

// ==========================================
// TYPES
// ==========================================

export interface MatrixRainConfig {
  fontSize: number;
  characters: string;
}

export interface ShatterFragment {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  rotationVelocity: THREE.Vector3;
}

// ==========================================
// PURE FUNCTIONS
// ==========================================

/**
 * Initialize drops array for rain effect
 */
export function initializeDrops(columns: number): number[] {
  return Array(columns).fill(1);
}

/**
 * Update single column drop
 */
export function updateDrop(
  drop: number,
  canvasHeight: number,
  fontSize: number,
): number {
  if (drop * fontSize > canvasHeight && Math.random() > 0.975) {
    return 0;
  }
  return drop + 1;
}

/**
 * Get random character from character set
 */
export function getRandomChar(characters: string): string {
  return characters[Math.floor(Math.random() * characters.length)];
}

/**
 * Calculate plane dimensions for FOV
 */
export function calculatePlaneDimensions(
  distance: number,
  fov: number,
  aspectRatio: number,
): { width: number; height: number } {
  const vFOV = (fov * Math.PI) / 180;
  const height = 2 * Math.tan(vFOV / 2) * distance;
  const width = height * aspectRatio;
  return { width, height };
}

/**
 * Create fragment velocity with random direction
 */
export function createFragmentVelocity(): THREE.Vector3 {
  const angle = Math.random() * Math.PI * 2;
  const speed = Math.random() * 0.1 + 0.05;
  return new THREE.Vector3(
    Math.cos(angle) * speed,
    Math.sin(angle) * speed - 0.05,
    (Math.random() - 0.5) * 0.5,
  );
}

/**
 * Create fragment rotation velocity
 */
export function createRotationVelocity(): THREE.Vector3 {
  return new THREE.Vector3(
    (Math.random() - 0.5) * 0.2,
    (Math.random() - 0.5) * 0.2,
    (Math.random() - 0.5) * 0.2,
  );
}

/**
 * Calculate shatter animation progress values
 */
export function calculateShatterProgress(
  elapsed: number,
  duration: number,
  startZ: number,
  startFOV: number,
): {
  progress: number;
  cameraZ: number;
  cameraFOV: number;
  decay: number;
} {
  const progress = Math.min(elapsed / duration, 1);
  const cameraProgress = Math.pow(progress, 3);
  return {
    progress,
    cameraZ: startZ - cameraProgress * 12,
    cameraFOV: startFOV + progress * 40,
    decay: Math.pow(1 - progress, 2),
  };
}

// ==========================================
// HOOKS
// ==========================================

const DEFAULT_CONFIG: MatrixRainConfig = {
  fontSize: 14,
  characters:
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()_+-=[]{}|;:,.<>?",
};

export interface UseMatrixRainOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isActive: boolean;
  phase: string;
  config?: Partial<MatrixRainConfig>;
}

export interface UseMatrixRainReturn {
  sceneRef: React.MutableRefObject<THREE.Scene | null>;
  cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>;
  rendererRef: React.MutableRefObject<THREE.WebGLRenderer | null>;
  textureRef: React.MutableRefObject<THREE.CanvasTexture | null>;
}

export function useMatrixRain({
  containerRef,
  isActive,
  phase,
  config = {},
}: UseMatrixRainOptions): UseMatrixRainReturn {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);

  const { fontSize, characters } = { ...DEFAULT_CONFIG, ...config };

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const aspectRatio = window.innerWidth / window.innerHeight;
    const camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    camera.position.z = 2;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const canvas = document.createElement("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const columns = Math.floor(canvas.width / fontSize);
    const drops = initializeDrops(columns);

    // Pre-populate rain if not in typing phase
    if (isActive) {
      for (let i = 0; i < 20; i++) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#00ff41";
        ctx.font = `${fontSize}px monospace`;
        for (let j = 0; j < drops.length; j++) {
          const text = getRandomChar(characters);
          ctx.fillText(text, j * fontSize, drops[j] * fontSize);
          drops[j] = updateDrop(drops[j], canvas.height, fontSize);
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    textureRef.current = texture;

    // Create layered planes
    const layers = [0, -1, -2];
    layers.forEach((z, index) => {
      const distance = 2 - z;
      const { width, height } = calculatePlaneDimensions(
        distance,
        75,
        aspectRatio,
      );

      const planeGeometry = new THREE.PlaneGeometry(width, height);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 1 - index * 0.3,
      });
      const plane = new THREE.Mesh(planeGeometry, material);
      plane.position.z = z;
      scene.add(plane);
    });

    let animationId: number;
    const render = () => {
      if ((isActive || phase === "glitch") && phase !== "shatter") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#00ff41";
        ctx.font = `${fontSize}px monospace`;

        for (let i = 0; i < drops.length; i++) {
          const text = getRandomChar(characters);
          ctx.fillText(text, i * fontSize, drops[i] * fontSize);
          drops[i] = updateDrop(drops[i], canvas.height, fontSize);
        }
        texture.needsUpdate = true;
      }

      if (phase !== "shatter" && phase !== "complete") {
        renderer.render(scene, camera);
        animationId = requestAnimationFrame(render);
      }
    };
    render();

    return () => {
      cancelAnimationFrame(animationId);
      renderer.dispose();
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [isActive, containerRef, fontSize, characters, phase]);

  return { sceneRef, cameraRef, rendererRef, textureRef };
}

export interface UseTypingEffectOptions {
  messages: string[];
  isActive: boolean;
  onComplete: () => void;
}

export interface UseTypingEffectReturn {
  typingText: string;
  showCursor: boolean;
}

export function useTypingEffect({
  messages,
  isActive,
  onComplete,
}: UseTypingEffectOptions): UseTypingEffectReturn {
  const [typingText, setTypingText] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  // Typing animation
  useEffect(() => {
    if (!isActive) return;

    let currentMessageIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;
    let timeoutId: NodeJS.Timeout;

    const type = () => {
      const currentMessage = messages[currentMessageIndex];

      if (isDeleting) {
        setTypingText(currentMessage.substring(0, currentCharIndex - 1));
        currentCharIndex--;
      } else {
        setTypingText(currentMessage.substring(0, currentCharIndex + 1));
        currentCharIndex++;
      }

      let typeSpeed = 100;
      if (isDeleting) typeSpeed /= 2;

      if (!isDeleting && currentCharIndex === currentMessage.length) {
        typeSpeed = 2000;
        isDeleting = true;
      } else if (isDeleting && currentCharIndex === 0) {
        isDeleting = false;
        currentMessageIndex++;
        typeSpeed = 500;

        if (currentMessageIndex === messages.length) {
          onComplete();
          return;
        }
      }

      timeoutId = setTimeout(type, typeSpeed);
    };

    timeoutId = setTimeout(type, 1000);
    return () => clearTimeout(timeoutId);
  }, [isActive, messages, onComplete]);

  // Cursor blinking
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => setShowCursor((prev) => !prev), 500);
    return () => clearInterval(interval);
  }, [isActive]);

  return { typingText, showCursor };
}

// Need to import useState at top
import { useState } from "react";

export interface UseShatterAnimationOptions {
  sceneRef: React.MutableRefObject<THREE.Scene | null>;
  cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>;
  rendererRef: React.MutableRefObject<THREE.WebGLRenderer | null>;
  textureRef: React.MutableRefObject<THREE.CanvasTexture | null>;
  isActive: boolean;
  onComplete: () => void;
}

export function useShatterAnimation({
  sceneRef,
  cameraRef,
  rendererRef,
  textureRef,
  isActive,
  onComplete,
}: UseShatterAnimationOptions): void {
  useEffect(() => {
    if (!isActive) return;

    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    const texture = textureRef.current;

    if (!scene || !camera || !renderer || !texture) return;

    // Clear existing scene
    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }

    const aspectRatio = window.innerWidth / window.innerHeight;
    const gridSegments = 15;
    const layers = [0, -1, -2];
    const fragments: ShatterFragment[] = [];

    // Create fragments for each layer
    layers.forEach((layerZ, layerIndex) => {
      const distance = 2 - layerZ;
      const { width: totalWidth, height: totalHeight } =
        calculatePlaneDimensions(distance, 75, aspectRatio);
      const fragmentWidth = totalWidth / gridSegments;
      const fragmentHeight = totalHeight / gridSegments;

      for (let i = 0; i < gridSegments; i++) {
        for (let j = 0; j < gridSegments; j++) {
          const geometry = new THREE.PlaneGeometry(
            fragmentWidth,
            fragmentHeight,
          );
          const material = new THREE.MeshBasicMaterial({
            map: texture.clone(),
            transparent: true,
            side: THREE.DoubleSide,
            opacity: 1 - layerIndex * 0.3,
          });

          material.map!.offset.x = i / gridSegments;
          material.map!.offset.y = j / gridSegments;
          material.map!.repeat.x = 1 / gridSegments;
          material.map!.repeat.y = 1 / gridSegments;

          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.x =
            (i - gridSegments / 2) * fragmentWidth + fragmentWidth / 2;
          mesh.position.y =
            (j - gridSegments / 2) * fragmentHeight + fragmentHeight / 2;
          mesh.position.z = layerZ;

          scene.add(mesh);
          fragments.push({
            mesh,
            velocity: createFragmentVelocity(),
            rotationVelocity: createRotationVelocity(),
          });
        }
      }
    });

    const startTime = Date.now();
    const duration = 4000;
    const startZ = camera.position.z;
    const startFOV = camera.fov;

    const animateShatter = () => {
      const elapsed = Date.now() - startTime;
      const { progress, cameraZ, cameraFOV, decay } = calculateShatterProgress(
        elapsed,
        duration,
        startZ,
        startFOV,
      );

      camera.position.z = cameraZ;
      camera.fov = cameraFOV;
      camera.updateProjectionMatrix();

      fragments.forEach(({ mesh, velocity, rotationVelocity }) => {
        mesh.position.add(velocity.clone().multiplyScalar(decay));
        velocity.y += 0.003;

        mesh.rotation.x += rotationVelocity.x;
        mesh.rotation.y += rotationVelocity.y;
        mesh.rotation.z += rotationVelocity.z;

        if (mesh.material instanceof THREE.MeshBasicMaterial) {
          mesh.material.opacity = Math.max(0, 1 - progress * 0.8);
        }
        mesh.scale.setScalar(Math.max(0.5, 1 - progress * 0.2));
      });

      renderer.render(scene, camera);

      if (progress < 1) {
        requestAnimationFrame(animateShatter);
      } else {
        onComplete();
      }
    };

    animateShatter();
  }, [isActive, sceneRef, cameraRef, rendererRef, textureRef, onComplete]);
}
