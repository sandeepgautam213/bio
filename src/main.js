const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const filterButtons = [...document.querySelectorAll('[data-filter]')];
const skillCards = [...document.querySelectorAll('[data-category]')];
const skillsGrid = document.querySelector('.skills-grid');

for (const button of filterButtons) {
  button.addEventListener('click', () => {
    const category = button.dataset.filter;
    for (const other of filterButtons) other.setAttribute('aria-pressed', String(other === button));
    for (const card of skillCards) card.hidden = category !== 'all' && card.dataset.category !== category;
    skillsGrid.classList.toggle('filtered', category !== 'all');
    document.querySelector('#filter-status').textContent = category === 'all'
      ? 'Showing all six skill categories.'
      : `Showing ${button.textContent.trim()} skills.`;
  });
}

const progress = document.querySelector('.scroll-progress');
let scrollQueued = false;
function updateProgress() {
  const length = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${length > 0 ? window.scrollY / length : 0})`;
  scrollQueued = false;
}
window.addEventListener('scroll', () => {
  if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateProgress); }
}, { passive: true });
window.addEventListener('resize', updateProgress, { passive: true });
for (const details of document.querySelectorAll('details')) details.addEventListener('toggle', updateProgress);
for (const button of filterButtons) button.addEventListener('click', updateProgress);
updateProgress();

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      if (!reducedMotion.matches) entry.target.classList.add('reveal');
      revealObserver.unobserve(entry.target);
    }
  }, { threshold: 0.08 });
  document.querySelectorAll('.section-heading, .skill-card, .role, .featured-project, .project-card, .education').forEach(el => revealObserver.observe(el));
  const navLinks = [...document.querySelectorAll('nav a')];
  const sectionObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      for (const link of navLinks) {
        if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    }
  }, { rootMargin: '-15% 0px -55% 0px' });
  for (const link of navLinks) {
    const section = document.querySelector(link.hash);
    if (section) sectionObserver.observe(section);
  }
}

// The interface stays functional if WebGL or the 3D module is unavailable.
import('../assets/vendor/three.module.js').then(initScene).catch(() => {
  document.querySelector('#scene-status').textContent = 'DISTRIBUTED BY DESIGN';
});

function initScene(THREE) {
  const host = document.querySelector('.hero-art');
  const canvas = document.querySelector('#scene');
  const toggle = document.querySelector('#motion-toggle');
  const status = document.querySelector('#scene-status');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch {
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x101014, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 60);
  camera.position.set(0, 0, 10.5);
  const sculpture = new THREE.Group();
  sculpture.rotation.z = -0.2;
  scene.add(sculpture);
  scene.add(new THREE.AmbientLight(0xbaa0e1, 1.8));
  const key = new THREE.DirectionalLight(0xddc5ff, 4);
  key.position.set(-3, 4, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x8261ff, 3);
  rim.position.set(4, -2, -3);
  scene.add(rim);
  const coreGeometry = new THREE.IcosahedronGeometry(1.46, 1);
  const core = new THREE.Mesh(coreGeometry, new THREE.MeshPhysicalMaterial({
    color: 0x634390, metalness: 0.58, roughness: 0.32, flatShading: true,
    clearcoat: 0.8, clearcoatRoughness: 0.2,
  }));
  core.visible = false;
  sculpture.add(core);
  const coreEdges = new THREE.LineSegments(new THREE.EdgesGeometry(coreGeometry), new THREE.LineBasicMaterial({ color: 0xd1a7ff, transparent: true, opacity: 0.7 }));
  core.add(coreEdges);
  const shellGeometry = new THREE.IcosahedronGeometry(2.03, 1);
  const shell = new THREE.LineSegments(new THREE.WireframeGeometry(shellGeometry), new THREE.LineBasicMaterial({ color: 0xa57cd8, transparent: true, opacity: 0.08 }));
  shell.rotation.z = 0.4;
  sculpture.add(shell);
  // Instancing shares geometry and material across the network's vertices.
  const positions = shellGeometry.getAttribute('position');
  const uniquePositions = new Map();
  for (let i = 0; i < positions.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(positions, i);
    uniquePositions.set(v.toArray().map(x => x.toFixed(3)).join(','), v);
  }
  const vertices = [...uniquePositions.values()];
  const vertexMaterial = new THREE.MeshBasicMaterial({ color: 0xd6bbff });
  const verticesMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.025, 6, 6), vertexMaterial, vertices.length);
  const dummy = new THREE.Object3D();
  vertices.forEach((v, i) => { dummy.position.copy(v); dummy.updateMatrix(); verticesMesh.setMatrixAt(i, dummy.matrix); });
  shell.add(verticesMesh);

  const orbitGroup = new THREE.Group();
  orbitGroup.rotation.set(0.65, -0.2, -0.4);
  sculpture.add(orbitGroup);
  const orbitRadius = 2.7;
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(orbitRadius, 0.009, 6, 160), new THREE.MeshBasicMaterial({ color: 0xad87db, transparent: true, opacity: 0.45 }));
  orbitGroup.add(orbit);
  const secondOrbit = new THREE.Mesh(new THREE.TorusGeometry(2.45, 0.005, 6, 140), new THREE.MeshBasicMaterial({ color: 0xb18bdc, transparent: true, opacity: 0.23 }));
  secondOrbit.rotation.set(1.2, 0.5, 0.1);
  sculpture.add(secondOrbit);
  const satelliteGeometry = new THREE.OctahedronGeometry(0.13);
  const satellites = Array.from({ length: 5 }, (_, i) => {
    const node = new THREE.Mesh(satelliteGeometry, new THREE.MeshStandardMaterial({ color: i === 0 ? 0xddc9ff : 0x9d7cc6, metalness: 0.5, roughness: 0.3, emissive: 0x4b2766, emissiveIntensity: 0.5 }));
    orbitGroup.add(node);
    return node;
  });
  const dustPositions = new Float32Array(100 * 3);
  // Deterministic points keep the scene stable between visits.
  for (let i = 0; i < 100; i++) {
    const seed = Math.sin(i * 127.1 + 31.7) * 43758.5453;
    const seed2 = Math.sin(i * 269.5 + 73.2) * 24634.6345;
    dustPositions[i * 3] = ((seed - Math.floor(seed)) - 0.5) * 8;
    dustPositions[i * 3 + 1] = ((seed2 - Math.floor(seed2)) - 0.5) * 7;
    dustPositions[i * 3 + 2] = Math.sin(i * 4.9) * 2 - 1;
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: 0xcab5e6, size: 0.018, transparent: true, opacity: 0.5, depthWrite: false }));
  scene.add(dust);
  let pointerX = 0, pointerY = 0;
  let frame = 0, lastTime = null, elapsed = 0;
  let visible = true, lost = false, userPaused = false;
  const shouldMove = () => !userPaused && !reducedMotion.matches && visible && !document.hidden && !lost;

  function render() {
    satellites.forEach((satellite, i) => {
      const angle = elapsed * 0.23 + (i / satellites.length) * Math.PI * 2;
      satellite.position.set(Math.cos(angle) * orbitRadius, Math.sin(angle) * orbitRadius, 0);
      satellite.rotation.set(elapsed * 0.3 + i, elapsed * 0.5, 0);
    });
    core.rotation.set(elapsed * 0.085 + 0.2, elapsed * 0.12 + 0.5, 0.1);
    shell.rotation.y = -elapsed * 0.035;
    dust.rotation.z = elapsed * 0.008;
    sculpture.rotation.x = pointerY * 0.18;
    sculpture.rotation.y = pointerX * 0.22;
    sculpture.position.y = Math.sin(elapsed * 0.6) * 0.08;
    renderer.render(scene, camera);
  }
  function loop(now) {
    frame = 0;
    if (!shouldMove()) { lastTime = null; return; }
    if (lastTime !== null) elapsed += Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    render();
    frame = requestAnimationFrame(loop);
  }
  function syncMotion() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastTime = null;
    const paused = userPaused || reducedMotion.matches;
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', paused ? 'Resume 3D animation' : 'Pause 3D animation');
    toggle.textContent = paused ? '▷' : 'Ⅱ';
    // Reduced-motion preference is respected even when the control is clicked.
    toggle.disabled = reducedMotion.matches;
    toggle.title = reducedMotion.matches ? 'Animation disabled by your reduced-motion preference' : '';
    status.textContent = paused ? 'STILL CONNECTED' : 'MOVE TO EXPLORE';
    if (!lost) render();
    if (shouldMove()) frame = requestAnimationFrame(loop);
  }
  const resize = () => {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height || lost) return;
    camera.aspect = width / height;
    camera.position.z = camera.aspect < 1 ? 11.5 : 10.5;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    render();
  };
  host.addEventListener('pointermove', event => {
    if (!shouldMove()) return;
    const rect = host.getBoundingClientRect();
    pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  }, { passive: true });
  host.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; });
  toggle.addEventListener('click', () => { userPaused = !userPaused; syncMotion(); });
  reducedMotion.addEventListener('change', syncMotion);
  document.addEventListener('visibilitychange', syncMotion);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(host);
  else window.addEventListener('resize', resize, { passive: true });
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    syncMotion();
  }, { threshold: 0 }).observe(host);
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); lost = true;
    host.classList.remove('scene-ready');
    toggle.hidden = true;
    status.textContent = 'DISTRIBUTED BY DESIGN';
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  });
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false; resize(); syncMotion();
    host.classList.add('scene-ready'); toggle.hidden = false;
  });
  window.addEventListener('pagehide', () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  });
  window.addEventListener('pageshow', syncMotion);
  resize();
  syncMotion();
  host.classList.add('scene-ready');
  toggle.hidden = false;
}
