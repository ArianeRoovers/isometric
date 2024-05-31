import GUI from "lil-gui";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

/**
 * Base
 */
// Debug
const gui = new GUI({ width: 400, title: "Debug", closeFolders: true });

gui.close();
gui.hide();

const cameraTweaks = gui.addFolder("Camera");
const helpersTweaks = gui.addFolder("Helpers");

if (window.location.hash === "#debug") {
  gui.show();
}

const debugObject = {};

const loadingBarBackground = document.querySelector(".loading-background");
const loadingBarElement = document.querySelector(".loading-bar");
const percentage = document.querySelector(".percentage");

let sceneReady = false;
const loadingManager = new THREE.LoadingManager(
  () => {
    window.setTimeout(() => {
      loadingBarBackground.classList.add("ended");
      loadingBarBackground.style.transform = "";
      loadingBarElement.classList.add("ended");
      percentage.classList.add("ended");
      loadingBarElement.style.transform = "";
      percentage.style.transform = "";
      window.setTimeout(() => {
        loadingBarBackground.remove();
        loadingBarElement.remove();
        percentage.remove();
      }, 5000);
    }, 500);
    window.setTimeout(() => {
      sceneReady = true;
    }, 3500);
  },
  (itemUrl, itemsLoaded, itemsTotal) => {
    const progressRatio = itemsLoaded / itemsTotal;
    loadingBarElement.style.transform = `scaleX(${progressRatio})`;
    percentage.innerText = `${(progressRatio * 100).toFixed(0)} %`;
  }
);

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader(loadingManager);

// Draco loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("draco/");

// GLTF loader
const gltfLoader = new GLTFLoader(loadingManager);
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * Textures
 */
const bakedTexture1 = textureLoader.load("/textures/Klaarr.jpg");
bakedTexture1.flipY = false;
bakedTexture1.colorSpace = THREE.SRGBColorSpace;

const globeTexture = textureLoader.load("/textures/Earth.jpg");

// Emission
const lampMaterial = new THREE.MeshBasicMaterial({
  color: 0xb4b4b4,
});
const tungstenMaterial = new THREE.MeshBasicMaterial({
  color: 0x454545,
});
const easterEggMaterial = new THREE.MeshBasicMaterial({
  color: 0xffe39d,
});

/**
 * Materials
 */

// Baked Material
const material1 = new THREE.MeshBasicMaterial({
  map: bakedTexture1,
});

/**
 * Animation Mixer
 */
let mixer;

/**
 * Load Model
 */
gltfLoader.load("/models/Finish/glTF/Finished.gltf", (gltf) => {
  gltf.scene.traverse((child) => {
    if (child.isMesh) {
      if (child.name === "Globe") {
        child.material = new THREE.MeshBasicMaterial({
          map: globeTexture,
          color: new THREE.Color(0x888888),
        });
      } else if (child.name === "Lamp") {
        child.material = lampMaterial;
      } else if (child.name === "Tungsten Piece") {
        child.material = tungstenMaterial;
      } else if (child.name === "EasterEgg") {
        child.material = easterEggMaterial;
      } else {
        // Apply the baked texture to other meshes
        child.material = material1;
      }

      if (child.name.includes("Glass")) {
        child.material = child.material.clone();
        child.material.transparent = true;
        child.material.opacity = 0.5;
      }
    }
  });

  scene.add(gltf.scene);

  if (gltf.animations && gltf.animations.length) {
    mixer = new THREE.AnimationMixer(gltf.scene);

    gltf.animations.forEach((clip) => {
      const action = mixer.clipAction(clip);
      action.play();
    });
  } else {
    console.warn("No animations found in the GLTF model.");
  }
});

const gridHelper = new THREE.GridHelper(10, 10);

helpersTweaks
  .add(
    {
      "Grid Helper": false,
    },
    "Grid Helper"
  )
  .onChange((value) => {
    if (value) {
      scene.add(gridHelper);
    } else {
      scene.remove(gridHelper);
    }
  });

const axesHelper = new THREE.AxesHelper(7);

helpersTweaks
  .add(
    {
      "Axes Helper": false,
    },
    "Axes Helper"
  )
  .onChange((value) => {
    if (value) {
      scene.add(axesHelper);
    } else {
      scene.remove(axesHelper);
    }
  });

/**
 * POI
 */

const points = [
  {
    position: new THREE.Vector3(
      -0.4437192976474762,
      1.5396040678024292,
      0.03709359748744965
    ), // EasterEgg
    element: document.querySelector(".point-0"),
  },
  {
    position: new THREE.Vector3(
      -3.8038618564605713,
      2.4747447967529297,
      -3.8307576179504395
    ), // Globe
    element: document.querySelector(".point-1"),
  },
  {
    position: new THREE.Vector3(
      3.4721550941467285,
      6.1099395751953125,
      -4.643520355224609
    ), // Clock
    element: document.querySelector(".point-2"),
  },
];

debugObject.poi = true;
gui
  .add(debugObject, "poi")
  .onChange((val) => {
    console.log(`Toggling POI visibility: ${val}`);
    for (const point of points) {
      if (!val) {
        point.element.classList.remove("visible");
        point.element.style.display = "none"; // Ensure element is hidden
      } else {
        point.element.classList.add("visible");
        point.element.style.display = "block"; // Ensure element is shown
      }
    }
  })
  .name("Points of Interest");

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  45,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.x = 16;
camera.position.y = 12;
camera.position.z = 16;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// Camera Limits
controls.minPolarAngle = Math.PI / 4;
controls.maxPolarAngle = Math.PI / 2;
controls.minAzimuthAngle = -Math.PI / 8;
controls.maxAzimuthAngle = Math.PI;

cameraTweaks.add(camera.position, "x", -50, 50, 0.1).name("Camera X");
cameraTweaks.add(camera.position, "y", -50, 50, 0.1).name("Camera Y");
cameraTweaks.add(camera.position, "z", -50, 50, 0.1).name("Camera Z");

cameraTweaks
  .add(camera.rotation, "x", -Math.PI, Math.PI, 0.01)
  .name("Rotation X");
cameraTweaks
  .add(camera.rotation, "y", -Math.PI, Math.PI, 0.01)
  .name("Rotation Y");
cameraTweaks
  .add(camera.rotation, "z", -Math.PI, Math.PI, 0.01)
  .name("Rotation Z");

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const raycaster = new THREE.Raycaster();

const clock = new THREE.Clock();
const tick = () => {
  const deltaTime = clock.getDelta();

  controls.update();

  if (mixer) {
    mixer.update(deltaTime);
  }

  if (sceneReady) {
    for (const point of points) {
      const screenPosition = point.position.clone();
      screenPosition.project(camera);

      raycaster.setFromCamera(screenPosition, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length === 0 && debugObject.poi) {
        point.element.classList.add("visible");
      } else {
        const intersectionDistance = intersects[0].distance;
        const pointDistance = point.position.distanceTo(camera.position);

        if (intersectionDistance < pointDistance) {
          point.element.classList.remove("visible");
        } else if (intersectionDistance > pointDistance && debugObject.poi) {
          point.element.classList.add("visible");
        }
      }

      const translateX = screenPosition.x * sizes.width * 0.5;
      const translateY = -screenPosition.y * sizes.height * 0.5;
      point.element.style.transform = `translateX(${translateX}px) translateY(${translateY}px)`;
    }
  }

  // Render
  renderer.render(scene, camera);

  window.requestAnimationFrame(tick);
};

tick();
