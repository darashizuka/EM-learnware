import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader';
import { FontLoader } from 'three/addons/loaders/FontLoader';
import { TextGeometry } from 'three/addons/geometries/TextGeometry';

// Initialize the scene, camera, and renderer for the main canvas
const mainCanvas = document.getElementById('mainCanvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xFFFFFF); 
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: mainCanvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
const mainCanvasWidth = window.innerWidth * 0.6; // 60% of the window width
const mainCanvasHeight = window.innerHeight * 0.6; // 60% of the window height
renderer.setSize(mainCanvasWidth, mainCanvasHeight);

document.body.appendChild(renderer.domElement);

// Function to create a line given two points and a color
function createLine(start, end, color) {
    const points = [start, end];
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(...p)));
    const material = new THREE.LineBasicMaterial({ color: color });
    return new THREE.Line(geometry, material);
}

// Create lines along the x, y, and z axes
const xAxis = createLine([-100, 0, 0], [100, 0, 0], 0x000000); // black
const yAxis = createLine([0, -100, 0], [0, 100, 0], 0x086A18); // Green
const zAxis = createLine([0, 0, -100], [0, 0, 100], 0x0000ff); // Blue

scene.add(xAxis);
scene.add(yAxis);
scene.add(zAxis);

// Function to create text labels for axes
function createAxisLabel(text, position) {
    const loader = new FontLoader();
    loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
        const textGeometry = new TextGeometry(text, {
            font: font,
            size: 5,
            height: 0.1,
        });
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 }); // Black color
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(...position);
        scene.add(textMesh);
    });
}


// Add labels to the axes
createAxisLabel('X', [100, 0, 0]);
createAxisLabel('Y', [0, 100, 0]);
createAxisLabel('Z', [0, 0, -100]);


// Add a red cuboid along the x-axis
const cylinderGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.4, 40); // Width, height, depth
const cylinderMaterial = new THREE.MeshBasicMaterial({ color: 0x898989 });
const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
cylinder.position.set(-1, 0, 0); // Position it along the x-axis
cylinder.rotation.z = Math.PI / 2;
scene.add(cylinder);

const fontLoader = new FontLoader();
fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 }); // Black color

    // Create "N" label
    const textGeometryN = new TextGeometry('N', {
        font: font,
        size: 0.2, // Adjust size as needed
        height: 0.01,
    });
    const textMeshN = new THREE.Mesh(textGeometryN, textMaterial);
    textMeshN.position.set(0, -0.4, 0); // Adjust position as needed
    textMeshN.rotation.z = Math.PI / 2;
    // Create "S" label
    const textGeometryS = new TextGeometry('S', {
        font: font,
        size: 0.2, // Adjust size as needed
        height: 0.01,
    });
    const textMeshS = new THREE.Mesh(textGeometryS, textMaterial);
    textMeshS.position.set(0, 0.2, 0); // Adjust position as needed
    textMeshS.rotation.z = Math.PI / 2;
    // Add labels as children to the cylinder
    cylinder.add(textMeshN);
    cylinder.add(textMeshS);
});

const segments = 100;
const radius = 0.5;
let numLoops = 1; // Change to let to allow modification

// Global magnet position
let magnetPosition = new THREE.Vector3(-1, 0, 0);
let previousMagnetPosition = magnetPosition.clone();
let previousCoilPosition = new THREE.Vector3(1, 0, 0);
let highlightIndex = 0;
const highlightLength = 20;
const highlightSpeed = 4;
let showHighlightedPart = true;

function createCoilGeometry(radius, numLoops, highlightIndex = null, highlightLength = 20) {
    const coilGeometry = new THREE.BufferGeometry();
    const vertices = [];
    const colors = [];

    let coilHeight = numLoops === 1 ? 0.01 : 0.6;
    if (numLoops === 1) {
        coilHeight = 0; // Adjust the height for a closed coil when loops is 1
    }

    const totalSegments = numLoops * segments;

    for (let i = 0; i <= totalSegments; i++) {
        const angle = 2.0 * Math.PI * (i % segments) / segments;
        const coilX = radius * Math.cos(angle);
        const coilY = radius * Math.sin(angle);
        const coilZ = coilHeight * i / totalSegments;

        vertices.push(coilX, coilY, coilZ);

        // Highlight section logic
        if (highlightIndex !== null && showHighlightedPart) {
            const isHighlighted = (highlightIndex <= i && i < highlightIndex + highlightLength) ||
                (highlightIndex + highlightLength > totalSegments && i < (highlightIndex + highlightLength) % totalSegments);
            if (isHighlighted) {
                colors.push(0.047,0.012,0.459); // Red
            } else {
                colors.push(1,0,0); // Original color
            }
        } else {
            colors.push(1,0,0); // Original color
        }
    }

    coilGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    coilGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    coilGeometry.rotateY(Math.PI / 2);
    return coilGeometry;
}

function createCoil(radius, numLoops, x, y, z, highlightIndex = null, highlightLength = 20) {
    const coilGeometry = createCoilGeometry(radius, numLoops, highlightIndex, highlightLength);
    coilGeometry.translate(x, y, z); // Translate to the desired position

    const coilMaterial = new THREE.LineBasicMaterial({ vertexColors: true });

    const coil = new THREE.Line(coilGeometry, coilMaterial);
    coil.name = 'coil'; // Set name for easy identification and removal
    return coil;
}

// Create a coil once and store it
let coil = createCoil(radius, numLoops, 1, 0, 0);
scene.add(coil);

let isMovingCoil = false;
let isMovingMagnet = false;

document.addEventListener('keydown', (event) => {
    if (event.code === 'ArrowRight' || event.code === 'ArrowLeft') {
        isMovingMagnet = true; // Assuming isMovingMagnet is set elsewhere
        isMovingCoil = true;   // Assuming isMovingCoil is set elsewhere
        updateCoilHighlight(); // Update coil highlight immediately
    }
});

document.addEventListener('keyup', (event) => {
    if (event.code === 'ArrowRight' || event.code === 'ArrowLeft') {
        isMovingMagnet = false; // Assuming isMovingMagnet is set elsewhere
        isMovingCoil = false;   // Assuming isMovingCoil is set elsewhere
        updateCoilHighlight(); // Update coil highlight immediately
    }
});


function updateCoilHighlight() {
    const distance = magnetPosition.distanceTo(coil.position);

    // Adjust this threshold distance as needed
    const highlightDistanceThreshold = 10;

    // Only update highlight if the magnet is within the threshold distance
    if (distance <= highlightDistanceThreshold && (isMovingMagnet || isMovingCoil)) {
        showHighlightedPart = true;

        // Determine the direction of magnet movement relative to the coil
        const magnetApproaching1 = magnetPosition.x < coil.position.x && previousMagnetPosition.x < magnetPosition.x;
        const magnetMovingAway1 = magnetPosition.x > coil.position.x && previousMagnetPosition.x < magnetPosition.x;
        const magnetApproaching2 = magnetPosition.x > coil.position.x && previousMagnetPosition.x > magnetPosition.x;
        const magnetMovingAway2 = magnetPosition.x < coil.position.x && previousMagnetPosition.x > magnetPosition.x;

        // Update the highlight index based on the movement direction
        if (magnetApproaching1) {
            highlightIndex = (highlightIndex - highlightSpeed + (numLoops * segments)) % (numLoops * segments);
        } else if (magnetMovingAway1) {
            highlightIndex = (highlightIndex + highlightSpeed) % (numLoops * segments);
        } else if (magnetApproaching2) {
            highlightIndex = (highlightIndex + highlightSpeed) % (numLoops * segments);
        } else if (magnetMovingAway2) {
            highlightIndex = (highlightIndex - highlightSpeed + (numLoops * segments)) % (numLoops * segments);
        }

        // Create new coil geometry
        const newCoilGeometry = createCoilGeometry(radius, numLoops, highlightIndex, highlightLength);

        // Dispose old geometry and assign new geometry
        coil.geometry.dispose();
        coil.geometry = newCoilGeometry;

        // Set position and rotation
        coil.position.copy(previousCoilPosition);
    } else {
        showHighlightedPart = false;
        const newCoilGeometry = createCoilGeometry(radius, numLoops); // Reset coil to original geometry

        // Dispose old geometry and assign new geometry
        coil.geometry.dispose();
        coil.geometry = newCoilGeometry;

        // Set position and rotation
        coil.position.copy(previousCoilPosition);
    }

    // Update the previous magnet position
    previousMagnetPosition.copy(magnetPosition);
}



// Position the camera
camera.position.set(-1.372585015788184, 1.9659447972468065, 3.905262017920427);
const controls = new OrbitControls(camera, renderer.domElement);
// Add event listener to log camera position on change
controls.addEventListener('change', () => {
    console.log(`Camera position: x=${camera.position.x}, y=${camera.position.y}, z=${camera.position.z}`);
});

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();

// Handle window resize

// function onWindowResize() {
//     const mainCanvasWidth = window.innerWidth * 0.6; // 60% of the window width
//     const mainCanvasHeight = window.innerHeight * 0.6; // 60% of the window height
//     renderer.setSize(mainCanvasWidth, mainCanvasHeight);

//     camera.aspect = mainCanvasWidth / mainCanvasHeight;
//     camera.updateProjectionMatrix();
// }
// window.addEventListener('resize', onWindowResize);




// Handle slider input
const slider = document.getElementById('coil-loop');
const sliderValue = document.getElementById('coil-loop-value');

slider.addEventListener('input', (event) => {
    const loops = parseInt(event.target.value);
    sliderValue.textContent = loops; // Update the displayed value
    numLoops = loops; // Update the global variable

    // Remove the existing coil
    const existingCoil = scene.getObjectByName('coil');
    if (existingCoil) {
        scene.remove(existingCoil);
        existingCoil.geometry.dispose();
    }

    // Create and add the new coil
    coil = createCoil(radius, loops, 1, 0, 0);
    scene.add(coil);

    // Update the highlight and movement listeners to reference the new coil
    updateCoilHighlight();
    //document.addEventListener('keydown', onCoilMoveKeyDown, false);
});

// Add an event listener to handle slider input for field strength
const fieldStrengthSlider = document.getElementById('field-strength');
const fieldStrengthValue = document.getElementById('field-strength-value');

fieldStrengthSlider.addEventListener('input', (event) => {
    const c_res = parseInt(event.target.value);
    loadStreamlines(c_res); // Update streamlines based on slider value
    fieldStrengthValue.textContent = c_res; // Update the displayed value
});

// Handle slider input for magnet speed
const magnetSpeedSlider = document.getElementById('magnet-speed');
const magnetSpeedValue = document.getElementById('magnet-speed-value');

magnetSpeedSlider.addEventListener('input', (event) => {
    const speedLevel = parseInt(event.target.value);
    magnetSpeed = magnetSpeedLevels[speedLevel - 1]; // Update magnet speed based on slider value
    magnetSpeedValue.textContent = speedLevel; // Update the displayed value
});

// Button event listeners
const moveMagnetButton = document.getElementById('move-magnet');
const moveCoilButton = document.getElementById('move-coil');
const moveBothButton = document.getElementById('move-both');

moveMagnetButton.addEventListener('click', () => {
    document.removeEventListener('keydown', onCoilMoveKeyDown, false); // Disable magnet movement with arrow keys
    document.removeEventListener('keydown', onBothMoveKeyDown, false);
    document.addEventListener('keydown', onMagnetMoveKeyDown, false); // Enable magnet movement with new keys
});

moveCoilButton.addEventListener('click', () => {
    document.removeEventListener('keydown', onMagnetMoveKeyDown, false); // Disable magnet movement with arrow keys
    document.removeEventListener('keydown', onBothMoveKeyDown, false);
    document.addEventListener('keydown', onCoilMoveKeyDown, false); // Enable coil movement with new keys
});

moveBothButton.addEventListener('click', () => {
    document.removeEventListener('keydown', onMagnetMoveKeyDown, false);
    document.removeEventListener('keydown', onCoilMoveKeyDown, false);
    document.addEventListener('keydown', onBothMoveKeyDown, false); // Enable both magnet and coil movement with arrow keys
});

const step = 0.2;

// Array to hold streamline objects
let streamlines = [];

// Function to update streamline positions
function updateStreamlinePositions() {
    streamlines.forEach(streamline => {
        streamline.position.copy(magnetPosition);
    });
}

// Magnet movement speed levels
const magnetSpeedLevels = [0.1, 0.2, 0.3, 0.4]; // Adjust as needed

// Initial magnet speed
let magnetSpeed = magnetSpeedLevels[0];

// Keyboard input to move the magnet along the x-axis
function onMagnetMoveKeyDown(event) {
    const keyCode = event.which;
    const step = magnetSpeed;
    if (keyCode === 37) { // Left arrow key
        magnetPosition.x -= step;
    } else if (keyCode === 39) { // Right arrow key
        magnetPosition.x += step;
    }
    cylinder.position.copy(magnetPosition);
    updateStreamlinePositions();
    updateCoilHighlight();
}

function onCoilMoveKeyDown(event) {
    const keyCode = event.which;

    if (keyCode === 37) { // Left arrow key
        coil.position.x -= step;
    } else if (keyCode === 39) { // Right arrow key
        coil.position.x += step;
    }
    previousCoilPosition.copy(coil.position); // Update previous position
    updateStreamlinePositions();
    updateCoilHighlight();
}

function onBothMoveKeyDown(event) {
    const keyCode = event.which;

    if (keyCode === 37) { // Left arrow key
        magnetPosition.x -= step;
        coil.position.x += step;
    } else if (keyCode === 39) { // Right arrow key
        magnetPosition.x += step;
        coil.position.x -= step;
    }
    cylinder.position.copy(magnetPosition); // Update magnet's position
    previousCoilPosition.copy(coil.position); // Update previous position
    updateStreamlinePositions(); // Update streamline positions
    updateCoilHighlight();
}

// Add this function to load streamline points based on the selected c_res value
function loadStreamlines(c_res) {
    fetch(`streamline_points_${c_res}.json`) // Fetch the appropriate JSON file based on c_res value
        .then(response => response.json())
        .then(data => {
            const scale = 100; // Adjust the scale factor as needed

            // Remove existing streamlines
            streamlines.forEach(streamline => {
                scene.remove(streamline);
            });
            streamlines = [];

            // Add new streamlines
            data.forEach(pointsArray => {
                const scaledPoints = pointsArray.map(p => new THREE.Vector3(...p).multiplyScalar(scale));
                const streamlineGeometry = new THREE.BufferGeometry().setFromPoints(scaledPoints);
                streamlineGeometry.rotateY(Math.PI / 2); // Rotate streamline geometry by 90 degrees around the x-axis
                const streamlineMaterial = new THREE.LineBasicMaterial({ color: 0x7800B9 }); // Green color for streamlines
                const streamline = new THREE.Line(streamlineGeometry, streamlineMaterial);
                streamline.position.copy(magnetPosition); // Position streamlines at the magnet's position
                scene.add(streamline);
                streamlines.push(streamline);
            });
        })
        .catch(error => console.error('Error loading streamline points:', error));
}

// Initial load with default c_res value
loadStreamlines(5);

// Initialize plot canvas using Three.js
const plotScene = new THREE.Scene();
plotScene.background = new THREE.Color(0xFFFFFF); 
const plotCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000); // Adjust the aspect ratio to match plotCanvas size
const plotRenderer = new THREE.WebGLRenderer({ canvas: document.getElementById('plotCanvas') });
const plotCanvasWidth = window.innerWidth * 0.4; // 60% of the window width
const plotCanvasHeight = window.innerHeight * 0.4;
plotRenderer.setSize(plotCanvasWidth, plotCanvasHeight);
plotCamera.position.z = 5;
const plotControls = new OrbitControls(plotCamera, plotRenderer.domElement);

plotRenderer.domElement.style.display = 'none';
document.getElementById('play-button').style.display = 'none';

let plotVisible = false;
const togglePlotButton = document.getElementById('toggle-plot');
togglePlotButton.addEventListener('click', () => {
    plotVisible = !plotVisible; // Toggle plot visibility
    if (plotVisible) {
        plotRenderer.domElement.style.display = 'block'; // Show plot canvas
        togglePlotButton.textContent = 'Hide Graph'; // Change button text
        document.getElementById('play-button').style.display = 'block'; // Show play button
    } else {
        plotRenderer.domElement.style.display = 'none'; // Hide plot canvas
        togglePlotButton.textContent = 'Show Graph'; // Change button text
        document.getElementById('play-button').style.display = 'none'; // Hide play button
    }
});


// Function to render plot scene
function renderPlot() {
    requestAnimationFrame(renderPlot);
    plotControls.update();
    plotRenderer.render(plotScene, plotCamera);
}
renderPlot();

function calculateI(B, v, x) {
    const f_x = -3 / Math.pow(x, 4);
    return B * v * f_x;
}

// Function to draw the base graph (initial graph in blue)
function drawBaseGraph() {
    const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
    const points = [];
    for (let x = -10; x <= 10; x += 0.1) {
        const y = calculateI(1, 1, x); // Using initial B=1, v=1 for the base graph
        points.push(new THREE.Vector3(x, y, 0));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    plotScene.add(line);
    plotScene.add(xAxis.clone());
    plotScene.add(yAxis.clone());
}

// Function to draw subsequent graphs with animation on top of existing graphs
function drawSubsequentGraph(B, v) {
    const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const points = [];
    const step = magnetSpeed;
    let x = -10;

    function animate() {
        const y = calculateI(B, v, x);
        points.push(new THREE.Vector3(x, y, 0));

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, material);
        plotScene.add(line);

        plotRenderer.render(plotScene, plotCamera); // Render the scene after each addition

        // Update magnet position
        magnetPosition.x = x;
        cylinder.position.copy(magnetPosition);
        updateStreamlinePositions();

        x += step;
        if (x <= 10) {
            requestAnimationFrame(animate);
        }
    }

    animate();
}

// Draw the initial base graph
drawBaseGraph();

// Event listener for the play button
document.getElementById('play-button').addEventListener('click', () => {
    const B = parseFloat(fieldStrengthSlider.value);
    const v = parseFloat(magnetSpeedSlider.value);
    drawSubsequentGraph(B, v);
});

// Event listener for field strength slider
fieldStrengthSlider.addEventListener('input', (event) => {
    const B = parseFloat(event.target.value);
    fieldStrengthValue.textContent = B; // Update the displayed value
});

// Event listener for magnet speed slider
magnetSpeedSlider.addEventListener('input', (event) => {
    const v = parseFloat(event.target.value);
    magnetSpeed = magnetSpeedLevels[v - 1]; // Update magnet speed based on slider value
    magnetSpeedValue.textContent = v; // Update the displayed value

    // If the animation is running, restart it with the new speed
    if (animationRunning) {
        restartAnimation();
    }
});

function onWindowResize() {
    const mainCanvasWidth = window.innerWidth * 0.6; // Adjust as needed
    const mainCanvasHeight = window.innerHeight * 0.6; // Adjust as needed
    renderer.setSize(mainCanvasWidth, mainCanvasHeight);

    const plotCanvasWidth = window.innerWidth * 0.4; // Adjust as needed
    const plotCanvasHeight = window.innerHeight * 0.4; // Adjust as needed
    plotRenderer.setSize(plotCanvasWidth, plotCanvasHeight);

    camera.aspect = mainCanvasWidth / mainCanvasHeight;
    camera.updateProjectionMatrix();

    plotCamera.aspect = plotCanvasWidth / plotCanvasHeight;
    plotCamera.updateProjectionMatrix();
}
window.addEventListener('resize', onWindowResize);