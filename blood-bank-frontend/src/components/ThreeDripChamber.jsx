import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

function ThreeDripChamber({ percent = 35 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Scene & Renderer Setup
    const width = containerRef.current.clientWidth || 112;
    const height = containerRef.current.clientHeight || 288;

    const scene = new THREE.Scene();
    
    // Enable alpha for transparency to blend perfectly with the clinical background card
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    // Camera setup - custom field of view suitable for a vertical medical cylinder
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 6.5);

    // 2. Lights Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    // Cool surgical white-blue spotlight
    const dirLight = new THREE.DirectionalLight(0xe0f2fe, 1.4);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);

    // Soft fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-2, -2, 1);
    scene.add(fillLight);

    // Point light to glow inside the liquid blood pool
    const redLight = new THREE.PointLight(0xdc2626, 1.2, 5);
    redLight.position.set(0, -1, 0);
    scene.add(redLight);

    // 3. Realistic Clinical Materials
    const metalMaterial = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      metalness: 0.9,
      roughness: 0.15,
    });

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.22,
      roughness: 0.08,
      metalness: 0.1,
      transmission: 0.9,
      ior: 1.5,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const bloodMaterial = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.15,
      metalness: 0.1,
      emissive: 0x3d0000,
    });

    const tubeMaterial = new THREE.MeshStandardMaterial({
      color: 0x990505,
      transparent: true,
      opacity: 0.85,
      roughness: 0.3,
      metalness: 0.1,
    });

    // 4. Chamber Geometry Construction
    const dripChamberGroup = new THREE.Group();
    scene.add(dripChamberGroup);

    // Chamber glass body (open ended cylinder)
    const glassGeo = new THREE.CylinderGeometry(0.5, 0.5, 2.5, 32, 1, true);
    const glassMesh = new THREE.Mesh(glassGeo, glassMaterial);
    dripChamberGroup.add(glassMesh);

    // Top cap
    const topCapGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.15, 32);
    const topCapMesh = new THREE.Mesh(topCapGeo, metalMaterial);
    topCapMesh.position.y = 1.3;
    dripChamberGroup.add(topCapMesh);

    // Bottom cap
    const bottomCapGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.15, 32);
    const bottomCapMesh = new THREE.Mesh(bottomCapGeo, metalMaterial);
    bottomCapMesh.position.y = -1.3;
    dripChamberGroup.add(bottomCapMesh);

    // Dropper Nozzle inside chamber top cap
    const nozzleGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.3, 16);
    const nozzleMesh = new THREE.Mesh(nozzleGeo, metalMaterial);
    nozzleMesh.position.y = 1.15;
    dripChamberGroup.add(nozzleMesh);

    // Curved Intake Tube (curved tube winding out from top)
    const curvePoints = [
      new THREE.Vector3(0.5, 2.2, -0.2),
      new THREE.Vector3(0.2, 1.8, 0.1),
      new THREE.Vector3(0, 1.35, 0),
    ];
    const intakeCurve = new THREE.CatmullRomCurve3(curvePoints);
    const intakeTubeGeo = new THREE.TubeGeometry(intakeCurve, 20, 0.07, 16, false);
    const intakeTubeMesh = new THREE.Mesh(intakeTubeGeo, tubeMaterial);
    dripChamberGroup.add(intakeTubeMesh);

    // Output Tube (extending straight down from bottom cap)
    const outputTubeGeo = new THREE.CylinderGeometry(0.07, 0.07, 1.0, 16);
    const outputTubeMesh = new THREE.Mesh(outputTubeGeo, tubeMaterial);
    outputTubeMesh.position.y = -1.85;
    dripChamberGroup.add(outputTubeMesh);

    // 5. Droplet Setup
    const dropletGroup = new THREE.Group();
    dripChamberGroup.add(dropletGroup);

    // Teardrop droplet geometry (stretch sphere vertically to shape)
    const dropletGeo = new THREE.SphereGeometry(0.065, 16, 16);
    dropletGeo.scale(1, 1.4, 1);
    const dropletMesh = new THREE.Mesh(dropletGeo, bloodMaterial);
    dropletGroup.add(dropletMesh);

    // 6. Liquid Pool (Blood pool at bottom of the chamber)
    const poolGroup = new THREE.Group();
    dripChamberGroup.add(poolGroup);

    const poolGeo = new THREE.CylinderGeometry(0.485, 0.485, 1, 32);
    const poolMesh = new THREE.Mesh(poolGeo, bloodMaterial);
    // Shift pivot point of pool cylinder to its base to scale upwards cleanly
    poolGeo.translate(0, 0.5, 0);
    poolMesh.position.y = -1.225; // Sits at the bottom cap base
    poolGroup.add(poolMesh);

    // Ripple Ring mesh on impact
    const rippleGeo = new THREE.TorusGeometry(0.01, 0.012, 8, 32);
    const rippleMaterial = new THREE.MeshBasicMaterial({
      color: 0xdc2626,
      transparent: true,
      opacity: 0,
    });
    const rippleMesh = new THREE.Mesh(rippleGeo, rippleMaterial);
    rippleMesh.rotation.x = Math.PI / 2; // Flat ellipse surface
    rippleMesh.scale.set(1, 1, 0.35); // 3D perspective ellipse ratio
    dripChamberGroup.add(rippleMesh);

    // 7. Dynamic Scaling Logic
    const clampedPercent = Math.min(Math.max(0, percent), 100);
    const totalHeightCap = 2.1; // Maximum space inside glass chamber
    const minHeightCap = 0.35;  // 15% visual baseline limit so it always looks nice
    
    const initialHeight = minHeightCap + (clampedPercent / 100) * (totalHeightCap - minHeightCap);
    poolMesh.scale.y = initialHeight;
    redLight.position.y = -1.225 + initialHeight / 2;

    // 8. Animation Clock & Loop
    let animationTime = 0;
    const dripPeriod = 2.0; // 2 seconds per drip cycle
    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      const delta = clock.getDelta();
      animationTime += delta;
      
      const liquidHeight = minHeightCap + (clampedPercent / 100) * (totalHeightCap - minHeightCap);
      const liquidSurfaceY = -1.225 + liquidHeight;

      // Cycle phase (0.0 to 1.0)
      const t = (animationTime % dripPeriod) / dripPeriod;
      
      const startY = 1.0;
      const endY = liquidSurfaceY;
      const distance = startY - endY;

      // Place ripple exactly at liquid surface Y
      rippleMesh.position.y = liquidSurfaceY + 0.01;

      if (t < 0.35) {
        // Drop is forming at dropper nozzle
        const swellScale = t / 0.35;
        dropletGroup.position.set(0, startY, 0);
        dropletGroup.scale.set(swellScale, swellScale * 1.2, swellScale);
        dropletGroup.visible = true;
        rippleMaterial.opacity = 0;
      } else if (t < 0.45) {
        // Hanging and building gravity tension
        dropletGroup.position.set(0, startY, 0);
        dropletGroup.scale.set(1.0, 1.2 + (t - 0.35) * 2, 1.0);
        dropletGroup.visible = true;
        rippleMaterial.opacity = 0;
      } else if (t < 0.62) {
        // Gravity descent (quadratic ease-in)
        const dropProgress = (t - 0.45) / 0.17;
        const easeInDrop = dropProgress * dropProgress; 
        
        const currentY = startY - easeInDrop * distance;
        dropletGroup.position.set(0, currentY, 0);
        dropletGroup.scale.set(0.9, 1.1, 0.9);
        dropletGroup.visible = true;
        rippleMaterial.opacity = 0;
      } else if (t < 0.66) {
        // Impact splash!
        dropletGroup.visible = false;
        
        const splashProgress = (t - 0.62) / 0.04;
        rippleMesh.visible = true;
        rippleMesh.scale.set(splashProgress * 4.0, splashProgress * 4.0, 1);
        rippleMaterial.opacity = 0.7 * (1 - splashProgress);
      } else {
        // Drop hidden, ripple fading out
        dropletGroup.visible = false;
        
        if (t < 0.85) {
          const fadeProgress = (t - 0.66) / 0.19;
          rippleMesh.scale.set(4.0 + fadeProgress * 6.0, 4.0 + fadeProgress * 6.0, 1);
          rippleMaterial.opacity = 0.2 * (1 - fadeProgress);
        } else {
          rippleMesh.visible = false;
        }
      }

      // Elegant slow rotation to display the full 3D depth of the glass chamber
      dripChamberGroup.rotation.y = Math.sin(animationTime * 0.4) * 0.15;
      
      renderer.render(scene, camera);
    };

    animate();

    // 9. Handle Canvas Resize dynamically
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup WebGL resources on component unmount to prevent memory leaks
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      
      glassGeo.dispose();
      topCapGeo.dispose();
      bottomCapGeo.dispose();
      nozzleGeo.dispose();
      intakeTubeGeo.dispose();
      outputTubeGeo.dispose();
      dropletGeo.dispose();
      poolGeo.dispose();
      rippleGeo.dispose();
      
      metalMaterial.dispose();
      glassMaterial.dispose();
      bloodMaterial.dispose();
      tubeMaterial.dispose();
      rippleMaterial.dispose();
    };
  }, [percent]);

  return (
    <div 
      ref={containerRef} 
      className="w-28 h-72 relative flex items-center justify-center cursor-pointer group"
      style={{ minWidth: '112px', minHeight: '288px' }}
    />
  );
}

export default ThreeDripChamber;
