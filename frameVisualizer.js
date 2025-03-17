/**
 * Frame Guru - 3D Frame Visualizer
 * This module handles the 3D visualization of frames, mats, and uploaded artwork
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

class FrameVisualizer {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      defaultFrameColor: '#5c4a37',
      defaultMatColor: '#ffffff',
      backgroundColor: '#f5f5f5',
      ...options
    };

    // Product configuration
    this.currentConfig = {
      frameType: 'standard', // standard, mat, shadowbox
      frameStyle: 'classic',
      frameColor: this.options.defaultFrameColor,
      matColor: this.options.defaultMatColor,
      hasSecondMat: false,
      secondMatColor: '#e0e0e0',
      size: '11x14',
      artwork: null,
      customObject: null
    };

    // Sizes (inches converted to 3D units)
    this.sizeDimensions = {
      '8x10': { width: 8, height: 10 },
      '11x14': { width: 11, height: 14 },
      '16x20': { width: 16, height: 20 },
      '18x24': { width: 18, height: 24 },
      '20x30': { width: 20, height: 30 },
      '24x36': { width: 24, height: 36 }
    };

    // Available mat colors
    this.matColors = {
      white: '#ffffff',
      offWhite: '#f5f5f0',
      black: '#101010',
      navyBlue: '#1a2c42',
      burgundy: '#6d1a33',
      forestGreen: '#2c4c3b',
      charcoal: '#36454f',
      taupe: '#b8a88b'
    };

    // Frame styles with metadata
    this.frameStyles = {
      classic: { model: 'classic_frame.glb', profile: { width: 1.25, depth: 0.75 } },
      modern: { model: 'modern_frame.glb', profile: { width: 0.75, depth: 0.5 } },
      ornate: { model: 'ornate_frame.glb', profile: { width: 2, depth: 1 } },
      floating: { model: 'floating_frame.glb', profile: { width: 0.5, depth: 1.5 } },
      gallery: { model: 'gallery_frame.glb', profile: { width: 1, depth: 1.25 } }
    };

    this.init();
  }

  init() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.options.backgroundColor);

    // Set up camera
    this.camera = new THREE.PerspectiveCamera(45, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
    this.camera.position.z = 30;

    // Set up renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // Add controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 15;
    this.controls.maxDistance = 50;
    this.controls.maxPolarAngle = Math.PI / 2;

    // Add lights
    this.setupLighting();

    // Initialize loaders
    this.textureLoader = new THREE.TextureLoader();
    this.gltfLoader = new GLTFLoader();

    // Add window resize handler
    window.addEventListener('resize', this.onResize.bind(this));

    // Create initial frame
    this.buildFrame();

    // Start animation loop
    this.animate();
  }

  setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    // Main directional light (simulates window light)
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.6);
    mainLight.position.set(10, 10, 10);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    this.scene.add(mainLight);

    // Fill light from opposite side
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-10, 5, -10);
    this.scene.add(fillLight);

    // Subtle rim light
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.2);
    rimLight.position.set(0, -10, -10);
    this.scene.add(rimLight);
  }

  onResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  buildFrame() {
    // Clear existing frame
    if (this.frameGroup) {
      this.scene.remove(this.frameGroup);
    }

    // Create new group to hold all frame elements
    this.frameGroup = new THREE.Group();
    this.scene.add(this.frameGroup);

    // Get current dimensions
    const { width, height } = this.sizeDimensions[this.currentConfig.size];
    
    // Scale factor for 3D space
    const scale = 1;
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;

    // Create frame based on type
    switch (this.currentConfig.frameType) {
      case 'standard':
        this.createStandardFrame(scaledWidth, scaledHeight);
        break;
      case 'mat':
        this.createMatFrame(scaledWidth, scaledHeight);
        break;
      case 'shadowbox':
        this.createShadowboxFrame(scaledWidth, scaledHeight);
        break;
      default:
        this.createStandardFrame(scaledWidth, scaledHeight);
    }

    // Center camera
    this.frameGroup.position.set(0, 0, 0);
    this.camera.lookAt(this.frameGroup.position);
  }

  createStandardFrame(width, height) {
    // Frame profile dimensions based on style
    const frameProfile = this.frameStyles[this.currentConfig.frameStyle].profile;
    const frameWidth = frameProfile.width;
    const frameDepth = frameProfile.depth;

    // Frame dimensions
    const outerWidth = width + frameWidth * 2;
    const outerHeight = height + frameWidth * 2;
    
    // Create outer frame
    this.createOuterFrame(outerWidth, outerHeight, frameWidth, frameDepth);
    
    // Add artwork if available
    if (this.currentConfig.artwork) {
      this.addArtwork(width, height, 0);
    } else {
      // Placeholder
      this.addPlaceholderArt(width, height, 0);
    }
  }

  createMatFrame(width, height) {
    // Frame profile dimensions
    const frameProfile = this.frameStyles[this.currentConfig.frameStyle].profile;
    const frameWidth = frameProfile.width;
    const frameDepth = frameProfile.depth;
    
    // Mat width (standard 2-inch mat)
    const matWidth = 2;
    
    // Dimensions
    const artworkWidth = width - matWidth * 2;
    const artworkHeight = height - matWidth * 2;
    const outerWidth = width + frameWidth * 2;
    const outerHeight = height + frameWidth * 2;
    
    // Create outer frame
    this.createOuterFrame(outerWidth, outerHeight, frameWidth, frameDepth);
    
    // Create mat
    this.createMat(width, height, artworkWidth, artworkHeight, 0.05);
    
    // Add artwork if available
    if (this.currentConfig.artwork) {
      this.addArtwork(artworkWidth, artworkHeight, 0.1);
    } else {
      // Placeholder
      this.addPlaceholderArt(artworkWidth, artworkHeight, 0.1);
    }
  }

  createShadowboxFrame(width, height) {
    // Frame profile dimensions
    const frameProfile = this.frameStyles[this.currentConfig.frameStyle].profile;
    const frameWidth = frameProfile.width;
    const frameDepth = frameProfile.depth;
    
    // Dimensions
    const outerWidth = width + frameWidth * 2;
    const outerHeight = height + frameWidth * 2;
    const shadowboxDepth = 1; // 1-inch deep shadowbox
    
    // Create outer frame with extra depth
    this.createOuterFrame(outerWidth, outerHeight, frameWidth, frameDepth + shadowboxDepth);
    
    // Create shadowbox interior
    this.createShadowboxInterior(width, height, shadowboxDepth);
    
    // Add artwork if available
    if (this.currentConfig.artwork) {
      // Float artwork above shadowbox back
      this.addArtwork(width * 0.9, height * 0.9, shadowboxDepth * 0.5);
    } else {
      // Placeholder
      this.addPlaceholderArt(width * 0.9, height * 0.9, shadowboxDepth * 0.5);
    }
    
    // If there's a custom object (for Tier 3 framing)
    if (this.currentConfig.customObject) {
      this.addCustomObject(shadowboxDepth);
    }
  }

  createOuterFrame(outerWidth, outerHeight, frameWidth, frameDepth) {
    // Create basic frame geometry
    const frameGeometry = new THREE.BoxGeometry(outerWidth, outerHeight, frameDepth);
    
    // Cut out the center
    const innerWidth = outerWidth - frameWidth * 2;
    const innerHeight = outerHeight - frameWidth * 2;
    const cutoutGeometry = new THREE.BoxGeometry(innerWidth, innerHeight, frameDepth + 0.1);
    
    // Position the cutout
    cutoutGeometry.translate(0, 0, frameDepth * 0.05);
    
    // Create frame material
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.currentConfig.frameColor),
      roughness: 0.5,
      metalness: 0.2
    });
    
    // Create mesh
    const frameMesh = new THREE.Mesh(frameGeometry, frameMaterial);
    
    // Add to group
    this.frameGroup.add(frameMesh);
    
    // Create glass
    const glassGeometry = new THREE.BoxGeometry(innerWidth - 0.05, innerHeight - 0.05, 0.05);
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.2,
      roughness: 0,
      transmission: 0.95,
      ior: 1.5
    });
    
    const glassMesh = new THREE.Mesh(glassGeometry, glassMaterial);
    glassMesh.position.z = -frameDepth / 2 + 0.05;
    this.frameGroup.add(glassMesh);
  }

  createMat(width, height, artworkWidth, artworkHeight, depth) {
    // Mat board geometry
    const matGeometry = new THREE.BoxGeometry(width, height, depth);
    
    // Cutout for artwork
    const cutoutGeometry = new THREE.BoxGeometry(artworkWidth + 0.1, artworkHeight + 0.1, depth + 0.1);
    
    // Mat material
    const matMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.currentConfig.matColor),
      roughness: 0.9,
      metalness: 0
    });
    
    // Create mesh
    const matMesh = new THREE.Mesh(matGeometry, matMaterial);
    matMesh.position.z = -0.1;
    
    // Add to group
    this.frameGroup.add(matMesh);
    
    // Second mat (if enabled)
    if (this.currentConfig.hasSecondMat) {
      const innerMatWidth = artworkWidth + 0.25;
      const innerMatHeight = artworkHeight + 0.25;
      
      const innerMatGeometry = new THREE.BoxGeometry(innerMatWidth, innerMatHeight, depth);
      
      const innerCutoutGeometry = new THREE.BoxGeometry(artworkWidth + 0.1, artworkHeight + 0.1, depth + 0.1);
      
      const innerMatMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(this.currentConfig.secondMatColor),
        roughness: 0.9,
        metalness: 0
      });
      
      const innerMatMesh = new THREE.Mesh(innerMatGeometry, innerMatMaterial);
      innerMatMesh.position.z = -0.05;
      
      this.frameGroup.add(innerMatMesh);
    }
  }

  createShadowboxInterior(width, height, depth) {
    // Create interior sides
    const materialSides = new THREE.MeshStandardMaterial({
      color: this.currentConfig.matColor,
      roughness: 0.9,
      metalness: 0
    });
    
    // Back panel
    const backGeometry = new THREE.BoxGeometry(width, height, 0.25);
    const backMesh = new THREE.Mesh(backGeometry, materialSides);
    backMesh.position.z = -depth;
    this.frameGroup.add(backMesh);
    
    // Side panels (left, right, top, bottom)
    const sideWidthGeometry = new THREE.BoxGeometry(0.25, height, depth);
    const sideHeightGeometry = new THREE.BoxGeometry(width, 0.25, depth);
    
    // Left side
    const leftMesh = new THREE.Mesh(sideWidthGeometry, materialSides);
    leftMesh.position.x = -width / 2;
    leftMesh.position.z = -depth / 2;
    this.frameGroup.add(leftMesh);
    
    // Right side
    const rightMesh = new THREE.Mesh(sideWidthGeometry, materialSides);
    rightMesh.position.x = width / 2;
    rightMesh.position.z = -depth / 2;
    this.frameGroup.add(rightMesh);
    
    // Top side
    const topMesh = new THREE.Mesh(sideHeightGeometry, materialSides);
    topMesh.position.y = height / 2;
    topMesh.position.z = -depth / 2;
    this.frameGroup.add(topMesh);
    
    // Bottom side
    const bottomMesh = new THREE.Mesh(sideHeightGeometry, materialSides);
    bottomMesh.position.y = -height / 2;
    bottomMesh.position.z = -depth / 2;
    this.frameGroup.add(bottomMesh);
  }

  addArtwork(width, height, zOffset) {
    // Create artwork plane
    const geometry = new THREE.PlaneGeometry(width, height);
    
    // Load artwork texture
    this.textureLoader.load(this.currentConfig.artwork, (texture) => {
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.5
      });
      
      const artworkMesh = new THREE.Mesh(geometry, material);
      artworkMesh.position.z = -zOffset - 0.01;
      this.frameGroup.add(artworkMesh);
    });
  }

  addPlaceholderArt(width, height, zOffset) {
    // Create a placeholder artwork with gradient
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 512;
    
    // Create gradient
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#3a5a40');
    gradient.addColorStop(1, '#a3b18a');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add text
    context.font = '30px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.fillText('Your Artwork Here', canvas.width / 2, canvas.height / 2);
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.5
    });
    
    const geometry = new THREE.PlaneGeometry(width, height);
    const artworkMesh = new THREE.Mesh(geometry, material);
    artworkMesh.position.z = -zOffset - 0.01;
    this.frameGroup.add(artworkMesh);
  }

  addCustomObject(shadowboxDepth) {
    // This would load a custom 3D object from a provided model URL
    if (typeof this.currentConfig.customObject === 'string') {
      this.gltfLoader.load(this.currentConfig.customObject, (gltf) => {
        const model = gltf.scene;
        
        // Scale and position the model appropriately
        model.scale.set(0.5, 0.5, 0.5);
        model.position.z = -shadowboxDepth / 2;
        
        this.frameGroup.add(model);
      });
    }
  }

  // Public methods for updating configuration
  updateFrameType(type) {
    this.currentConfig.frameType = type;
    this.buildFrame();
  }

  updateFrameStyle(style) {
    this.currentConfig.frameStyle = style;
    this.buildFrame();
  }

  updateFrameColor(color) {
    this.currentConfig.frameColor = color;
    this.buildFrame();
  }

  updateMatColor(color) {
    this.currentConfig.matColor = color;
    this.buildFrame();
  }

  updateSize(size) {
    if (this.sizeDimensions[size]) {
      this.currentConfig.size = size;
      this.buildFrame();
    }
  }

  updateArtwork(imageUrl) {
    this.currentConfig.artwork = imageUrl;
    this.buildFrame();
  }

  toggleSecondMat(enabled) {
    this.currentConfig.hasSecondMat = enabled;
    this.buildFrame();
  }

  updateSecondMatColor(color) {
    this.currentConfig.secondMatColor = color;
    this.buildFrame();
  }

  setCustomObject(objectUrl) {
    this.currentConfig.customObject = objectUrl;
    this.buildFrame();
  }

  // Capture current view as image
  captureImage() {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  // Dispose of resources when no longer needed
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
