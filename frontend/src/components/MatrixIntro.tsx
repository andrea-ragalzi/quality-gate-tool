"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { MATRIX_MESSAGES } from "@/data/matrix-messages";

interface MatrixIntroProps {
  phase: "matrix" | "glitch" | "crack" | "shatter" | "complete";
  username?: string;
  onGlitchStart: () => void;
  onCrackStart: () => void;
  onShatterStart: () => void;
  onShatterComplete: () => void;
  onSkip?: () => void;
}

const MatrixIntro = ({
  phase,
  username = "Username",
  onGlitchStart,
  onCrackStart,
  onShatterStart,
  onShatterComplete,
  onSkip,
}: MatrixIntroProps) => {
  const [typingText, setTypingText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [introPhase, setIntroPhase] = useState<"typing" | "rain">("typing");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const threeContainerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const dropsRef = useRef<number[]>([]);
  const columnsRef = useRef(0);
  const animationIdRef = useRef<number | undefined>(undefined);

  const fontSize = 14;
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()_+-=[]{}|;:,.<>?";

  // Typing Effect Logic
  useEffect(() => {
    if (introPhase !== "typing") return;

    // Select a random message set
    const randomMessage =
      MATRIX_MESSAGES[Math.floor(Math.random() * MATRIX_MESSAGES.length)];
    const messages = randomMessage.lines.map((line) =>
      line.replace("{username}", username),
    );

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

      if (isDeleting) {
        typeSpeed /= 2;
      }

      if (!isDeleting && currentCharIndex === currentMessage.length) {
        typeSpeed = 2000; // Pause at end of message
        isDeleting = true;
      } else if (isDeleting && currentCharIndex === 0) {
        isDeleting = false;
        currentMessageIndex++;
        typeSpeed = 500; // Pause before next message

        if (currentMessageIndex === messages.length) {
          setIntroPhase("rain");
          return;
        }
      }

      timeoutId = setTimeout(type, typeSpeed);
    };

    timeoutId = setTimeout(type, 1000); // Initial delay

    return () => clearTimeout(timeoutId);
  }, [introPhase, username]);

  // Transition from Rain to Glitch
  useEffect(() => {
    if (introPhase === "rain") {
      // Let the rain fall for a few seconds before starting the glitch/shatter sequence
      const timer = setTimeout(() => {
        onGlitchStart();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [introPhase, onGlitchStart]);

  // Cursor Blinking
  useEffect(() => {
    if (introPhase !== "typing") return;
    const interval = setInterval(() => setShowCursor((prev) => !prev), 500);
    return () => clearInterval(interval);
  }, [introPhase]);

  // Initialize Three.js and Matrix Rain
  useEffect(() => {
    // Always initialize Three.js, but maybe keep it hidden or paused if typing
    if (!threeContainerRef.current) return;

    // Setup Three.js Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const aspectRatio = window.innerWidth / window.innerHeight;
    const camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    camera.position.z = 2;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    threeContainerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Setup Matrix Canvas (Offscreen)
    const canvas = document.createElement("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Initial black fill to prevent flicker
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Matrix Rain Logic
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);

    // Pre-warm the matrix effect so it's not empty on first frame
    if (introPhase !== "typing") {
      for (let i = 0; i < 20; i++) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#00ff41";
        ctx.font = `${fontSize}px monospace`;
        for (let j = 0; j < drops.length; j++) {
          const text =
            characters[Math.floor(Math.random() * characters.length)];
          ctx.fillText(text, j * fontSize, drops[j] * fontSize);
          if (drops[j] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[j] = 0;
          }
          drops[j]++;
        }
      }
    }

    // Create Texture from Canvas
    const texture = new THREE.CanvasTexture(canvas);
    textureRef.current = texture;

    // Create 3 Layers of Planes for Depth
    const layers = [0, -1, -2];
    layers.forEach((z, index) => {
      const distance = 2 - z; // Camera is at z=2
      const vFOV = (75 * Math.PI) / 180;
      const planeHeight = 2 * Math.tan(vFOV / 2) * distance;
      const planeWidth = planeHeight * aspectRatio;

      const planeGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 1 - index * 0.3, // Fade out back layers: 1, 0.7, 0.4
      });
      const plane = new THREE.Mesh(planeGeometry, material);
      plane.position.z = z;
      scene.add(plane);
    });

    // Animation Loop
    let animationId: number;
    const render = () => {
      // Only draw rain if we are in the 'rain' intro phase or beyond
      if (
        (introPhase === "rain" || phase === "glitch") &&
        phase !== "shatter"
      ) {
        // Draw Matrix Rain
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#00ff41";
        ctx.font = `${fontSize}px monospace`;

        for (let i = 0; i < drops.length; i++) {
          const text =
            characters[Math.floor(Math.random() * characters.length)];
          ctx.fillText(text, i * fontSize, drops[i] * fontSize);
          if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i]++;
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
      if (threeContainerRef.current) {
        threeContainerRef.current.innerHTML = "";
      }
    };
  }, [introPhase]); // Re-run when introPhase changes

  // Phase transitions
  useEffect(() => {
    if (phase === "glitch") {
      const timer = setTimeout(onCrackStart, 1500);
      return () => clearTimeout(timer);
    }
    if (phase === "crack") {
      const timer = setTimeout(onShatterStart, 150);
      return () => clearTimeout(timer);
    }
    if (phase === "shatter") {
      // SHATTER phase logic (fragmentation)
      if (
        !sceneRef.current ||
        !textureRef.current ||
        !rendererRef.current ||
        !cameraRef.current
      )
        return;

      const scene = sceneRef.current;
      const texture = textureRef.current;
      const renderer = rendererRef.current;
      const camera = cameraRef.current;

      // Clear old plane
      while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
      }

      // Create fragments
      const aspectRatio = window.innerWidth / window.innerHeight;
      const gridSegments = 15;
      const layers = [0, -1, -2];

      const fragments: Array<{
        mesh: THREE.Mesh;
        velocity: THREE.Vector3;
        rotationVelocity: THREE.Vector3;
      }> = [];

      layers.forEach((layerZ, layerIndex) => {
        // Calculate dimensions for this layer's depth
        const distance = 2 - layerZ;
        const vFOV = (75 * Math.PI) / 180;
        const totalHeight = 2 * Math.tan(vFOV / 2) * distance;
        const totalWidth = totalHeight * aspectRatio;
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

            // Position
            mesh.position.x =
              (i - gridSegments / 2) * fragmentWidth + fragmentWidth / 2;
            mesh.position.y =
              (j - gridSegments / 2) * fragmentHeight + fragmentHeight / 2;
            mesh.position.z = layerZ;

            // Velocity
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 0.1 + 0.05;
            const velocity = new THREE.Vector3(
              Math.cos(angle) * speed,
              Math.sin(angle) * speed - 0.05,
              (Math.random() - 0.5) * 0.5, // Increased Z randomness for depth
            );
            const rotationVelocity = new THREE.Vector3(
              (Math.random() - 0.5) * 0.2,
              (Math.random() - 0.5) * 0.2,
              (Math.random() - 0.5) * 0.2,
            );

            scene.add(mesh);
            fragments.push({ mesh, velocity, rotationVelocity });
          }
        }
      });

      // Animation loop for shatter
      const startTime = Date.now();
      const duration = 4000; // Slower, more majestic fall (was 2500)
      const startZ = camera.position.z;
      const startFOV = camera.fov;

      const animateShatter = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Move camera forward into the matrix (from z=2 to z=-10)
        // This simulates falling/diving deep into the code
        const cameraProgress = Math.pow(progress, 3); // Cubic ease in for rush effect
        camera.position.z = startZ - cameraProgress * 12;

        // Widen FOV to simulate "warp speed" / falling sensation
        camera.fov = startFOV + progress * 40; // 75 -> 115
        camera.updateProjectionMatrix();

        const decay = Math.pow(1 - progress, 2);

        fragments.forEach(({ mesh, velocity, rotationVelocity }) => {
          // Fragments move outward
          mesh.position.add(velocity.clone().multiplyScalar(decay));

          // Gravity pulls them UP relative to us falling DOWN
          // Reduced gravity effect since animation is longer
          velocity.y += 0.003;

          mesh.rotation.x += rotationVelocity.x;
          mesh.rotation.y += rotationVelocity.y;
          mesh.rotation.z += rotationVelocity.z;

          if (mesh.material instanceof THREE.MeshBasicMaterial) {
            // Fade out slower to see fragments passing by
            mesh.material.opacity = Math.max(0, 1 - progress * 0.8);
          }
          // Keep them large as we fly past them
          mesh.scale.setScalar(Math.max(0.5, 1 - progress * 0.2));
        });

        renderer.render(scene, camera);

        if (progress < 1) {
          requestAnimationFrame(animateShatter);
        } else {
          onShatterComplete();
        }
      };
      animateShatter();
    }
  }, [phase]);

  if (phase === "complete") return null;

  const getContainerClass = () => {
    const baseClass = "matrix-intro__canvas-container";
    if (phase === "glitch") return `${baseClass} ${baseClass}--glitch`;
    if (phase === "matrix") return `${baseClass} ${baseClass}--rain`;
    return baseClass;
  };

  return (
    <div className="matrix-intro" style={{ backgroundColor: "black" }}>
      <div ref={threeContainerRef} className={getContainerClass()} />

      {phase === "crack" && (
        <div className="matrix-intro__crack">
          <svg
            className="matrix-intro__crack-svg"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path d="M50 50 L20 10" stroke="white" strokeWidth="0.5" />
            <path d="M50 50 L80 15" stroke="white" strokeWidth="0.5" />
            <path d="M50 50 L90 50" stroke="white" strokeWidth="0.5" />
            <path d="M50 50 L85 85" stroke="white" strokeWidth="0.5" />
            <path d="M50 50 L50 95" stroke="white" strokeWidth="0.5" />
            <path d="M50 50 L15 80" stroke="white" strokeWidth="0.5" />
            <path d="M50 50 L10 50" stroke="white" strokeWidth="0.5" />
            <path d="M50 50 L25 25" stroke="white" strokeWidth="0.5" />
          </svg>
        </div>
      )}

      {introPhase === "typing" && (
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "10%",
            color: "#00ff41",
            fontFamily: "monospace",
            fontSize: "2rem",
            fontWeight: "bold",
            textShadow: "0 0 10px #00ff41",
            zIndex: 1020,
          }}
        >
          {typingText}
          <span style={{ opacity: showCursor ? 1 : 0 }}>_</span>
        </div>
      )}

      <button
        onClick={onSkip}
        style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          background: "transparent",
          border: "1px solid #00ff41",
          color: "#00ff41",
          padding: "8px 16px",
          fontFamily: "monospace",
          cursor: "pointer",
          zIndex: 2000,
          opacity: 0.7,
          transition: "opacity 0.3s",
          textTransform: "uppercase",
          letterSpacing: "2px",
          pointerEvents: "auto",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
      >
        [ JUMP ]
      </button>
    </div>
  );
};

export default MatrixIntro;
