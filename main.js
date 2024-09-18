import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import "./style.css";

console.log("ml5", ml5.version);
let video = document.getElementById("video");
video.setAttribute("width", 680);
video.setAttribute("height", 680);

let model, skeleton;
let bones;
let skinnedMesh;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(1, 2, -3);
camera.lookAt(0, 1, 0);

scene.background = new THREE.Color(0xa0a0a0);
scene.fog = new THREE.Fog(0xa0a0a0, 10, 50);

const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 3);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 3);
dirLight.position.set(-3, 10, -10);
dirLight.castShadow = true;
dirLight.shadow.camera.top = 2;
dirLight.shadow.camera.bottom = -2;
dirLight.shadow.camera.left = -2;
dirLight.shadow.camera.right = 2;
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 40;
scene.add(dirLight);

const mesh = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshPhongMaterial({ color: 0xcbcbcb, depthWrite: false }),
);
mesh.rotation.x = -Math.PI / 2;
mesh.receiveShadow = true;
scene.add(mesh);

const loader = new GLTFLoader();
loader.load( 'models/Soldier.glb', function ( gltf ) {
	model = gltf.scene;
	scene.add( model );

	model.traverse( function ( object ) {
		if ( object.isMesh ) object.castShadow = true;
	} );
	model.visible = true;

	skinnedMesh = model.getObjectByName('vanguard_Mesh');
	bones = skinnedMesh.skeleton.bones;
  bones.forEach(bone => {
      console.log(bone.name); // Log the names of the bones
  });
  console.log(skinnedMesh);

  // bones[5].position.y = 20;

	skeleton = new THREE.SkeletonHelper( model );
	skeleton.visible = true;
	console.log(skeleton)
	scene.add( skeleton );


});

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const blueMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
const cube = new THREE.Mesh(geometry, material);
cube.position.y = 1;
// scene.add(cube);
const sphereGeo = new THREE.SphereGeometry(0.1, 25, 25, 0, Math.PI * 2, 0, Math.PI * 2);
const sphere_1 = new THREE.Mesh(sphereGeo, material);
const sphere_2 = new THREE.Mesh(sphereGeo, blueMaterial);
sphere_1.position.y = 1;
sphere_2.position.y = 1;
sphere_2.position.x = -1;
scene.add(sphere_1);
scene.add(sphere_2);
// camera.position.z = 5;

// function animate() {
//   cube.rotation.x += 0.01;
//   cube.rotation.y += 0.01;
//   renderer.render(scene, camera);
// }
// renderer.setAnimationLoop(animate);
//
const map_to_space = (n, start1, stop1, start2, stop2) => {
  return (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;
};

const map_xy = (x, y) => {
  const new_x = map_to_space(x, 0, 680, 0, 3);
  const new_y = map_to_space(y, 0, 680, 3, 0);
  return [new_x, new_y];
};

const startCam = async () => {
  try {
    // Request access to the webcam
    await navigator.mediaDevices.getUserMedia({ video: true }).then(mediaStream => {
      video.srcObject = mediaStream; // Set the video element's source to the media stream
    });
    ml5.bodyPose(undefined, undefined, (bodyPose) => {
      bodyPose.detectStart(video, (results) => {
        const detection = results.at(0);
        if (!detection) return;
        // console.log(detection);
        // console.log(detection.left_shoulder, detection.right_shoulder);
        const [lx, ly] = map_xy(detection.left_shoulder.x, detection.left_shoulder.y);
        const [rx, ry] = map_xy(detection.right_shoulder.x, detection.right_shoulder.y);
        const [hx, hy] = map_xy(detection.nose.x, detection.nose.y);
        sphere_1.position.x = rx;
        sphere_1.position.y = ry;
        sphere_2.position.x = lx;
        sphere_2.position.y = ly;
        model.position.x = hx;
        model.position.y = hy;
        // requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      });
    });
  } catch (error) {
      console.error("Error accessing webcam: ", error);
  }
};

window.addEventListener('load', startCam);
