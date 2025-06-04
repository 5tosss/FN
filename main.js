import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import * as THREE from 'three';
import { XRButton } from 'three/addons/webxr/XRButton.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';

let scene, camera, renderer;
let controller, controllerGrip;
let fruits = [];
const clock = new THREE.Clock();
let score = 0;
let scoreSprite;

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
    document.body.appendChild(VRButton.createButton(renderer));

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

    // Texto VR: puntaje
    scoreSprite = createTextSprite(`Puntos: ${score}`);
    scene.add(scoreSprite);
}

function createTextSprite(message) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext('2d');

    context.font = '64px Arial';
    context.fillStyle = 'white';
    context.fillText(message, 20, 100);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(1.5, 0.75, 1);
    return sprite;
}

function updateScoreSprite() {
    const canvas = scoreSprite.material.map.image;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = '64px Arial';
    context.fillStyle = 'white';
    context.fillText(`Puntos: ${score}`, 20, 100);
    scoreSprite.material.map.needsUpdate = true;
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
        if (!sword) return;

        const swordPos = new THREE.Vector3();
        sword.getWorldPosition(swordPos);

        if (fruit.position.distanceTo(swordPos) < 0.15) {
            scene.remove(fruit);
            fruits.splice(i, 1);
            score++;
            updateScoreSprite();
            return;
        }

        if (fruit.position.z > 1.5) {
            scene.remove(fruit);
            fruits.splice(i, 1);
        }
    });

    // HUD: texto sigue a la cámara
    if (scoreSprite) {
        const offset = new THREE.Vector3(0, 0.5, -1);
        offset.applyQuaternion(camera.quaternion);
        scoreSprite.position.copy(camera.position).add(offset);
    }

    renderer.render(scene, camera);
}
