import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { Group } from 'three';
import SimplexNoise from "https://cdn.JsDelivr.net/npm/simplex-noise/dist/esm/simplex-noise.min.js";
import { BoundingBoxHelper } from 'three';

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
    var SphereTexture = new THREE.TextureLoader().load('textures/earth.jpeg');
    var SphereMaterial = new THREE.MeshLambertMaterial({
      map: SphereTexture,
      wireframe: false
    });

    var ball = new THREE.Mesh(SphereGeometry, SphereMaterial);
    ball.position.set(0, 0, 0);
    group.add(ball);

    var ambientLight = new THREE.AmbientLight(0xaaaaaa);
    scene.add(ambientLight);

    var spotLight = new THREE.SpotLight(0xffffff);
    spotLight.intensity = 0.9;
    spotLight.position.set(-10, 40, 20);
    spotLight.lookAt(ball);
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

      makeRoughBall(ball, modulate(Math.pow(lowerMaxFr, 0.8), 0, 1, 0, 8), modulate(upperAvgFr, 0, 1, 0, 4));
      requestAnimationFrame(render);

      group.rotation.y += 0.005;
      renderer.render(scene, camera);
      requestAnimationFrame(render);
      
      // function makeVertexList(mesh){
      //     var vertex = new THREE.Vector3();
      //     var array = mesh.geometry.attributes.position;
      //     let vertexArray = [];
      //     for (var i = 0, l = array.count; i < l; i ++ ) {
      //       vertex.fromBufferAttribute( array, i );
      //       vertex.x = array.getX(i)
      //       vertex.y = array.getY(i)
      //       vertex.z = array.getZ(i)
      //       vertexArray.push({x: vertex.x, y: vertex.y, z: vertex.z});
      //       // console.log('x', vertex.x);
      //       // console.log('y', vertex.y);
      //       // console.log('z', vertex.z);
      //       // console.log('vertex', vertex, i);
      //       // vertexArray.AudioContextsetXYZ(i, vertex.x, vertex.y, vertex.z);
      //     }
      //     // console.log(vertex);
      //     console.log(vertexArray);
      //     return vertexArray;
      //   };


      function makeRoughBall(mesh, bassFr, treFr) {
          var vertex = new THREE.Vector3();
          var array = mesh.geometry.attributes.position;
          var vertexArray = [];
          for (var i = 0, l = array.count; i < l; i ++ ) {
            // vertex.fromBufferAttribute( array, i );
            vertex.x = array.getX(i)
            vertex.y = array.getY(i)
            vertex.z = array.getZ(i)
            vertexArray.push( { 'x': vertex.x, 'y': vertex.y, 'z': vertex.z } );

          }
          vertexArray.forEach(function (ver) {
              var offset = mesh.geometry.parameters.radius;
              var amp = 7;
              var time = window.performance.now();
              // ver.normalize();
              var rf = 0.00001;
              var distance = (offset + bassFr ) + noise.noise3D(vertex.x + time *rf*7, vertex.y +  time*rf*8, vertex.z + time*rf*9) * amp * treFr;
              // ver.multiplyScalar(distance);
          });
          mesh.geometry.verticesNeedUpdate = true;
          mesh.geometry.normalsNeedUpdate = true;
          // mesh.geometry.positioncomputeVertexNormals();
          // mesh.geometry.positioncomputeFaceNormals();
      }

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