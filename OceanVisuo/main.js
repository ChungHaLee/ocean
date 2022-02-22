import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { Group, Sphere } from 'three';
import SimplexNoise from "https://cdn.JsDelivr.net/npm/simplex-noise/dist/esm/simplex-noise.min.js";
import { BoundingBoxHelper } from 'three';
import { setQuaternionFromProperEuler } from 'three/src/math/MathUtils';

let controls, water, sun, mesh;
let camera, scene, renderer;
let container, stats;

init();
animate();


// init function
function init() {
    container = document.getElementById( "container" );
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 20000);
    camera.position.set(1, 20, 100);

    sun = new THREE.Vector3();

    // Water
    const waterGeometry = new THREE.PlaneGeometry( 10000, 10000 );

    water = new Water(
        waterGeometry,
        {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load('textures/waternormals.jpeg', function(texture) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            }),
            waterColor: 0x001e0f,
            distortionScale: 3.7
        })
      
    water.rotation.x = - Math.PI / 2;
    scene.add(water);

    // SkyBox

    const sky = new Sky();
    sky.scale.setScalar( 10000 );
    scene.add(sky);

    const skyUniforms = sky.material.uniforms;

    skyUniforms['turbidity'].value = 10;
    skyUniforms['rayleigh'].value = 2;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.8;

    const parameters = {
      elevation: 2,
      azimuth: 180
    };

    const pmremGenerator = new THREE.PMREMGenerator( renderer );

    function updateSun() {
      const phi = THREE.MathUtils.degToRad( 90 - parameters.elevation );
      const theta = THREE.MathUtils.degToRad( parameters.azimuth );

      sun.setFromSphericalCoords( 1, phi, theta );
      
      sky.material.uniforms[ 'sunPosition' ].value.copy( sun );
      water.material.uniforms[ 'sunDirection' ].value.copy( sun ).normalize();

      scene.environment = pmremGenerator.fromScene( sky ).texture;

    }

    updateSun();

    


    // Orbit Controller
    controls = new OrbitControls(camera, renderer.domElement);
    controls.maxPloarAngle = Math.PI * 0.495;
    controls.target.set( 0, 10, 0 );
    controls.minDistance = 40.0;
    controls.maxDistance = 200.0;
    controls.update();

    stats = new Stats();
    container.appendChild( stats.dom );


};


// animate function
function animate() {
  requestAnimationFrame(animate);
  render();
  stats.update();
}

// render function
function render() {
  const time = performance.now() * 0.001;
  // mesh.position.y = Math.sin(time) * 20 + 5
  // mesh.rotation.x = time * 0.5;
  // mesh.rotation.z = time * 0.51;

  water.material.uniforms['time'].value += 1.0 / 60.0;
  renderer.render(scene, camera);
}


// load music
var noise = new SimplexNoise();


var vizInit = function () {
  var file = document.getElementById("thefile");
  var audio = document.getElementById("audio");
  var fileLabel = document.querySelector("label.file");

  document.onload = function(e){
    audio.play();
    play();
  }

  file.onchange = function(){
    fileLabel.classList.add('normal');
    var files = this.files;

    audio.src = URL.createObjectURL(files[0]);
    audio.load();
    audio.play();
    play();
  }

  function play() {
    var context = new AudioContext();
    var src = context.createMediaElementSource(audio);
    var analyser = context.createAnalyser();
    src.connect(analyser);
    analyser.connect(context.destination);
    analyser.fftSize = 512;
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);

    var group = new THREE.Group();
    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0,0,100);
    camera.lookAt(scene.position);
    scene.add(camera);
  
    // window.addEventListener('resize', 1, false);

    var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Geometry
    var SphereGeometry = new THREE.SphereGeometry(15, 15, 15);
    // var SphereTexture = new THREE.TextureLoader().load('textures/golfball.jpeg');
    var SphereMaterial = new THREE.MeshLambertMaterial({
      // map: SphereTexture,
      color: '#CC0066',
      wireframe: true
    });

    var ballCenter = new THREE.Mesh(SphereGeometry, SphereMaterial);
    var ballLeft = new THREE.Mesh(SphereGeometry, SphereMaterial);
    var ballRight = new THREE.Mesh(SphereGeometry, SphereMaterial);

    ballCenter.position.set(0, 0, 0);
    ballLeft.position.set(-80, 0, 30);
    ballRight.position.set(80, 0, 30);
    group.add(ballCenter);
    group.add(ballLeft);
    group.add(ballRight);

    var ambientLight = new THREE.AmbientLight(0xaaaaaa);
    scene.add(ambientLight);

    var spotLight = new THREE.SpotLight(0xffffff);
    spotLight.intensity = 0.9;
    spotLight.position.set(-10, 40, 20);
    
    spotLight.lookAt(ballCenter);
    spotLight.lookAt(ballLeft);
    spotLight.lookAt(ballRight);
    spotLight.castShadow = true;
    scene.add(spotLight);

    scene.add(group);
    document.getElementById('container').appendChild(renderer.domElement);

    render();


    function render() {
      analyser.getByteFrequencyData(dataArray);
      var lowerHalfArray = dataArray.slice(0, (dataArray.length/2) - 1);
      var upperHalfArray = dataArray.slice((dataArray.length/2) - 1, dataArray.length - 1);

      var overallAvg = avg(dataArray);
      var lowerMax = max(lowerHalfArray);
      var lowerAvg = avg(lowerHalfArray);
      var upperMax = max(upperHalfArray);
      var upperAvg = avg(upperHalfArray);

      var lowerMaxFr = lowerMax / lowerHalfArray.length;
      var lowerAvgFr = lowerAvg / lowerHalfArray.length;
      var upperMaxFr = upperMax / upperHalfArray.length;
      var upperAvgFr = upperAvg / upperHalfArray.length;
      // makeVertexList(ball);

      // makeRoughBall(ball, modulate(Math.pow(lowerMaxFr, 0.8), 0, 1, 0, 8), modulate(upperAvgFr, 0, 1, 0, 4));
      // requestAnimationFrame(render);
      var time = performance.now() * 0.0001;
      ballCenter.position.z = Math.sin(time) * 20 + 5;
      ballCenter.position.y = upperMaxFr * 50;
      ballCenter.rotation.x = time * 0.7;
      // ballCenter.rotation.z = time * 0.51;

      ballLeft.rotation.x = time * 0.7;
      ballLeft.position.z = - upperMaxFr * 50; 
      ballLeft.rotation.y = time * 0.51;

      ballRight.position.z = - upperMaxFr * 50;
      ballRight.rotation.x = time * 0.7;
      ballRight.rotation.y = time * 0.51;
      // group.rotation.z += (lowerMaxFr - 2);
      renderer.render(scene, camera);
      requestAnimationFrame(render);

      audio.play();

    }
  }
}


window.onload = vizInit();
// document.body.addEventListener('touchend', function(ev) { context.resume(); });

//some helper functions here
function fractionate(val, minVal, maxVal) {
  return (val - minVal)/(maxVal - minVal);
}

function modulate(val, minVal, maxVal, outMin, outMax) {
  var fr = fractionate(val, minVal, maxVal);
  var delta = outMax - outMin;
  return outMin + (fr * delta);
}

function avg(arr){
  var total = arr.reduce(function(sum, b) { return sum + b; });
  return (total / arr.length);
}

function max(arr){
  return arr.reduce(function(a, b){ return Math.max(a, b); })
}
