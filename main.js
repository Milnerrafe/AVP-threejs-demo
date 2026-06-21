import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

function main() {
  const canvas = document.querySelector("#c");
  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

  const fov = 45;
  const aspect = 2; // the canvas default
  const near = 0.1;
  const far = 100;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 10, 20);

  // Variables to manage custom orbit state
  let targetPoint = new THREE.Vector3(0, 10, 0); // Replaces controls.target
  let orbitRadius = 25; // Default fallback radius
  let angle = 100;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(
    window
      .getComputedStyle(document.querySelector("#div-1"))
      .getPropertyValue("background-color"),
  );

  {
    const skyColor = 0xb1e1ff; // light blue
    const groundColor = 0xb97a20; // brownish orange
    const intensity = 2;
    const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
    light.name = "normal-light";
    scene.add(light);
  }

  {
    const skyColor = 0x0000ee;
    const groundColor = 0x0000ee;
    const intensity = 3;
    const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
    light.name = "blue-light";
    light.visible = false;
    scene.add(light);
  }

  {
    const color = 0xffffff;
    const intensity = 2.5;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(5, 10, 2);
    scene.add(light);
    scene.add(light.target);
  }

  function frameArea(sizeToFitOnScreen, boxSize, boxCenter, camera) {
    const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.5;
    const halfFovY = THREE.MathUtils.degToRad(camera.fov * 0.5);
    const distance = halfSizeToFitOnScreen / Math.tan(halfFovY);

    const direction = new THREE.Vector3()
      .subVectors(camera.position, boxCenter)
      .multiply(new THREE.Vector3(1, 0, 1))
      .normalize();

    camera.position.copy(direction.multiplyScalar(distance).add(boxCenter));

    camera.near = boxSize / 100;
    camera.far = boxSize * 100;

    camera.updateProjectionMatrix();

    camera.lookAt(boxCenter.x, boxCenter.y, boxCenter.z);

    // Save the computed distance as our orbit radius
    orbitRadius = distance;
  }

  {
    const gltfLoader = new GLTFLoader();
    gltfLoader.load("/scene.gltf", (gltf) => {
      const root = gltf.scene;
      root.name = "AVP";

      scene.add(root);

      const box = new THREE.Box3().setFromObject(root);

      const boxSize = box.getSize(new THREE.Vector3()).length();
      const boxCenter = box.getCenter(new THREE.Vector3());

      // Set the camera to frame the box
      frameArea(boxSize * 1, boxSize, boxCenter, camera);

      // Capture the center point of the 3D model for our custom rotation center
      targetPoint.copy(boxCenter);
    });
  }

  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth * 10;
    const height = canvas.clientHeight * 10;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }

    return needResize;
  }

  function render() {
    scene.background = new THREE.Color(
      window
        .getComputedStyle(document.querySelector("#div-1"))
        .getPropertyValue("background-color"),
    );

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    // --- CUSTOM CAMERA MOVEMENT SYSTEM ---
    // 1. Advance the angle over time
    let rotationSpeed = parseFloat(
      window
        .getComputedStyle(document.querySelector("#c"))
        .getPropertyValue("--rotationSpeed") || 0.01,
    );
    //

    angle += rotationSpeed;

    // 2. Compute the circular X and Z offsets around the target point
    camera.position.x = targetPoint.x + Math.cos(angle) * orbitRadius;
    camera.position.z = targetPoint.z + Math.sin(angle) * orbitRadius;

    // Keep the Y height fixed to what frameArea calculated
    // 3. Force the camera to look precisely at our center anchor point
    camera.lookAt(targetPoint);

    renderer.render(scene, camera);

    const texture = window
      .getComputedStyle(document.querySelector("#c"))
      .getPropertyValue("--texture");

    if (texture == "gold") {
      const filterMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
      });
      scene.getObjectByName("normal-light").visible = false;
      scene.getObjectByName("blue-light").visible = true;

      scene.overrideMaterial = filterMaterial;
    } else {
      scene.overrideMaterial = null;

      scene.getObjectByName("normal-light").visible = true;
      scene.getObjectByName("blue-light").visible = false;
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

main();
