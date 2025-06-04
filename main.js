import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

let scene, camera, renderer;
let controller1, controller2, controllerGrip1, controllerGrip2;
let fruits = [];
const clock = new THREE.Clock();
let score = 0;
let scoreText;

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

    // Cargar fuente y crear texto
    const fontLoader = new FontLoader();
    fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
        const geometry = new TextGeometry(`Puntos: ${score}`, {
            font: font,
            size: 0.1,
            height: 0.01,
        });
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        scoreText = new THREE.Mesh(geometry, material);
        scoreText.position.set(-0.5, 2.0, -1);
        scene.add(scoreText);
    });

    // Controladores
    const controllerModelFactory = new XRControllerModelFactory();

    controller1 = renderer.xr.getController(0);
    controller2 = renderer.xr.getController(1);
    scene.add(controller1);
    scene.add(controller2);

    controllerGrip1 = renderer.xr.getControllerGrip(0);
    controllerGrip2 = renderer.xr.getControllerGrip(1);
    controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
    controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
    scene.add(controllerGrip1);
    scene.add(controllerGrip2);

    // Añadir espadas a ambos controladores
    addSwordToController(controller1);
    addSwordToController(controller2);
}

function addSwordToController(controller) {
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

        const swords = [controller1, controller2]
            .map(c => c.userData.sword)
            .filter(s => s);

        for (let sword of swords) {
            const swordPos = new THREE.Vector3();
            sword.getWorldPosition(swordPos);

            if (fruit.position.distanceTo(swordPos) < 0.15) {
                scene.remove(fruit);
                fruits.splice(i, 1);
                score++;
                updateScoreText();
                return;
            }
        }

        if (fruit.position.z > 1.5) {
            scene.remove(fruit);
            fruits.splice(i, 1);
        }
    });

    renderer.render(scene, camera);
}

function updateScoreText() {
    if (!scoreText) return;
    const fontLoader = new FontLoader();
    fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
        scene.remove(scoreText);
        const geometry = new TextGeometry(`Puntos: ${score}`, {
            font: font,
            size: 0.1,
            height: 0.01,
        });
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        scoreText = new THREE.Mesh(geometry, material);
        scoreText.position.set(-0.5, 2.0, -1);
        scene.add(scoreText);
    });
}
