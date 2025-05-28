// === Imports ===
import * as THREE from "three";
import gsap from "gsap";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "@studio-freight/lenis";

// === GSAP Setup ===
gsap.registerPlugin(ScrollTrigger);

// === Lenis Scroll Setup ===
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smooth: true,
  direction: "vertical",
  gestureDirection: "vertical",
  smoothTouch: false,
  touchMultiplier: 2,
  mouseMultiplier: 1,
  infinite: false,
});

// === Scene Setup ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 12, 0);
camera.lookAt(0, 0, 0);

const canvas = document.querySelector("canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

// === Lighting ===
scene.add(new THREE.AmbientLight(0xffffff, 1));
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 10, 10);
scene.add(light);

// === Texture Loading ===
const loader = new THREE.TextureLoader();
const textureUrls = Array.from({ length: 24 }, (_, i) => `/img${i + 1}.avif`);

function loadTexture(url) {
  return new Promise((resolve, reject) => {
    loader.load(url, (texture) => {
      texture.encoding = THREE.sRGBEncoding;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      resolve(texture);
    }, undefined, reject);
  });
}

// === Initialization ===
Promise.all(textureUrls.map(loadTexture)).then(initCubes);

// === Globals ===
let animationFinished = false;
let rotationDampingFactor = 1;
let isAutoScrolling = false;
let lastScrollPosition = 0;

// === Cube Initialization ===
function initCubes(textures) {
  const cubeGroup = new THREE.Group();
  const tiltGroup = new THREE.Group();
  tiltGroup.add(cubeGroup);
  scene.add(tiltGroup);

  const cubeCount = 24;
  const radius = 6.2;
  const cubes = [];
  const circlePositions = [];

  const lineSpacing = 1.5;
  const totalLineWidth = (cubeCount - 1) * lineSpacing;
  const lineStartX = -totalLineWidth / 2;

  const zoomedY = 9;
  const zoomedZ = 6.5;

  const positions = [
    [-18, 0, 4], [-16, 0, -2], [-14, 0, 6], [-12, 0, -5],
    [-10, 0, 3], [-8, 0, -1], [-6, 0, 7], [-4, 0, -6],
    [-2, 0, 2], [0, 0, 0], [2, 0, -3], [4, 0, 5],
    [-9, 0, -3], [-3, 0, 8], [3, 0, -6], [9, 0, 4],
    [6, 0, -7], [8, 0, 1], [10, 0, -4], [12, 0, 6],
    [14, 0, -8], [16, 0, 3], [18, 0, -2], [-15, 0, 2],
  ];

  // Create cubes
  for (let i = 0; i < cubeCount; i++) {
    const geometry = new RoundedBoxGeometry(1.0, 0.08, 1.3, 5, 0.05);
    const material = new THREE.MeshStandardMaterial({
      map: textures[i],
      transparent: true,
      opacity: 0,
      depthWrite: false,
      premultipliedAlpha: true,
      dithering: true,
    });

    const cube = new THREE.Mesh(geometry, material);
    cube.userData = { index: i, clickable: true };

    const [x, y, z] = positions[i];
    cube.position.set(x, y, z);
    cubeGroup.add(cube);
    cubes.push(cube);

    const angle = (i / cubeCount) * Math.PI * 2;
    circlePositions.push(new THREE.Vector3(radius * Math.cos(angle), 0, radius * Math.sin(angle)));
  }

  createTimeline(cubeGroup, cubes, circlePositions, lineStartX, lineSpacing);
  handleMouseInteraction(cubes, camera, cubeGroup, tiltGroup);
  handleClickEvents(cubes, camera);
  setupScrollListener(cubeGroup, cubes, zoomedY, zoomedZ);
}

// === GSAP Timeline ===
function createTimeline(group, cubes, circlePositions, lineStartX, spacing) {
  const tl = gsap.timeline({ delay: 0.5 });

  cubes.forEach((cube, i) => {
    tl.to(cube.material, { opacity: 1, duration: 0.8, ease: "power2.inOut" }, i * 0.05);
  });

  tl.to(cubes.map((c) => c.position), {
    x: (i) => lineStartX + i * spacing,
    y: 0,
    z: 0,
    duration: 1.0,
    ease: "power2.inOut",
    stagger: 0.03,
  }, ">");

  // Fold to side view
  tl.addLabel("foldToSide");
  tl.to(cubes.map((c, i) => c.position), {
    x: (i) => circlePositions[i].x,
    y: (i) => circlePositions[i].z,
    z: 0,
    duration: 1.2,
    ease: "power2.inOut",
    stagger: 0.02,
  }, "foldToSide");
  tl.to(group.rotation, {
    x: Math.PI * 0.15,
    duration: 1.2,
    ease: "power2.inOut",
  }, "foldToSide");
  tl.to(cubes.map(c => c.rotation), {
    x: 0, y: 0, z: 0,
    duration: 1.2,
    ease: "power2.inOut",
    stagger: 0.02
  }, "foldToSide");

  // Expand to circle view
  tl.addLabel("expandToFront");
  tl.to(cubes.map((c, i) => c.position), {
    x: (i) => circlePositions[i].x,
    y: 0,
    z: (i) => circlePositions[i].z,
    duration: 1.5,
    ease: "power2.inOut",
    stagger: 0.03
  }, "expandToFront-=0.2");
  tl.to(group.rotation, {
    x: 0,
    y: Math.PI,
    duration: 1.5,
    ease: "power2.inOut"
  }, "expandToFront-=0.2");
  tl.to(cubes.map((c, i) => c.rotation), {
    y: (i) => Math.atan2(-circlePositions[i].x, -circlePositions[i].z),
    duration: 1.2,
    ease: "power2.inOut",
    stagger: 0.03
  }, "expandToFront-=0.2");

  tl.eventCallback("onComplete", () => animationFinished = true);
}

// === Mouse Interactivity ===
function handleMouseInteraction(cubes, camera, cubeGroup, tiltGroup) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const maxDistance = 5;

  window.addEventListener("mousemove", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  });

  function animateMouse() {
    raycaster.setFromCamera(mouse, camera);

    if (animationFinished) {
      cubes.forEach((cube) => {
        const cubePos = new THREE.Vector3();
        cube.getWorldPosition(cubePos);

        const rayOrigin = raycaster.ray.origin;
        const rayDir = raycaster.ray.direction;
        const closestPoint = rayDir.clone().multiplyScalar(rayDir.dot(cubePos.clone().sub(rayOrigin))).add(rayOrigin);
        const distance = cubePos.distanceTo(closestPoint);

        let proximity = 1 - distance / maxDistance;
        proximity = THREE.MathUtils.clamp(proximity, 0, 1);

        const targetZRot = proximity * Math.PI * rotationDampingFactor;
        cube.rotation.z += (targetZRot - cube.rotation.z) * 0.12;

        const maxRaise = 2.5 * rotationDampingFactor;
        const targetY = maxRaise * proximity;
        cube.position.y += (targetY - cube.position.y) * 0.12;
      });

      const maxTilt = -0.075 * rotationDampingFactor;
      tiltGroup.rotation.x = THREE.MathUtils.lerp(tiltGroup.rotation.x, mouse.y * maxTilt, 0.12);
      tiltGroup.rotation.y = THREE.MathUtils.lerp(tiltGroup.rotation.y, mouse.x * -maxTilt, 0.12);
    }
  }

  // Animation Loop
  function animate() {
    lenis.raf(performance.now());
    animateMouse();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();
}

// === Click Interaction ===
function handleClickEvents(cubes, camera) {
  const raycaster = new THREE.Raycaster();

  window.addEventListener("click", (event) => {
    if (!animationFinished || isAutoScrolling) return;

    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cubes, true);

    if (intersects.length > 0 || (Math.abs(mouse.x) < 0.3 && Math.abs(mouse.y) < 0.3)) {
      autoScrollToBottom();
    }
  });
}

// === Scroll Transition Logic ===
function setupScrollListener(cubeGroup, cubes, zoomedY, zoomedZ) {
  lenis.on("scroll", (e) => {
    if (e.scroll < lastScrollPosition && isAutoScrolling) {
      isAutoScrolling = false;
    }

    lastScrollPosition = e.scroll;

    const scrollProgress = Math.min(e.scroll / (document.body.scrollHeight - window.innerHeight), 1);
    updateCubeLayout(cubeGroup, cubes, scrollProgress, zoomedY, zoomedZ);
  });
}

function updateCubeLayout(group, cubes, progress, zoomedY, zoomedZ) {
  if (!animationFinished) return;

  const ease = progress < 0.5
    ? 4 * progress ** 3
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

  group.rotation.y = Math.PI + (Math.PI * ease);
  group.position.set(0, zoomedY * ease, zoomedZ * ease);
  rotationDampingFactor = 1 - ease;

  cubes.forEach((cube) => {
    cube.rotation.z *= 0.85;
    cube.position.y *= 0.85;
  });
}

// === Smooth Auto-Scroll ===
function autoScrollToBottom() {
  if (isAutoScrolling) return;

  isAutoScrolling = true;
  const maxScroll = document.body.scrollHeight - window.innerHeight;

  lenis.scrollTo(maxScroll, {
    duration: 2.0,
    easing: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
    onComplete: () => isAutoScrolling = false,
  });
}

// === Resize Handling ===
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// === Cleanup ===
window.addEventListener("beforeunload", () => {
  lenis.destroy();
});
