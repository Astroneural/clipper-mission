const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Load background texture
const loader = new THREE.TextureLoader();
loader.load('models/pexels-free-nature-stock-7480.jpg', function(texture) {
    scene.background = texture;
});

// Camera lock state
let cameraLockedToSpacecraft = false;
let cameraLockedToPlanet = false;
const cameraLockButton = document.getElementById('cameraLockButton');
const cameraLockButton_planet = document.getElementById('cameraLockButton_planet');
const infoTextDiv = document.getElementById("infoText");
const infoTextPlanetDiv = document.getElementById("infoTextPlanet");
const mobileControls = document.querySelector('.mobile-controls');

// Function to toggle mobile controls visibility when info is shown
function toggleMobileControlsVisibility() {
    const isMobile = window.innerWidth <= 1024;
    const infoShown = cameraLockedToSpacecraft || cameraLockedToPlanet;
    if (isMobile) {
        if (infoShown) {
            mobileControls.style.display = 'none';
        } else {
            mobileControls.style.display = 'block';
        }
    }
}

cameraLockButton.addEventListener('click', () => {
    cameraLockedToSpacecraft = !cameraLockedToSpacecraft;
    if (cameraLockedToSpacecraft) {
        cameraLockedToPlanet = false;
        cameraLockButton_planet.textContent = "Info on Europa";
    }
    cameraLockButton.textContent = cameraLockedToSpacecraft ? "Back" : "Info on Europa Clipper";
    toggleMobileControlsVisibility();
});

cameraLockButton_planet.addEventListener('click', () => {
    cameraLockedToPlanet = !cameraLockedToPlanet;
    if (cameraLockedToPlanet) {
        cameraLockedToSpacecraft = false;
        cameraLockButton.textContent = "Info on Europa Clipper";
    }
    cameraLockButton_planet.textContent = cameraLockedToPlanet ? "Back" : "Info on Europa";
    toggleMobileControlsVisibility();
});

// Show and Close Instructions event handlers
const showInstructionsButton = document.getElementById("showInstructionsButton");
const instructionsDiv = document.getElementById("instructions");
const closeInstructionsButton = document.getElementById("closeInstructionsButton");

showInstructionsButton.addEventListener("click", () => {
    instructionsDiv.style.display = "flex";
});

closeInstructionsButton.addEventListener("click", () => {
    instructionsDiv.style.display = "none";
});

const ambientLight = new THREE.AmbientLight(0xffffff, 2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 4);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Create a planet group to contain both the planet model and geysers
const planetGroup = new THREE.Group();
scene.add(planetGroup);

// Load Planet from GLB
let planet;
const gltfLoader = new THREE.GLTFLoader();
gltfLoader.load('models/Europa_1_3138_2.glb', function(gltf) {
    planet = gltf.scene;
    planet.scale.set(.01, .01, .01);
    planet.position.set(0, 0, 0);
    planet.traverse(function(child) {
        if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 1,
                metalness: 1,
                map: child.material.map,
                normalMap: child.material.normalMap
            });
        }
    });
    planetGroup.add(planet);
}, undefined, function(error) {
    console.error(error);
});

// Spacecraft
let spacecraft;
gltfLoader.load('models/clipper_spacecraft.glb', function(gltf) {
    spacecraft = gltf.scene;
    spacecraft.scale.set(0.15, 0.15, 0.15);
    spacecraft.position.set(8, 0, 0); // Start in orbit
    spacecraft.traverse(function(child) {
        if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
                color: child.material.color || 0xffffff,
                roughness: 0.5,
                metalness: 1,
                map: child.material.map,
                normalMap: child.material.normalMap
            });
        }
    });
    scene.add(spacecraft);
}, undefined, function(error) {
    console.error(error);
});

camera.position.set(0, 10, 20);
camera.lookAt(new THREE.Vector3(0, 0, 0));

// Gravity
let velocity = new THREE.Vector3(0, 0.25, 0); // reduced initial speed
const gravityStrength = 0.005; // reduced gravity effect
const rotationSpeed = 0.005;

function checkCollision() {
    const distance = spacecraft.position.length();
    if (distance < 5.5) {
        alert("Game Over: Clipper crashed into Europa!");
        spacecraft.position.set(8, 0, 0);
        velocity.set(0, 0.25, 0);
    }
}

// Geyser Particles
const geyserParticles = [];
let geyserCollisionCount = 0;
const collisionCounterDiv = document.getElementById("collisionCounter");

function randomPointOnSphere(radius) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
}

function createGeyserParticle(surfacePoint) {
    const particleCount = 100;
    const geyserGroup = new THREE.Group();
    geyserGroup.position.copy(surfacePoint);
    planetGroup.add(geyserGroup);
    for (let i = 0; i < particleCount; i++) {
        const coneGeometry = new THREE.ConeGeometry(0.05, 0.125, 8);
        const coneMaterial = new THREE.MeshBasicMaterial({ color: 0x99ccff });
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);
        const offset = new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1
        );
        cone.position.copy(offset);
        cone.lookAt(offset.clone().add(surfacePoint.clone().normalize()));
        const speed = 0.05 + Math.random() * 0.1;
        const directionVariation = new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1
        );
        const direction = surfacePoint.clone().normalize().add(directionVariation).normalize();
        const particleVelocity = direction.multiplyScalar(speed);
        const lifetime = 300;
        geyserParticles.push({ 
            mesh: cone, 
            velocity: particleVelocity, 
            lifetime: lifetime,
            geyserGroup: geyserGroup
        });
        geyserGroup.add(cone);
    }
}

// Track geyser warnings
const upcomingGeysers = [];
const clock = new THREE.Clock();

function scheduleGeyser() {
    const surfacePoint = randomPointOnSphere(5);
    const markerGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const markerMesh = new THREE.Mesh(markerGeometry, markerMaterial);
    markerMesh.position.copy(surfacePoint);
    planetGroup.add(markerMesh);
    upcomingGeysers.push({ marker: markerMesh, surfacePoint, timeLeft: 5 });
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    planetGroup.rotation.y += rotationSpeed;
    if (spacecraft) {
        let direction = new THREE.Vector3().subVectors(new THREE.Vector3(0, 0, 0), spacecraft.position).normalize();
        let gravityForce = direction.multiplyScalar(gravityStrength);
        velocity.add(gravityForce);
        spacecraft.position.add(velocity);
        if (cameraLockedToSpacecraft) {
            camera.position.copy(spacecraft.position).add(new THREE.Vector3(0, 5, 2.5));
            camera.lookAt(spacecraft.position);
            spacecraft.rotation.x += 0.001;
            spacecraft.rotation.y += 0.001;
            spacecraft.rotation.z += 0.001;
        } else if (cameraLockedToPlanet) {
            cameraLockedToSpacecraft = false;
            if (planet) {
                const planetWorldPos = new THREE.Vector3();
                planet.getWorldPosition(planetWorldPos);
                camera.position.copy(planetWorldPos).add(new THREE.Vector3(0, 5, 10));
                camera.lookAt(planetWorldPos);
            }
        } else {
            if (camera.position.x !== 0 || camera.position.y !== 15 || camera.position.z !== 20) {
                camera.position.set(0, 10, 20);
                camera.lookAt(new THREE.Vector3(0, 0, 0));
            }
        }
        checkCollision();
    }

    // Display informational text for spacecraft and planet camera locks
    infoTextDiv.style.display = cameraLockedToSpacecraft ? "block" : "none";
    infoTextPlanetDiv.style.display = cameraLockedToPlanet ? "block" : "none";

    const collisionThreshold = 0.5;
    for (let i = geyserParticles.length - 1; i >= 0; i--) {
        const particle = geyserParticles[i];
        const particleWorldPos = new THREE.Vector3();
        particle.mesh.getWorldPosition(particleWorldPos);
        if (spacecraft && spacecraft.position.distanceTo(particleWorldPos) < collisionThreshold) {
            geyserCollisionCount++;
            collisionCounterDiv.innerHTML = `<span style="color: rgb(0, 238, 255);">Particles Collected: ${geyserCollisionCount}</span>`;
            particle.geyserGroup.remove(particle.mesh);
            geyserParticles.splice(i, 1);
        }
    }

    if (Math.random() < 0.02) {
        scheduleGeyser();
    }

    for (let i = upcomingGeysers.length - 1; i >= 0; i--) {
        upcomingGeysers[i].timeLeft -= delta;
        if (upcomingGeysers[i].timeLeft <= 0) {
            planetGroup.remove(upcomingGeysers[i].marker);
            createGeyserParticle(upcomingGeysers[i].surfacePoint);
            upcomingGeysers.splice(i, 1);
        } else if (upcomingGeysers[i].timeLeft <= 5) {
            upcomingGeysers[i].marker.material.color.set(0xf74a6a);
        }
    }

    for (let i = geyserParticles.length - 1; i >= 0; i--) {
        const particle = geyserParticles[i];
        particle.mesh.position.add(particle.velocity);
        particle.lifetime--;
        if (particle.lifetime <= 0) {
            particle.geyserGroup.remove(particle.mesh);
            geyserParticles.splice(i, 1);
        }
    }
    renderer.render(scene, camera);
}
animate();

window.addEventListener("keydown", (event) => {
    if (event.key === "w") velocity.z -= 0.025;
    if (event.key === "s") velocity.z += 0.025;
    if (event.key === "a") velocity.x -= 0.025;
    if (event.key === "d") velocity.x += 0.025;
    if (event.key === "q") velocity.y -= 0.025;
    if (event.key === "e") velocity.y += 0.025;
    if (!cameraLockedToSpacecraft) {
        camera.lookAt(new THREE.Vector3(0, 0, 0));
    }
});

// Reset spacecraft position
const resetButton = document.getElementById('resetButton');
resetButton.addEventListener('click', () => {
    spacecraft.position.set(8, 0, 0);
    velocity.set(0, 0.25, 0);
});

// Mobile controls implementation
const joystickContainer = document.getElementById('joystick-container');
const joystick = document.getElementById('joystick');
const upButton = document.getElementById('up-button');
const downButton = document.getElementById('down-button');

// Joystick variables
let joystickActive = false;
let joystickOrigin = { x: 0, y: 0 };
let joystickPosition = { x: 0, y: 0 };
const maxJoystickDistance = 40;

function initJoystick() {
    const rect = joystickContainer.getBoundingClientRect();
    joystickOrigin = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
    resetJoystick();
    toggleMobileControlsVisibility();
}

function resetJoystick() {
    joystick.style.left = '40px';
    joystick.style.top = '40px';
    joystickPosition = { x: 0, y: 0 };
}

// Joystick touch events
joystickContainer.addEventListener('touchstart', handleJoystickStart);
joystickContainer.addEventListener('touchmove', handleJoystickMove);
joystickContainer.addEventListener('touchend', handleJoystickEnd);

function handleJoystickStart(event) {
    event.preventDefault();
    joystickActive = true;
    updateJoystickPosition(event.touches[0]);
}

function handleJoystickMove(event) {
    if (joystickActive) {
        event.preventDefault();
        updateJoystickPosition(event.touches[0]);
    }
}

function handleJoystickEnd(event) {
    joystickActive = false;
    resetJoystick();
}

function updateJoystickPosition(touch) {
    const rect = joystickContainer.getBoundingClientRect();
    const deltaX = touch.clientX - (rect.left + rect.width / 2);
    const deltaY = touch.clientY - (rect.top + rect.height / 2);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distance > maxJoystickDistance) {
        const angle = Math.atan2(deltaY, deltaX);
        joystickPosition = {
            x: Math.cos(angle) * maxJoystickDistance,
            y: Math.sin(angle) * maxJoystickDistance
        };
    } else {
        joystickPosition = { x: deltaX, y: deltaY };
    }
    joystick.style.left = (40 + joystickPosition.x) + 'px';
    joystick.style.top = (40 + joystickPosition.y) + 'px';
    if (spacecraft) {
        velocity.x -= (joystickPosition.x / maxJoystickDistance) * 0.005;
        velocity.z += (joystickPosition.y / maxJoystickDistance) * 0.005;
    }
}

// Up/Down button touch events
let upButtonPressed = false;
let downButtonPressed = false;

upButton.addEventListener('touchstart', function(event) {
    event.preventDefault();
    upButtonPressed = true;
    applyYMovement();
});

upButton.addEventListener('touchend', function() {
    upButtonPressed = false;
});

downButton.addEventListener('touchstart', function(event) {
    event.preventDefault();
    downButtonPressed = true;
    applyYMovement();
});

downButton.addEventListener('touchend', function() {
    downButtonPressed = false;
});

function applyYMovement() {
    if (upButtonPressed) {
        velocity.y += 0.015;
    }
    if (downButtonPressed) {
        velocity.y -= 0.015;
    }
}

// Initialize controls when page loads
window.addEventListener('load', initJoystick);
window.addEventListener('resize', function() {
    initJoystick();
    toggleMobileControlsVisibility();
});

// Hide instructions overlay after a short delay
setTimeout(() => {
    instructionsDiv.style.display = "none";
}, 5000);
