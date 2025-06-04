import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { XRButton } from 'three/addons/webxr/XRButton.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
let scene, camera, renderer;
let controller, controllerGrip;
let fruits = [];
const clock = new THREE.Clock();

init();
animate();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 1.6, 3);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;

    document.body.appendChild(renderer.domElement);
    document.body.appendChild(VRButton.createButton(renderer)); // este botón debe aparecer

    // Luces
    const light = new THREE.HemisphereLight(0xffffff, 0x444444);
    scene.add(light);

    // Piso
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(4, 4),
        new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Controlador
    controller = renderer.xr.getController(0);
    scene.add(controller);

    const controllerModelFactory = new XRControllerModelFactory();
    controllerGrip = renderer.xr.getControllerGrip(0);
    controllerGrip.add(controllerModelFactory.createControllerModel(controllerGrip));
    scene.add(controllerGrip);

    // Espada simple
    const swordGeometry = new THREE.BoxGeometry(0.02, 0.5, 0.02);
    const swordMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const sword = new THREE.Mesh(swordGeometry, swordMaterial);
    sword.position.y = -0.25;
    controller.add(sword);
    controller.userData.sword = sword;
}

function spawnFruit() {
    const fruit = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0x00ff00 })
    );
    fruit.position.set((Math.random() - 0.5) * 1.5, 1.0, -2);
    fruit.userData.velocity = new THREE.Vector3(0, 1.2, 3);
    scene.add(fruit);
    fruits.push(fruit);
}

function animate() {
    renderer.setAnimationLoop(render);
}

function render() {
    const delta = clock.getDelta();

    if (Math.random() < 0.03) spawnFruit();

    fruits.forEach((fruit, i) => {
        fruit.position.addScaledVector(fruit.userData.velocity, delta);

        const sword = controller.userData.sword;
        const swordPos = new THREE.Vector3();
        sword.getWorldPosition(swordPos);
        if (fruit.position.distanceTo(swordPos) < 0.15) {
            scene.remove(fruit);
            fruits.splice(i, 1);
        }

        if (fruit.position.z > 1.5) {
            scene.remove(fruit);
            fruits.splice(i, 1);
        }
    });

    renderer.render(scene, camera);
}
