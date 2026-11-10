import * as THREE from 'three';

// An original, reproducible stone sculpture. The eight expressions follow the
// silhouettes of Crawl's xom0–xom7 tiles; no third-party sculpture is embedded.
export const expressions = [
    {id: 'grin', en: 'Grin', ko: '씨익', eyes: [0.105, 0.105], brow: -0.17, mouth: [0.68, 0.15, 0.23], skew: 0, teeth: 1, tongue: 0, color: '#888782'},
    {id: 'smirk', en: 'Smirk', ko: '능청', eyes: [0.22, 0.13], brow: 0.04, mouth: [0.66, 0.09, 0.22], skew: 0.09, teeth: 0.35, tongue: 0, color: '#456f72'},
    {id: 'tongue', en: 'Tongue out', ko: '메롱', eyes: [0.06, 0.22], brow: -0.19, mouth: [0.62, 0.075, -0.16], skew: 0.01, teeth: 0, tongue: 1, color: '#77416d'},
    {id: 'rage', en: 'Rage', ko: '격노', eyes: [0.08, 0.07], brow: -0.30, mouth: [0.62, 0.34, -0.10], skew: 0, teeth: 0.25, tongue: 0, color: '#a34327'},
    {id: 'delight', en: 'Delight', ko: '환희', eyes: [0.21, 0.18], brow: 0.11, mouth: [0.43, 0.30, 0.19], skew: -0.03, teeth: 0.8, tongue: 0, color: '#54892a'},
    {id: 'surprise', en: 'Surprise', ko: '경악', eyes: [0.18, 0.24], brow: 0.14, mouth: [0.27, 0.34, 0], skew: 0, teeth: 0, tongue: 0, color: '#842499'},
    {id: 'grimace', en: 'Grimace', ko: '으득', eyes: [0.07, 0.07], brow: -0.23, mouth: [0.66, 0.16, -0.035], skew: 0, teeth: 1, tongue: 0, color: '#345b9b'},
    {id: 'pleased', en: 'Pleased', ko: '흡족', eyes: [0.09, 0.14], brow: 0.02, mouth: [0.63, 0.10, 0.27], skew: 0.04, teeth: 0.25, tongue: 0, color: '#aa7a30'}
];

const centerY = 2.15;
const radiusY = 1.45;
const gaussian = (x, y, sx, sy) => Math.exp(-(x * x / (sx * sx) + y * y / (sy * sy)) * 1.7);
const stoneNoise = (x, y, z) => Math.sin(x * 37 + Math.sin(y * 31)) * Math.sin(y * 29 + z * 23)
    + 0.4 * Math.sin(x * 83 - z * 57) * Math.cos(y * 73);

function eyeAt(x, expression, side) {
    const cx = side * 0.49;
    const dx = (x - cx) / 0.34;
    return {
        cx,
        cy: 0.24 + expression.skew * side,
        height: expression.eyes[side < 0 ? 0 : 1],
        slope: -side * expression.brow,
        dx
    };
}

function mouthAt(x, expression) {
    const [width, height, smile] = expression.mouth;
    const dx = x / width;
    return {width, height, cy: -0.78 + smile * dx * dx + expression.skew * dx, dx};
}

function baseDepth(x, y) {
    const ring = Math.sqrt(Math.max(0.00001, 1 - (y / radiusY) ** 2));
    const width = 1.30 * ring * (1 + 0.075 * Math.exp(-(((y + 0.6) / 0.55) ** 2)));
    return 0.94 * ring * Math.sqrt(Math.max(0.00001, 1 - (x / width) ** 2));
}

function sculptDepth(x, y, expression) {
    let z = baseDepth(x, y);
    // The muzzle, broad nose, glabella, cheekbones and chin are part of one mesh.
    z += 0.15 * gaussian(x, y + 0.92, 0.70, 0.57);
    z += 0.19 * gaussian(x, y + 1.25, 0.56, 0.27);
    z += 0.33 * gaussian(x, y - 0.08, 0.21, 0.62);
    z += 0.49 * gaussian(x, y + 0.25, 0.28, 0.24);
    z += 0.12 * gaussian(x, y - 0.58, 0.22, 0.34);
    for (const side of [-1, 1]) {
        z += 0.19 * gaussian(x - side * 0.76, y + 0.34, 0.28, 0.38);
        z += 0.12 * gaussian(x - side * 0.24, y + 0.31, 0.15, 0.13);
        z -= 0.105 * gaussian(x - side * 0.20, y + 0.37, 0.075, 0.05);
        const eye = eyeAt(x, expression, side);
        const ey = y - eye.cy - eye.slope * eye.dx;
        const q = Math.sqrt(eye.dx ** 2 + (ey / Math.max(eye.height, 0.14)) ** 2);
        z -= 0.23 * Math.exp(-((q / 0.95) ** 2));
        // Integrated lids and heavy brows, with a sharp lower crease.
        z += 0.08 * Math.exp(-(((q - 1.15) / 0.40) ** 2));
        const browY = eye.cy + eye.height + 0.12 + eye.slope * eye.dx;
        z += 0.20 * gaussian(x - eye.cx, y - browY, 0.43, 0.12);
        z -= 0.04 * gaussian(x - eye.cx, y - browY - 0.17, 0.39, 0.035);
        const foldX = side * (0.35 + Math.max(0, -y - 0.34) * 0.56);
        z -= 0.055 * gaussian(x - foldX, y + 0.64, 0.047, 0.34);
    }
    const mouth = mouthAt(x, expression);
    const q = Math.sqrt(mouth.dx ** 2 + ((y - mouth.cy) / Math.max(mouth.height, 0.15)) ** 2);
    z -= 0.34 * Math.exp(-((q / 0.94) ** 2));
    z += 0.10 * Math.exp(-(((q - 1.12) / 0.40) ** 2));
    // Philtrum and the lower-lip/chin crease.
    z -= 0.035 * gaussian(x, y + 0.53, 0.055, 0.12);
    z -= 0.04 * gaussian(x, y + 1.17, 0.36, 0.045);
    return z;
}

function headPoint(u, v, expression) {
    const phi = v * Math.PI;
    const theta = u * Math.PI * 2;
    const y = radiusY * Math.cos(phi);
    const ring = Math.sin(phi);
    const x = 1.30 * ring * Math.sin(theta) * (1 + 0.075 * Math.exp(-(((y + 0.6) / 0.55) ** 2)));
    const cos = Math.cos(theta);
    let z = 0.94 * ring * cos;
    if (cos > 0) {
        const blend = Math.min(1, cos * 5);
        z += (sculptDepth(x, y, expression) - baseDepth(x, y)) * blend;
    }
    return [x, centerY + y, z];
}

function surfaceGeometry(columns, rows, sample, expression) {
    const positions = [];
    const indices = [];
    for (let y = 0; y <= rows; y++) {
        for (let x = 0; x <= columns; x++) {
            positions.push(...sample(x / columns, y / rows, expression));
        }
    }
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
            const a = y * (columns + 1) + x;
            indices.push(a, a + columns + 1, a + 1, a + 1, a + columns + 1, a + columns + 2);
        }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
}

function morphSurface(name, columns, rows, sample, material) {
    const states = expressions.map(expression => surfaceGeometry(columns, rows, sample, expression));
    const geometry = states[0];
    geometry.morphAttributes.position = states.map((state, index) => {
        const attribute = state.attributes.position.clone();
        attribute.name = expressions[index].id;
        return attribute;
    });
    geometry.morphAttributes.normal = states.map(state => state.attributes.normal.clone());
    states.slice(1).forEach(state => state.dispose());
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    mesh.morphTargetInfluences[0] = 1;
    return mesh;
}

function cavityPoint(kind, side, u, v, expression) {
    const angle = u * Math.PI * 2;
    const r = v * 0.84;
    let x, y;
    if (kind === 'eye') {
        const eye = eyeAt(side * 0.49, expression, side);
        x = eye.cx + Math.cos(angle) * 0.34 * r;
        y = eye.cy + Math.sin(angle) * eye.height * r + eye.slope * ((x - eye.cx) / 0.34);
    } else {
        x = Math.cos(angle) * expression.mouth[0] * r;
        const mouth = mouthAt(x, expression);
        y = mouth.cy + Math.sin(angle) * mouth.height * r;
    }
    return [x, centerY + y, sculptDepth(x, y, expression) + 0.065];
}

function toothPoint(tooth, row, u, v, expression) {
    const [width, height] = expression.mouth;
    const x = ((tooth - 3) / 3.9 + (u - 0.5) * 0.20) * width;
    const mouth = mouthAt(x, expression);
    const edge = Math.sqrt(Math.max(0, 1 - mouth.dx ** 2));
    const amount = expression.teeth * (row > 0 ? 1 : 0.8);
    const toothHeight = Math.min(height * 0.68, 0.15) * amount;
    const y = mouth.cy + row * (height * edge * 0.74 - v * toothHeight);
    const z = baseDepth(x, y) + 0.12 - 0.14 * (1 - amount)
        + 0.025 * Math.sin(u * Math.PI) * Math.sin(v * Math.PI);
    return [x, centerY + y, amount > 0 ? z : sculptDepth(x, y, expression) - 0.05];
}

function roundedPlinth(width, depth, height, y, material) {
    const radius = 0.14;
    const x = width / 2;
    const z = depth / 2;
    const shape = new THREE.Shape();
    shape.moveTo(-x + radius, -z);
    shape.lineTo(x - radius, -z);
    shape.quadraticCurveTo(x, -z, x, -z + radius);
    shape.lineTo(x, z - radius);
    shape.quadraticCurveTo(x, z, x - radius, z);
    shape.lineTo(-x + radius, z);
    shape.quadraticCurveTo(-x, z, -x, z - radius);
    shape.lineTo(-x, -z + radius);
    shape.quadraticCurveTo(-x, -z, -x + radius, -z);
    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: height, bevelEnabled: true, bevelSegments: 3,
        steps: 1, bevelSize: 0.055, bevelThickness: 0.045, curveSegments: 8
    });
    geometry.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = y;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

export function createXom() {
    const model = new THREE.Group();
    model.name = 'Xom';
    model.userData = {title: 'Xom — eight faces of chaos', license: 'CC0-1.0', source: 'model.js', expressions: expressions.map(e => e.id)};
    const stone = new THREE.MeshStandardMaterial({color: '#a8a8a3', roughness: 0.62, metalness: 0.035, side: THREE.DoubleSide});
    const dark = new THREE.MeshStandardMaterial({color: '#181719', roughness: 1, side: THREE.DoubleSide});
    const toothMaterial = new THREE.MeshStandardMaterial({color: '#aaa99e', roughness: 0.78, side: THREE.DoubleSide});
    const baseMaterial = new THREE.MeshStandardMaterial({color: expressions[0].color, roughness: 0.67, metalness: 0.07});
    const head = morphSurface('Stone_head', 208, 176, headPoint, stone);
    const colors = [];
    const points = head.geometry.attributes.position;
    for (let i = 0; i < points.count; i++) {
        const shade = 0.94 + 0.035 * stoneNoise(points.getX(i), points.getY(i), points.getZ(i));
        colors.push(shade, shade, shade * 0.985);
    }
    head.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    stone.vertexColors = true;
    model.add(head);
    for (const side of [-1, 1]) {
        model.add(morphSurface(`Eye_${side < 0 ? 'left' : 'right'}`, 64, 12,
            (u, v, e) => cavityPoint('eye', side, u, v, e), dark));
    }
    model.add(morphSurface('Mouth', 80, 16, (u, v, e) => cavityPoint('mouth', 0, u, v, e), dark));
    for (const row of [1, -1]) {
        for (let i = 0; i < 7; i++) {
            model.add(morphSurface(`Tooth_${row}_${i}`, 6, 5, (u, v, e) => toothPoint(i, row, u, v, e), toothMaterial));
        }
    }
    const tongueMaterial = new THREE.MeshStandardMaterial({color: '#9c9b94', roughness: 0.66, side: THREE.DoubleSide});
    model.add(morphSurface('Tongue', 40, 24, (u, v, expression) => {
        const theta = u * Math.PI * 2;
        const phi = v * Math.PI;
        const amount = expression.tongue;
        const x = -0.22 + Math.sin(phi) * Math.cos(theta) * 0.20 * amount;
        const y = -1.02 + Math.cos(phi) * 0.30 * amount;
        const z = amount ? 1.04 + Math.sin(phi) * Math.sin(theta) * 0.13
            - 0.035 * gaussian(x + 0.22, y + 1.0, 0.035, 0.3) : 0.5;
        return [x, centerY + y, z];
    }, tongueMaterial));
    [[3.18, 2.48, 0.15, 0.06], [2.99, 2.29, 0.22, 0.28], [2.71, 2.03, 0.12, 0.57]].forEach(([w, d, h, y], index) => {
        const base = roundedPlinth(w, d, h, y, baseMaterial);
        base.name = `Plinth_${index}`;
        model.add(base);
    });
    const meshes = model.children.filter(child => child.morphTargetInfluences);
    function setExpression(index, next = index, mix = 0) {
        meshes.forEach(mesh => {
            mesh.morphTargetInfluences.fill(0);
            mesh.morphTargetInfluences[index] = 1 - mix;
            mesh.morphTargetInfluences[next] += mix;
        });
        baseMaterial.color.set(expressions[index].color).lerp(new THREE.Color(expressions[next].color), mix);
    }
    // Exportable morph animation: a readable hold, then a smooth change of face.
    const times = [];
    const values = [];
    for (let i = 0; i < 8; i++) {
        for (const time of [i * 3.5, i * 3.5 + 2.7]) {
            times.push(time);
            values.push(...expressions.map((_, j) => i === j ? 1 : 0));
        }
    }
    times.push(28);
    values.push(1, 0, 0, 0, 0, 0, 0, 0);
    model.animations = [new THREE.AnimationClip('Eight_faces_of_Xom', 28, meshes.map(mesh =>
        new THREE.NumberKeyframeTrack(`${mesh.name}.morphTargetInfluences`, times, values)
    ))];
    setExpression(0);
    return {model, setExpression, expressions};
}
