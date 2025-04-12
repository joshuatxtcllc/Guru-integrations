/**
 * Frame Guru - 3D Frame Visualizer
 * This module handles the 3D visualization of frames, mats, and uploaded artwork
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TextureLoader } from 'three';

class FrameVisualizer {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      defaultFrameColor: '#5c4a37',
      defaultMatColor: '#ffffff',
      backgroundColor: '#f5f5f5',
      ...options
    };

    // Product configuration.  Simplified to match edited code structure
    this.currentConfig = {
      frameColor: this.options.defaultFrameColor,
      matColor: this.options.defaultMatColor,
      hasMat: false, // Added to match edited code
      width: 11, // Default width
      height: 14, // Default height
      depth: 1, // Default depth
    };


    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.options.backgroundColor);
    this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.frameGroup = new THREE.Group();
    this.textureLoader = new THREE.TextureLoader();

    this.init();
  }

  init() {
    // Setup renderer
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.container.appendChild(this.renderer.domElement);

    // Setup camera
    this.camera.position.z = 5;

    // Setup lights (modified to match edited code)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 1, 2);

    this.scene.add(ambientLight);
    this.scene.add(directionalLight);
    this.scene.add(this.frameGroup);

    // Setup controls (modified to match edited code)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Add window resize handler
    window.addEventListener('resize', this.onResize.bind(this));

    // Create initial frame
    this.buildFrame();

    // Start animation loop
    this.animate();
  }

  onResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  buildFrame() {
    //Simplified buildFrame to call the new methods from edited code
    this.updateFrame(this.currentConfig);
    // Center camera
    this.frameGroup.position.set(0, 0, 0);
    this.camera.lookAt(this.frameGroup.position);
  }

  updateFrame(config) {
    this.currentConfig = config;
    this.createFrame();
    this.createGlass();
    this.createMat();
  }
  createFrame() {
    // Clear existing frame
    while(this.frameGroup.children.length > 0) {
      this.frameGroup.remove(this.frameGroup.children[0]);
    }

    const { width, height, depth, frameColor } = this.currentConfig;
    const frameGeometry = new THREE.BoxGeometry(width, height, depth);
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(frameColor || this.options.defaultFrameColor),
      roughness: 0.7,
      metalness: 0.1
    });

    const frameMesh = new THREE.Mesh(frameGeometry, frameMaterial);
    this.frameGroup.add(frameMesh);
  }

  createGlass() {
    const { width, height } = this.currentConfig;
    const glassGeometry = new THREE.BoxGeometry(width - 0.1, height - 0.1, 0.05);
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.2,
      roughness: 0,
      transmission: 0.95,
      ior: 1.5
    });

    const glassMesh = new THREE.Mesh(glassGeometry, glassMaterial);
    glassMesh.position.z = 0.1;
    this.frameGroup.add(glassMesh);
  }

  createMat() {
    if (!this.currentConfig.hasMat) return;

    const { width, height, depth, matColor } = this.currentConfig;
    const matGeometry = new THREE.BoxGeometry(
      width ,
      height ,
      depth
    );
    const matMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(matColor || this.options.defaultMatColor),
      roughness: 0.9
    });

    const matMesh = new THREE.Mesh(matGeometry, matMaterial);
    matMesh.position.z = 0.05;
    this.frameGroup.add(matMesh);
  }

  // Public methods for updating configuration (mostly preserved from original)
  updateFrameColor(color) {
    this.currentConfig.frameColor = color;
    this.buildFrame();
  }

  updateMatColor(color) {
    this.currentConfig.matColor = color;
    this.buildFrame();
  }

  updateSize(width, height, depth) {
      this.currentConfig.width = width;
      this.currentConfig.height = height;
      this.currentConfig.depth = depth;
      this.buildFrame();
  }

  toggleMat(enabled) {
    this.currentConfig.hasMat = enabled;
    this.buildFrame();
  }

  captureImage() {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  dispose() {
    window.removeEventListener('resize', this.onResize.bind(this));
    this.renderer.dispose();
    this.controls.dispose();

    // Clear container
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
  }
}

export default FrameVisualizer;