//making all final changes

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader';
import { FontLoader } from 'three/addons/loaders/FontLoader';
import { ArrowHelper } from 'three';
import { ConeGeometry, Mesh, MeshBasicMaterial, Vector3 } from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry';

// Initialize the scene, camera, and renderer for the main canvas
const mainCanvas = document.getElementById('mainCanvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x635b5b ); 
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
const xAxis = createLine([-1000, 0, 0], [1000, 0, 0], 0xff8133); // black
const yAxis = createLine([0, -1000, 0], [0, 1000, 0], 0x00ffd1); // Green
const zAxis = createLine([0, 0, -1000], [0, 0, 1000], 0xffffff); // Blue

scene.add(xAxis);
scene.add(yAxis);
scene.add(zAxis);

// Function to create text labels for axes
function createAxisLabel(text, position) {
    const loader = new FontLoader();
    loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
        const textGeometry = new TextGeometry(text, {
            font: font,
            size: 2,
            height: 0.1,
        });
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 }); // Black color
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(...position);
        scene.add(textMesh);
    });
}

function createAxisLabel2(text, position) {
    const loader = new FontLoader();
    loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
        const textGeometry = new TextGeometry(text, {
            font: font,
            size: 1,
            height: 0.1,
        });
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 }); // Black color
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(...position);
        scene.add(textMesh);
    });
}

// Add labels to the axes
createAxisLabel('X', [25, 0, 0]);
createAxisLabel2('Y', [0, 6, 0]);
createAxisLabel('Z', [0, 0, -20]);


// Add a red cuboid along the x-axis
const sideMaterial = new THREE.MeshBasicMaterial({ color: 0x5c2f09 }); // Color for the sides
const topMaterial = new THREE.MeshBasicMaterial({ color: 0xac7238 }); // Color for the top
const bottomMaterial = new THREE.MeshBasicMaterial({ color: 0xac7238 }); // Color for the bottom


const materials = [sideMaterial, topMaterial, bottomMaterial];

const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 0.7, 40);
const cylinder = new THREE.Mesh(cylinderGeometry, materials);
cylinder.position.set(-6, 0, 0); 
cylinder.rotation.z = Math.PI / 2;
scene.add(cylinder);

const fontLoader = new FontLoader();
fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 }); // Black color

    // Create "N" label
    const textGeometryN = new TextGeometry('N', {
        font: font,
        size: 0.4, // Adjust size as needed
        height: 0.01,
    });
    const textMeshN = new THREE.Mesh(textGeometryN, textMaterial);
    textMeshN.position.set(0, -0.7, 0); // Adjust position as needed
    textMeshN.rotation.z = Math.PI / 2;
    // Create "S" label
    const textGeometryS = new TextGeometry('S', {
        font: font,
        size: 0.4, // Adjust size as needed
        height: 0.01,
    });
    const textMeshS = new THREE.Mesh(textGeometryS, textMaterial);
    textMeshS.position.set(0, 0.5, 0); // Adjust position as needed
    textMeshS.rotation.z = Math.PI / 2;
    // Add labels as children to the cylinder
    cylinder.add(textMeshN);
    cylinder.add(textMeshS);
});

const currentMeter = document.getElementById('current-value');
function calculateCurrent() {
    if (isMovingMagnet || isMovingCoil) {
        // Adjust this formula as needed
        const B = parseFloat(fieldStrengthSlider.value);
        const v = parseFloat(magnetSpeedSlider.value);
        const nloops =  parseFloat(slider.value);
        const x =  magnetPosition.x - coil.position.x;
        const current = calculateI(B, v, x);
        //const current = B*v*nloops;
        return current.toFixed(6); 
    }
    return 0; // No current if no movement
}

// Update the current meter
function updateCurrentMeter() {
    const current = calculateCurrent();
    currentMeter.textContent = `${current} A`;
}

const segments = 100;
const radius = 1.8;
let numLoops = 1; // Change to let to allow modification

// Global magnet position
let magnetPosition = new THREE.Vector3(-6, 0, 0);
let previousMagnetPosition = magnetPosition.clone();
let highlightIndex = 0;
const highlightLength = 25;
const highlightSpeed = 2;
let showHighlightedPart = true;
const tubeThickness = 0.05;
function createTubeGeometry(radius, tubeThickness, numLoops, segments, highlightIndex = null, highlightLength = 20) {
    const path = new THREE.Curve();
    path.getPoint = function (t) {
        const angle = 2 * Math.PI * t * numLoops;
        const coilX = radius * Math.cos(angle);
        const coilY = radius * Math.sin(angle);
        const coilZ = t * numLoops * (numLoops === 1 ? 0 : 0.3);  // Adjust coil height based on number of loops
        return new THREE.Vector3(coilX, coilY, coilZ);
    };
    const tubeGeometry = new THREE.TubeGeometry(path, numLoops * segments, tubeThickness, 8, false);
    tubeGeometry.rotateY(Math.PI / 2);

    // Ensure colors array length matches the number of vertices in the geometry
    const colors = [];
    const totalSegments = numLoops * segments;
    const totalVertices = tubeGeometry.attributes.position.count;

    for (let i = 0; i < totalVertices; i++) {
        // Calculate the segment this vertex belongs to
        const segmentIndex = Math.floor((i / totalVertices) * totalSegments);

        // Determine if this segment is within the highlighted range
        const isHighlighted = highlightIndex !== null &&
            ((highlightIndex <= segmentIndex && segmentIndex < highlightIndex + highlightLength) ||
            (highlightIndex + highlightLength > totalSegments && segmentIndex < (highlightIndex + highlightLength) % totalSegments));

        if (isHighlighted) {
            colors.push(0, 1, 0); // Highlight color (green)
        } else {
            colors.push(1, 0, 0); // Default color (red)
        }
    }

    // Apply the colors to the geometry as a Float32BufferAttribute
    tubeGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    return tubeGeometry;
}

function createThickCoil(radius, tubeThickness, numLoops, position, highlightIndex = null, highlightLength = 20) {
    const tubeGeometry = createTubeGeometry(radius, tubeThickness, numLoops, segments, highlightIndex, highlightLength);

    const coilMaterial = new THREE.MeshBasicMaterial({ vertexColors: true, side:THREE.DoubleSide });

    const coil = new THREE.Mesh(tubeGeometry, coilMaterial);
    coil.name = 'coil'; // Set name for easy identification and removal
    coil.position.copy(position);
    return coil;
}

// Create the thicker coil with a tube thickness (e.g., 0.05) and store it
let coil = createThickCoil(radius, tubeThickness, numLoops, new THREE.Vector3(0, 0, 0));
scene.add(coil);
let previousCoilPosition = coil.position.clone();

let isMovingCoil = false;
let isMovingMagnet = false;

document.addEventListener('keydown', (event) => {
    if (event.code === 'ArrowRight' || event.code === 'ArrowLeft') {
        isMovingMagnet = true; // Assuming isMovingMagnet is set elsewhere
        isMovingCoil = true;   // Assuming isMovingCoil is set elsewhere
        updateThickCoilHighlight(); // Update coil highlight immediately
    }
});

document.addEventListener('keyup', (event) => {
    if (event.code === 'ArrowRight' || event.code === 'ArrowLeft') {
        isMovingMagnet = false; // Assuming isMovingMagnet is set elsewhere
        isMovingCoil = false;   // Assuming isMovingCoil is set elsewhere
        updateThickCoilHighlight(); // Update coil highlight immediately
    }
});

// Updating the coil when highlighting
function updateThickCoilHighlight() {
    const distance = magnetPosition.distanceTo(coil.position);

    // Adjust this threshold distance as needed
    const highlightDistanceThreshold = 10;

    if (distance <= highlightDistanceThreshold && (isMovingMagnet || isMovingCoil)) {
        showHighlightedPart = true;

        // Determine the direction of magnet movement relative to the coil
        const magnetApproaching1 = magnetPosition.x < coil.position.x && previousMagnetPosition.x < magnetPosition.x; //into
        const magnetMovingAway1 = magnetPosition.x > coil.position.x && previousMagnetPosition.x < magnetPosition.x;//outside
        const magnetApproaching2 = magnetPosition.x > coil.position.x && previousMagnetPosition.x > magnetPosition.x; //inside
        const magnetMovingAway2 = magnetPosition.x < coil.position.x && previousMagnetPosition.x > magnetPosition.x; //outside
        const coilApproaching1 = coil.position.x > previousCoilPosition.x && coil.position.x < magnetPosition.x;//into
        const coilMovingAway1 = coil.position.x < previousCoilPosition.x && coil.position.x < magnetPosition.x; // outside
        const coilApproaching2 = coil.position.x < previousCoilPosition.x && coil.position.x > magnetPosition.x;//into
        const coilMovingAway2 = coil.position.x > previousCoilPosition.x && coil.position.x > magnetPosition.x; //outisde
        

        // Update the highlight index based on the movement direction
        if (magnetApproaching1 || magnetApproaching2 || coilApproaching2 || coilApproaching1) {
            // Approaching cases (from either side)
            highlightIndex = (highlightIndex - highlightSpeed + (numLoops * segments)) % (numLoops * segments);
        } else if (magnetMovingAway1 || magnetMovingAway2 || coilMovingAway1 || coilMovingAway2) {
            highlightIndex = (highlightIndex + highlightSpeed) % (numLoops * segments);
        }
        
        const currentPosition = coil.position.clone();

        const newCoilGeometry = createTubeGeometry(radius, tubeThickness, numLoops, segments, highlightIndex, highlightLength);
        
        // Dispose of old geometry and assign the new geometry
        coil.geometry.dispose();
        coil.geometry = newCoilGeometry;
        coil.position.copy(currentPosition);
    } else {
        showHighlightedPart = false;
        const currentPosition = coil.position.clone();
        const newCoilGeometry = createTubeGeometry(radius, tubeThickness, numLoops, segments); // Reset to original geometry
        coil.geometry.dispose();
        coil.geometry = newCoilGeometry;
        coil.position.copy(currentPosition);
    }

    previousMagnetPosition.copy(magnetPosition);
}

// Position the camera

camera.position.set(-5.035235854592631, 4.735739671865247, 11.544756508835249);
const controls = new OrbitControls(camera, renderer.domElement);
// Add event listener to log camera position on change
controls.addEventListener('change', () => {
    console.log(`Camera position: x=${camera.position.x}, y=${camera.position.y}, z=${camera.position.z}`);
});

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    updateCurrentMeter();
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

    const currentPosition = coil.position.clone();

    // Remove the existing coil
    const existingCoil = scene.getObjectByName('coil');
    if (existingCoil) {
        scene.remove(existingCoil);
        existingCoil.geometry.dispose();
    }

    // Create and add the new coil
    coil = createThickCoil(radius, tubeThickness, numLoops, currentPosition);
    scene.add(coil);

    // Update the highlight and movement listeners to reference the new coil
    updateThickCoilHighlight();
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
    const halfStreamlines = Math.floor(streamlines.length / 2);
    console.log("halfStreamlines",halfStreamlines);
    streamlines.forEach((streamline, index) => {
        // Update the streamline's position to follow the magnet's position
        streamline.line.position.copy(magnetPosition);
        streamline.arrow.forEach(arrowGroup => scene.remove(arrowGroup));
        // Ensure the geometry is updated to reflect the latest position
        streamline.line.geometry.attributes.position.needsUpdate = true;

        // Get the latest points from the streamline geometry
        const scaledPoints = [];
        const positionArray = streamline.line.geometry.attributes.position.array;

        for (let i = 0; i < positionArray.length; i += 3) {
            const point = new THREE.Vector3(
                positionArray[i],
                positionArray[i + 1],
                positionArray[i + 2]
            ).add(streamline.line.position); // Apply current streamline position
            scaledPoints.push(point);
        }

        // Define arrow parameters
        const arrowInterval = 30;
        const arrowLength = 0.5;

        // If arrows don't exist, create them
        if (!streamline.arrows || streamline.arrows.length === 0) {
            streamline.arrows = []; // Initialize arrow array

            for (let i = 0; i < scaledPoints.length - 1; i += arrowInterval) {
                const coneGeometry = new THREE.ConeGeometry(0.1, arrowLength, 16);
                const coneMaterial = new THREE.MeshBasicMaterial({ color: 0xf4ff04 });
                const arrowHead = new THREE.Mesh(coneGeometry, coneMaterial);

                const arrowGroup = new THREE.Group();
                arrowGroup.add(arrowHead);

                // Initially set position and orientation (will be updated below)
                scene.add(arrowGroup);
                streamline.arrows.push(arrowGroup);
            }
        }

        // Update positions and orientations of existing arrows
        streamline.arrows.forEach((arrowGroup, i) => {
            const index2 = i * arrowInterval;
            if (index2 < scaledPoints.length - 1) {
                const startPoint = scaledPoints[index2];
                const endPoint = scaledPoints[index2 + 1];

                // Calculate direction from startPoint to endPoint
                const direction = new THREE.Vector3().subVectors(endPoint, startPoint).normalize();
                if (index >= halfStreamlines) { // For the second half of the streamlines
                    direction.multiplyScalar(-1); // Reverse the direction
                }
                // Update position and orientation of the arrow
                arrowGroup.position.copy(endPoint);
                arrowGroup.children[0].quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
            }
        });
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
    updateThickCoilHighlight();
}

function onCoilMoveKeyDown(event) {
    const keyCode = event.which;
    previousCoilPosition.copy(coil.position); // Update previous position
    if (keyCode === 37) { // Left arrow key
        coil.position.x -= step;
    } else if (keyCode === 39) { // Right arrow key
        coil.position.x += step;
    }
    
    updateStreamlinePositions();
    updateThickCoilHighlight();
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
    updateThickCoilHighlight();
}


function loadStreamlines(c_res) {
    fetch(`streamline_points_${c_res}.json`) // Fetch the appropriate JSON file based on c_res value
        .then(response => response.json())
        .then(data => {
            const scale = 300; // Adjust the scale factor as needed

            // Remove existing streamlines and arrows
            streamlines.forEach(streamline => {
                scene.remove(streamline.line);
                streamline.arrows.forEach(arrowGroup => scene.remove(arrowGroup)); // Remove the arrowhead
            });
            streamlines = [];

            // Total number of streamlines
            const totalStreamlines = data.length;
            const halfStreamlines = Math.floor(totalStreamlines / 2); // Calculate half
            console.log("halfStreamlines2",halfStreamlines);
            // Arrow placement interval
            const arrowInterval = 30; 

            // Add new streamlines
            data.forEach((pointsArray, index) => { // Include index for direction logic
                const scaledPoints = pointsArray.map(p => new THREE.Vector3(...p).multiplyScalar(scale));
               
                // Create streamline (line) geometry
                const streamlineGeometry = new THREE.BufferGeometry().setFromPoints(scaledPoints);
                streamlineGeometry.rotateY(Math.PI / 2); // Rotate streamline geometry by 90 degrees around the x-axis
                const streamlineMaterial = new THREE.LineBasicMaterial({ color: 0xf4ff04 }); // Green color for streamlines
                const streamline = new THREE.Line(streamlineGeometry, streamlineMaterial);
                streamline.position.copy(magnetPosition); // Position streamlines at the magnet's position
                scene.add(streamline);

                const arrows = [];
                const originalPoints = pointsArray.map(p => new THREE.Vector3(...p));

                // Iterate through the points to place arrows along the streamline at intervals
                for (let i = 0; i < scaledPoints.length - 1; i += arrowInterval) { // Increment by arrowInterval
                    const startPoint = scaledPoints[i];
                    const endPoint = scaledPoints[i + 1];
        
                    // Calculate direction from startPoint to endPoint
                    const direction = new THREE.Vector3().subVectors(endPoint, startPoint).normalize();

                    // Create an arrowhead (cone geometry) without a shaft
                    const arrowLength = 0.5; // Size of the arrowhead
                    const coneGeometry = new THREE.ConeGeometry(0.1, arrowLength, 16); // Cone (arrowhead only)
                    const coneMaterial = new THREE.MeshBasicMaterial({ color: 0xf4ff04 }); // Red color for the arrowhead
                    const arrowHead = new THREE.Mesh(coneGeometry, coneMaterial);
                    
                    const arrowGroup = new THREE.Group();
                    arrowGroup.add(arrowHead); 
                    arrowGroup.rotation.y = Math.PI / 2;
                
                    if (index > halfStreamlines) { // For the first half of streamlines
                        direction.multiplyScalar(-1); // Reverse the direction
                    }
                  
                    arrowHead.position.copy(endPoint);
                    arrowHead.position.z -= 1; 
                   
                    arrowGroup.targetPosition = endPoint.clone();
                    arrowGroup.targetDirection = direction.clone(); 
                    // Orient the arrowhead
                    arrowHead.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction); // Orient cone along direction vector
                    // Add the arrowhead to the scene and store in array for future reference
                    scene.add(arrowGroup);
                    arrows.push(arrowGroup);
                    
                }
                streamlines.push({ line: streamline, arrow: arrows });
            });
            updateStreamlinePositions();
        })
        .catch(error => console.error('Error loading streamline points:', error));
}

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

plotScene.add(xAxis.clone());
plotScene.add(yAxis.clone());
// Load a font for the text labels
// Load a font for labels
const fontLoader2 = new FontLoader();
fontLoader2.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function(font) {
    addAxisLabels(font); // Call function to add labels and ticks after font loads
});

function addAxisLabels(font) {
    // X-axis label
    const xLabelGeometry = new TextGeometry("D", {
        font: font,
        size: 0.3,
        height: 0.05
    });
    const xLabelMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const xLabel = new THREE.Mesh(xLabelGeometry, xLabelMaterial);
    xLabel.position.set(2, -1, 0); // Position label below x-axis
    plotScene.add(xLabel);

    // Y-axis label
    const yLabelGeometry = new TextGeometry("I", {
        font: font,
        size: 0.3,
        height: 0.05
    });
    const yLabelMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const yLabel = new THREE.Mesh(yLabelGeometry, yLabelMaterial);
    yLabel.position.set(-1, 2, 0); // Position label beside y-axis
    yLabel.rotation.z = Math.PI; // Rotate label to align with y-axis
    plotScene.add(yLabel);

    // Add tick marks and numbers on x-axis and y-axis
    const tickMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const tickSize = 0.1;

    // X-axis ticks and numbers
    for (let i = -10; i <= 10; i++) {
        // Tick mark
        const tickGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(i, -tickSize / 2, 0),
            new THREE.Vector3(i, tickSize / 2, 0)
        ]);
        const tick = new THREE.Line(tickGeometry, tickMaterial);
        plotScene.add(tick);

        // Tick label
        const tickLabelGeometry = new TextGeometry(i.toString(), {
            font: font,
            size: 0.2,
            height: 0.02
        });
        const tickLabel = new THREE.Mesh(tickLabelGeometry, xLabelMaterial);
        tickLabel.position.set(i, -0.3, 0); // Adjust position under tick
        plotScene.add(tickLabel);
    }

    // Y-axis ticks and numbers
    for (let i = -10; i <= 10; i++) {
        // Tick mark
        const tickGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-tickSize / 2, i, 0),
            new THREE.Vector3(tickSize / 2, i, 0)
        ]);
        const tick = new THREE.Line(tickGeometry, tickMaterial);
        plotScene.add(tick);

        // Tick label
        const tickLabelGeometry = new TextGeometry(i.toString(), {
            font: font,
            size: 0.2,
            height: 0.02
        });
        const tickLabel = new THREE.Mesh(tickLabelGeometry, yLabelMaterial);
        tickLabel.position.set(-0.5, i, 0); // Adjust position beside tick
        plotScene.add(tickLabel);
    }
    plotRenderer.render(plotScene, plotCamera);
}


function calculateI(B, v, distance) {
    const minDistance = 0.2;
    const effectiveDistance = Math.max(Math.abs(distance), minDistance); // Use absolute for calculation
    const f_x = -3 / Math.pow(effectiveDistance, 4);
    return B * v * f_x * Math.sign(distance) *0.0004// Adjust polarity based on distance sign
}


// Function to draw the base graph (initial graph in blue)
function drawBaseGraph() { 
    const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
    const points = [];
    
    // Assume we want to plot for a range of distances
    // For example, from a minimum distance of 0.1 to a maximum distance of 10 units
    for (let distance = 0.1; distance <= 10; distance += 0.1) {
        // Using initial B=1, v=1 for the base graph
        const y = calculateI(1, 1, distance); // Calculate current based on distance
        points.push(new THREE.Vector3(distance, y, 0)); // Use distance as x-axis value
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    plotScene.add(line);

   
}

document.getElementById('clear-graph').addEventListener('click', clearGraph);

function clearGraph() {
    // Remove all objects from the plotScene
    while (plotScene.children.length > 0) {
        plotScene.remove(plotScene.children[0]);
    }

    // Re-add the x and y axes
    plotScene.add(xAxis.clone());
    plotScene.add(yAxis.clone());

    // Re-add the axis labels and ticks
    fontLoader2.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function(font) {
        addAxisLabels(font);
    });


}


// Function to draw subsequent graphs with animation on top of existing graphs
function drawSubsequentGraph(B, v) {
    const hue = Math.random();
    const saturation = 1; 
    const lightness = 0.3; 

    // Convert HSL to RGB
    const color = new THREE.Color().setHSL(hue, saturation, lightness);
    const material = new THREE.LineBasicMaterial({ color: color });
    const points = [];
    const step = magnetSpeed || 0.1;
    magnetPosition.x = coil.position.x - 5;
    let x = magnetPosition.x;

    isMovingMagnet = true;

    function animate() {
        const distance = magnetPosition.x - coil.position.x; // Use signed distance
        const y = calculateI(B, v, distance); // Calculate current based on signed distance
        points.push(new THREE.Vector3(distance, y, 0));

        if (points.length > 1) {
            const segmentPoints = [points[points.length - 2], points[points.length - 1]];
            const segmentGeometry = new THREE.BufferGeometry().setFromPoints(segmentPoints);
            const segmentLine = new THREE.Line(segmentGeometry, material);
            plotScene.add(segmentLine);
        }

        plotRenderer.render(plotScene, plotCamera);

        previousMagnetPosition.copy(magnetPosition);
        magnetPosition.x = x;
        cylinder.position.copy(magnetPosition);
        updateStreamlinePositions();

        if (isMovingMagnet) {
            highlightIndex = (highlightIndex + (distance > 0 ? -highlightSpeed : highlightSpeed)) % (numLoops * segments);
        }

        const newCoilGeometry = isMovingMagnet 
            ? createTubeGeometry(radius, tubeThickness, numLoops, segments, highlightIndex, highlightLength)
            : createTubeGeometry(radius, tubeThickness, numLoops, segments);
        
        coil.geometry.dispose();
        coil.geometry = newCoilGeometry;

        coil.position.copy(previousCoilPosition);
        const current = calculateI(B, v, distance);
        currentMeter.textContent = `${(current ).toFixed(6)} A`;

        x += step;
        if (x <= 5) {
            requestAnimationFrame(animate);
        } else {
            isMovingMagnet = false;
            const newCoilGeometry = createTubeGeometry(radius, tubeThickness, numLoops, segments);
            coil.geometry.dispose();
            coil.geometry = newCoilGeometry;
        }
    }

    animate();
}

// Draw the initial base graph
//drawBaseGraph();

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


// script.js
document.addEventListener('DOMContentLoaded', (event) => {
    const modal = document.getElementById('popup-modal');
    const helpIcon = document.querySelector(".help-icon");
    const span = document.getElementsByClassName('close')[0];

    helpIcon.onclick = function() {
        modal.style.display = "block";
    }


    // When the user clicks on <span> (x), close the modal
    span.onclick = function() {
        modal.style.display = 'none';
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
});