import {Color} from 'three';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';

export const modelUrl = new URL('./xom.glb?v=2', import.meta.url);

export const expressions = [
    {id: 'grin', en: 'Grin', ko: '씨익', color: '#888782'},
    {id: 'smirk', en: 'Smirk', ko: '능청', color: '#456f72'},
    {id: 'tongue', en: 'Tongue out', ko: '메롱', color: '#77416d'},
    {id: 'rage', en: 'Rage', ko: '격노', color: '#a34327'},
    {id: 'delight', en: 'Delight', ko: '환희', color: '#54892a'},
    {id: 'surprise', en: 'Surprise', ko: '경악', color: '#842499'},
    {id: 'grimace', en: 'Grimace', ko: '으득', color: '#345b9b'},
    {id: 'pleased', en: 'Pleased', ko: '흡족', color: '#aa7a30'}
];

export async function createXom() {
    const gltf = await new GLTFLoader().loadAsync(modelUrl.href);
    const model = gltf.scene;
    model.name = 'Xom';
    model.animations = gltf.animations;
    const heads = expressions.map(expression => model.getObjectByName(`Face_${expression.id}`));
    const plinth = model.getObjectByName('Plinth');
    if (heads.some(head => !head) || !plinth) throw new Error('Incomplete Xom sculpture');
    const colors = expressions.map(expression => new Color(expression.color));
    model.traverse(child => {
        if (!child.isMesh) return;
        child.castShadow = true;
        // The face already contains cavity shading from reconstruction.
        child.receiveShadow = child.name === 'Plinth';
    });
    // Each mouth has its own topology, including a fully sculpted tongue.
    // Switch whole expressions as the original tile animation does.
    function setExpression(index) {
        if (!Number.isInteger(index) || index < 0 || index >= heads.length) return;
        heads.forEach((head, i) => {
            head.scale.setScalar(i === index ? 1 : 0);
            head.visible = i === index;
        });
        plinth.material.color.copy(colors[index]);
    }
    setExpression(0);
    return {model, setExpression, expressions};
}
