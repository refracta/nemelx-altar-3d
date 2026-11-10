import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {PointerLockControls} from './vendor/PointerLockControls.js';
import {createXom, expressions, modelUrl} from './model.js?v=2';

const translations = {
    en: {
        back: '← Nemelex altar', language: 'Language', epithet: 'THE GOD OF CHAOS',
        loading: 'Summoning Xom…', hint: 'Drag to orbit · Scroll to zoom · 1–8 to change face',
        autoplay: 'Cycle faces', rotate: 'Rotate', reset: 'Reset view', fly: 'Free flight',
        faces: 'THE MANY FACES OF XOM', source: 'From eight original Crawl tiles',
        sculpture: 'An ever-changing stone altar.', play: 'Play Crawl ↗', credits: 'Source & credits ↗',
        download: 'Download animated GLB ↓', exporting: 'Preparing model…',
        error: 'The 3D viewer could not start. You can still download the model below.',
        exportError: 'The download failed. Please try again.',
        flight: 'WASD to move · Space / Shift for up / down · Esc to leave',
        viewport: 'Drag to orbit, scroll to zoom. Keys 1–8 select a face.',
        selection: 'Expressions'
    },
    ko: {
        back: '← 네멜렉스 제단', language: '언어', epithet: '혼돈의 신',
        loading: '좀을 불러오는 중…', hint: '드래그로 회전 · 스크롤로 확대 · 1–8로 표정 선택',
        autoplay: '표정 자동 전환', rotate: '자동 회전', reset: '시점 초기화', fly: '자유 비행',
        faces: '변덕스러운 좀의 여덟 얼굴', source: '크롤 원본 타일 8종에서',
        sculpture: '시시각각 표정을 바꾸는 돌 제단.', play: '크롤 플레이 ↗', credits: '소스 및 출처 ↗',
        download: '애니메이션 GLB 다운로드 ↓', exporting: '모델 준비 중…',
        error: '3D 뷰어를 시작할 수 없습니다. 아래에서 모델을 다운로드할 수 있습니다.',
        exportError: '다운로드에 실패했습니다. 다시 시도해주세요.',
        flight: 'WASD로 이동 · Space / Shift로 상승 / 하강 · Esc로 나가기',
        viewport: '드래그로 회전하고 스크롤로 확대합니다. 1–8 키로 표정을 선택합니다.',
        selection: '표정 선택'
    }
};

const params = new URLSearchParams(location.search);
let locale = (params.get('lang') || navigator.language).startsWith('ko') ? 'ko' : 'en';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let autoplay = !reducedMotion.matches;
let activeFace = 0;
let cycleTime = 0;
let viewerFailed = false;
const viewport = document.getElementById('viewport');
const loading = document.getElementById('loading');
const faceButtons = expressions.map((expression, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'face';
    button.dataset.face = String(index);
    button.setAttribute('aria-pressed', String(index === 0));
    const img = document.createElement('img');
    img.src = `reference/xom${index}.png`;
    img.alt = '';
    const label = document.createElement('span');
    button.append(img, label);
    document.getElementById('faces').append(button);
    return button;
});

function updateLabels() {
    document.documentElement.lang = locale;
    document.title = locale === 'ko' ? '좀 · CNC 제단' : 'Xom · CNC Altars';
    document.querySelectorAll('[data-i18n]').forEach(element => {
        element.textContent = translations[locale][element.dataset.i18n];
    });
    document.getElementById('language').value = locale;
    viewport.setAttribute('aria-label', translations[locale].viewport);
    document.querySelector('.expressions').setAttribute('aria-label', translations[locale].selection);
    faceButtons.forEach((button, index) => {
        button.querySelector('span').textContent = expressions[index][locale];
        button.setAttribute('aria-label', `${index + 1}. ${expressions[index][locale]}`);
    });
    if (viewerFailed) loading.textContent = translations[locale].error;
    updateFaceLabel(activeFace);
}

function updateFaceLabel(index) {
    activeFace = index;
    document.getElementById('face-number').textContent = `${String(index + 1).padStart(2, '0')} / 08`;
    document.getElementById('face-name').textContent = expressions[index][locale];
    faceButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
}

document.getElementById('language').addEventListener('change', event => {
    locale = event.target.value;
    const url = new URL(location.href);
    url.searchParams.set('lang', locale);
    history.replaceState(null, '', url);
    updateLabels();
});
updateLabels();

try {
    const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    viewport.append(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.08;
    orbit.minDistance = 4.7;
    orbit.maxDistance = 18;
    orbit.minPolarAngle = 0.18;
    orbit.maxPolarAngle = Math.PI * 0.53;
    orbit.autoRotateSpeed = 0.75;
    const flight = new PointerLockControls(camera, renderer.domElement);
    document.getElementById('fly').hidden = !renderer.domElement.requestPointerLock;
    const {model, setExpression} = await createXom();
    scene.add(model);

    scene.add(new THREE.HemisphereLight('#ece5fc', '#24202d', 1.2));
    const key = new THREE.DirectionalLight('#f4f4fa', 2.4);
    key.position.set(-3.5, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -5;
    key.shadow.camera.right = 5;
    key.shadow.camera.top = 6;
    key.shadow.camera.bottom = -4;
    key.shadow.normalBias = 0.02;
    key.shadow.bias = -0.0002;
    scene.add(key);
    const fill = new THREE.DirectionalLight('#d7dcff', 0.45);
    fill.position.set(4, 2, 5);
    scene.add(fill);
    const rim = new THREE.DirectionalLight('#b49bdd', 2.1);
    rim.position.set(2.5, 4, -3);
    scene.add(rim);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({opacity: 0.26}));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.005;
    floor.receiveShadow = true;
    scene.add(floor);

    function resetCamera() {
        if (document.pointerLockElement) flight.unlock();
        camera.position.set(1.1, 2.6, 9.2);
        orbit.target.set(0, 1.80, 0);
        orbit.update();
    }
    function resize() {
        const {clientWidth: width, clientHeight: height} = viewport;
        camera.aspect = width / height;
        camera.fov = width < 600 ? 44 : 35;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }
    new ResizeObserver(resize).observe(viewport);
    resetCamera();
    resize();

    function setAutoplay(value) {
        autoplay = value;
        document.getElementById('autoplay').setAttribute('aria-pressed', String(value));
    }
    function selectFace(index) {
        setAutoplay(false);
        cycleTime = index * 3.5;
        setExpression(index);
        updateFaceLabel(index);
    }
    setAutoplay(autoplay);
    faceButtons.forEach((button, i) => button.addEventListener('click', () => selectFace(i)));
    document.getElementById('autoplay').addEventListener('click', () => setAutoplay(!autoplay));
    document.getElementById('rotate').addEventListener('click', event => {
        orbit.autoRotate = !orbit.autoRotate;
        event.currentTarget.setAttribute('aria-pressed', String(orbit.autoRotate));
    });
    document.getElementById('reset').addEventListener('click', resetCamera);
    document.getElementById('fly').addEventListener('click', () => flight.lock());
    flight.addEventListener('lock', () => {
        orbit.enabled = false;
        viewport.focus({preventScroll: true});
        document.getElementById('hint').textContent = translations[locale].flight;
    });
    flight.addEventListener('unlock', () => {
        orbit.enabled = true;
        keys.clear();
        document.getElementById('hint').textContent = translations[locale].hint;
        resetCamera();
    });
    const keys = new Set();
    window.addEventListener('keydown', event => {
        if ((!flight.isLocked && event.target.closest('select, input, textarea, button, a'))
            || event.ctrlKey || event.metaKey || event.altKey) return;
        if (/^[1-8]$/.test(event.key)) selectFace(Number(event.key) - 1);
        if (flight.isLocked) {
            if (event.code === 'Escape') {
                flight.unlock();
                return;
            }
            if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'ShiftRight'].includes(event.code)) {
                event.preventDefault();
                keys.add(event.code);
            }
        } else if (event.code === 'Space') {
            event.preventDefault();
            setAutoplay(!autoplay);
        }
    });
    window.addEventListener('keyup', event => keys.delete(event.code));
    window.addEventListener('blur', () => keys.clear());
    reducedMotion.addEventListener('change', () => {
        if (reducedMotion.matches) {
            setAutoplay(false);
            orbit.autoRotate = false;
            document.getElementById('rotate').setAttribute('aria-pressed', 'false');
        }
    });

    async function exportModel() {
        // Download the complete animation, independent of the currently visible face.
        const response = await fetch(modelUrl);
        if (!response.ok) throw new Error(`Model download failed (${response.status})`);
        const result = await response.arrayBuffer();
        const blobUrl = URL.createObjectURL(new Blob([result], {type: 'model/gltf-binary'}));
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = 'xom.glb';
        link.click();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        return result.byteLength;
    }
    document.getElementById('download').addEventListener('click', async event => {
        const button = event.currentTarget;
        button.disabled = true;
        button.textContent = translations[locale].exporting;
        try {
            await exportModel();
        } catch (error) {
            loading.hidden = false;
            loading.textContent = translations[locale].exportError;
            console.error('Xom export failed', error);
        } finally {
            button.disabled = false;
            button.textContent = translations[locale].download;
        }
    });
    let previousTime;
    document.addEventListener('visibilitychange', () => { previousTime = undefined; });
    function render(now) {
        const elapsed = previousTime === undefined ? 0 : Math.max(0, (now - previousTime) / 1000);
        const delta = Math.min(elapsed, 0.05);
        previousTime = now;
        if (document.hidden) return;
        if (autoplay) {
            cycleTime = (cycleTime + elapsed) % 28;
            const index = Math.floor(cycleTime / 3.5);
            setExpression(index);
            if (activeFace !== index) updateFaceLabel(index);
        }
        if (flight.isLocked) {
            const speed = delta * 3;
            flight.moveForward(((keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0)) * speed);
            flight.moveRight(((keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0)) * speed);
            camera.position.y += ((keys.has('Space') ? 1 : 0) - (keys.has('ShiftLeft') || keys.has('ShiftRight') ? 1 : 0)) * speed;
            camera.position.y = Math.max(0.25, camera.position.y);
        } else {
            orbit.update(delta);
        }
        renderer.render(scene, camera);
    }
    renderer.setAnimationLoop(render);
    loading.hidden = true;
    // Useful for reproducible browser checks and screenshots.
    window.xomViewer = {model, scene, camera, renderer, orbit, selectFace, exportModel, setAutoplay};
} catch (error) {
    viewerFailed = true;
    loading.textContent = translations[locale].error;
    const link = document.createElement('a');
    link.href = modelUrl.href;
    link.dataset.i18n = 'download';
    link.textContent = translations[locale].download;
    document.getElementById('download').replaceWith(link);
    document.querySelectorAll('.toolbar button, .face').forEach(button => { button.disabled = true; });
    console.error('Xom viewer failed', error);
}
