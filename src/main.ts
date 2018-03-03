import {vec3} from 'gl-matrix';
import {mat4, vec4} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Cube from './geometry/Cube';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import LSystem from './LSystem';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  Expansions: 8,
  'Branch Angle': 25,
  'Leaf Color': [0, 107, 37],
};

let lsystem: LSystem;

function loadScene(expands: number, angle: number) {
  lsystem = new LSystem(vec3.fromValues(0, 0, 0), angle);
  for (let i = 0; i < expands; i++) {
    lsystem.expGram();
  }
  lsystem.parseGram();
  lsystem.create();
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // Sets the value of `gl` in the `globals.ts` module.
  setGL(gl);

  // Initial call to load scene
  loadScene(8, 25);

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);

  // const custom = new ShaderProgram([
  //   new Shader(gl.VERTEX_SHADER, require('./shaders/custom-vert.glsl')),
  //   new Shader(gl.FRAGMENT_SHADER, require('./shaders/custom-frag.glsl')),
  // ]);

  // Add controls to the gui
  const gui = new DAT.GUI();
  var exp = gui.add(controls, 'Expansions', 0, 20).step(1);
  var angChange = gui.add(controls, 'Branch Angle', 0, 90).step(1);
  var colControl = gui.addColor(controls, 'Leaf Color');

  let currExpands = 8;
  let currAngle = 25;
  let currColor = vec4.fromValues(0, 107 / 255.0, 37 / 255.0, 1);
  let time = 0;

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();

    exp.onChange(function(value: any){
      loadScene(value, currAngle);
    })

    angChange.onChange(function(value: any){
      loadScene(currExpands, value);
    })

    colControl.onChange(function(value: any) {
      currColor = vec4.fromValues(value[0] / 255.0, value[1] / 255.0, value[2] / 255.0, 1);
    })

    renderer.render(camera, lambert, currColor, time, [
      lsystem
    ]);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    time = time + 1;
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main();
