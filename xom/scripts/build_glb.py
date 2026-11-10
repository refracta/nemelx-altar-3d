"""Assemble eight reconstructed sculptures into one compact, animated glTF.

Uses a common plinth and one independently sculpted mesh per expression.
No raster projection, billboard, external texture or runtime inference is used.
"""

import argparse
from pathlib import Path

import fast_simplification
import numpy as np
from pygltflib import (GLTF2, Accessor, Animation, AnimationChannel,
                      AnimationChannelTarget, AnimationSampler, Asset,
                      Attributes, Buffer, BufferView, Material, Mesh, Node,
                      PbrMetallicRoughness, Primitive, Scene)
from scipy.spatial import cKDTree
import trimesh

EXPRESSIONS = ["grin", "smirk", "tongue", "rage", "delight", "surprise",
               "grimace", "pleased"]


def linear(rgb):
    return np.where(rgb <= 0.04045, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4)


def prepare(path, yaw, plinth_height):
    raw = np.load(path)
    vertices = raw["vertices"] @ np.array([[1, 0, 0], [0, 0, -1], [0, 1, 0]])
    angle = np.deg2rad(yaw)
    vertices = vertices @ np.array([[np.cos(angle), 0, -np.sin(angle)],
                                    [0, 1, 0],
                                    [np.sin(angle), 0, np.cos(angle)]])
    low, high = vertices.min(axis=0), vertices.max(axis=0)
    vertices -= [(low[0] + high[0]) / 2, low[1], (low[2] + high[2]) / 2]
    vertices *= 3.6 / (high[1] - low[1])
    head_vertices = vertices[vertices[:, 1] >= plinth_height]
    head_low, head_high = head_vertices.min(axis=0), head_vertices.max(axis=0)
    # Independent reconstruction can drift slightly in width/depth. Keep the
    # same skull envelope so the expression cycle stays registered.
    vertices[:, 0] = (vertices[:, 0] - (head_low[0] + head_high[0]) / 2) * 2.4 / (head_high[0] - head_low[0])
    vertices[:, 2] = (vertices[:, 2] - (head_low[2] + head_high[2]) / 2) * 2.3 / (head_high[2] - head_low[2]) + 0.1
    colors = np.clip(raw["colors"], 0, 1)
    mesh = trimesh.Trimesh(vertices=vertices, faces=raw["faces"], process=False)
    plinth = vertices[mesh.faces].mean(axis=1)[:, 1] < plinth_height
    return mesh, colors, plinth


def simplify(mesh, colors, mask, target):
    selected = mesh.submesh([np.flatnonzero(mask)], append=True, repair=False)
    vertices, faces = np.asarray(selected.vertices), np.asarray(selected.faces)
    if len(faces) > target:
        vertices, faces = fast_simplification.simplify(vertices, faces,
                                                     target_count=target)
    _, nearest = cKDTree(mesh.vertices).query(vertices)
    rgb = colors[nearest]
    # Reject isolated dark reconstruction speckles while retaining broad cavity
    # shading and the separations between teeth.
    _, neighbours = cKDTree(vertices).query(vertices, k=16)
    rgb = np.median(rgb[neighbours], axis=1)
    # Preserve the reconstructed occlusion in sockets and tooth gaps in linear light.
    rgb = linear(rgb)
    result = trimesh.Trimesh(vertices=vertices, faces=faces, process=False)
    # The reconstructed surface carries high-frequency sampling ridges. A
    # volume-preserving smooth keeps the nose/lips while removing those ridges.
    trimesh.smoothing.filter_taubin(result, lamb=0.5, nu=0.53, iterations=20)
    adjacency = trimesh.smoothing.laplacian_calculation(result)
    for _ in range(5):
        rgb = rgb * 0.5 + adjacency.dot(rgb) * 0.5
    # Softly lift baked shadows before studio lighting is applied again.
    rgb = np.power(rgb, 0.78)
    # Remove collapsed triangles introduced by smoothing tiny reconstructed
    # components, and compact the matching vertex colours with the geometry.
    clean_faces = result.faces[result.nondegenerate_faces(height=1e-6) & result.unique_faces()]
    used = np.unique(clean_faces)
    remap = np.full(len(result.vertices), -1, dtype=np.int64)
    remap[used] = np.arange(len(used))
    result = trimesh.Trimesh(result.vertices[used], remap[clean_faces], process=False)
    rgb = rgb[used]
    return result, rgb


def stone_step(width, depth, bottom, height, bevel=0.08):
    """A clean bevelled stone slab, with rounded corners and smooth edges."""
    vertices = []
    faces = []
    samples = 12
    radius = 0.15
    for y, inset in [(bottom, bevel), (bottom + bevel, 0),
                     (bottom + height - bevel, 0), (bottom + height, bevel)]:
        for corner, (sx, sz) in enumerate([(1, 1), (-1, 1), (-1, -1), (1, -1)]):
            for angle in np.linspace(corner * np.pi / 2,
                                     (corner + 1) * np.pi / 2, samples):
                x = sx * (width / 2 - radius) + (radius - inset) * np.cos(angle)
                z = sz * (depth / 2 - radius) + (radius - inset) * np.sin(angle)
                vertices.append([x, y, z])
    count = samples * 4
    for ring in range(3):
        for i in range(count):
            a, b = ring * count + i, ring * count + (i + 1) % count
            faces.extend([[a, a + count, b], [b, a + count, b + count]])
    for ring, y in [(0, bottom), (3, bottom + height)]:
        center = len(vertices)
        vertices.append([0, y, 0])
        for i in range(count):
            a, b = ring * count + i, ring * count + (i + 1) % count
            faces.append([center, a, b] if ring == 0 else [center, b, a])
    mesh = trimesh.Trimesh(vertices=vertices, faces=faces, process=True)
    mesh.fix_normals()
    return mesh


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--yaw", type=float, default=180)
    parser.add_argument("--plinth-height", type=float, default=0.76)
    parser.add_argument("--triangles", type=int, default=70000)
    parser.add_argument("--faces", nargs="+", default=EXPRESSIONS)
    args = parser.parse_args()

    gltf = GLTF2(asset=Asset(version="2.0", generator="CNC Xom sculpt builder"),
                 scenes=[Scene(nodes=[0])], scene=0,
                 nodes=[Node(name="Xom", children=[], extras={
                     "license": "CC0-1.0", "expressions": args.faces,
                     "source": "OpenAI image_gen + microsoft/TRELLIS-image-large",
                     "animation": "Eight sculpted expressions, 3.5 seconds per face"
                 })], meshes=[], bufferViews=[], accessors=[], animations=[],
                 materials=[
                     Material(name="Smooth gray stone", pbrMetallicRoughness=
                              PbrMetallicRoughness(baseColorFactor=[1, 1, 1, 1],
                                                  metallicFactor=0, roughnessFactor=0.62)),
                     Material(name="Xom purple plinth", pbrMetallicRoughness=
                              PbrMetallicRoughness(baseColorFactor=[*linear(np.array([132, 95, 191]) / 255).tolist(), 1],
                                                  metallicFactor=0, roughnessFactor=0.78)),
                     Material(name="Recessed stone interior", pbrMetallicRoughness=
                              PbrMetallicRoughness(baseColorFactor=[1, 1, 1, 1],
                                                  metallicFactor=0, roughnessFactor=1))
                 ])
    binary = bytearray()

    def accessor(values, kind, component=5126, normalized=False, bounds=False, target=None):
        while len(binary) % 4:
            binary.append(0)
        dtype = {5126: "<f4", 5125: "<u4", 5121: "u1"}[component]
        values = np.ascontiguousarray(values, dtype=dtype)
        data = values.tobytes()
        view = len(gltf.bufferViews)
        gltf.bufferViews.append(BufferView(buffer=0, byteOffset=len(binary), byteLength=len(data), target=target))
        binary.extend(data)
        item = Accessor(bufferView=view, componentType=component, count=len(values),
                        type=kind, normalized=normalized)
        if bounds:
            item.min = np.atleast_1d(values.min(axis=0)).tolist()
            item.max = np.atleast_1d(values.max(axis=0)).tolist()
        gltf.accessors.append(item)
        return len(gltf.accessors) - 1

    def add_mesh(name, mesh, rgb, material, active=True):
        normals = mesh.vertex_normals.copy()
        lengths = np.linalg.norm(normals, axis=1)
        valid = lengths > 1e-8
        if not valid.all():
            _, nearest = cKDTree(mesh.vertices[valid]).query(mesh.vertices[~valid])
            normals[~valid] = normals[valid][nearest]
        normals /= np.linalg.norm(normals, axis=1, keepdims=True)
        if name.startswith("Face_"):
            adjacency = trimesh.smoothing.laplacian_calculation(mesh)
            for _ in range(4):
                normals = 0.65 * normals + 0.35 * adjacency.dot(normals)
                normals /= np.linalg.norm(normals, axis=1, keepdims=True)
        rgba = np.c_[np.clip(rgb * 255, 0, 255).astype(np.uint8),
                     np.full(len(rgb), 255, dtype=np.uint8)]
        attrs = Attributes(POSITION=accessor(mesh.vertices, "VEC3", bounds=True, target=34962),
                           NORMAL=accessor(normals, "VEC3", target=34962),
                           COLOR_0=accessor(rgba, "VEC4", 5121, normalized=True, target=34962))
        primitive = Primitive(attributes=attrs,
                              indices=accessor(mesh.faces.reshape(-1), "SCALAR", 5125, target=34963),
                              material=material)
        gltf.meshes.append(Mesh(name=name, primitives=[primitive]))
        node = len(gltf.nodes)
        gltf.nodes.append(Node(name=name, mesh=len(gltf.meshes) - 1,
                               scale=[1, 1, 1] if active else [0, 0, 0]))
        gltf.nodes[0].children.append(node)
        print(f"{name}: {len(mesh.vertices):,} vertices, {len(mesh.faces):,} triangles")
        return node

    nodes = []
    # A recessed three-dimensional core closes sightlines through the open eye
    # and mouth tunnels without filling their sculpted rims or flattening them.
    core = trimesh.creation.icosphere(subdivisions=3)
    core.vertices *= [0.94, 1.3, 0.65]
    core.vertices += [0, 2.05, 0.1]
    add_mesh("Cavity_core", core, np.full((len(core.vertices), 3), 0.004), 2)
    for index, face in enumerate(args.faces):
        yaw = args.yaw - 90 if face == "surprise" else args.yaw
        mesh, colors, plinth = prepare(args.input / f"{face}.npz", yaw,
                                       args.plinth_height)
        if index == 0:
            base = trimesh.util.concatenate([
                stone_step(2.85, 2.15, 0.03, 0.36),
                stone_step(2.60, 1.95, 0.35, args.plinth_height + 0.02 - 0.35)
            ])
            base_rgb = np.ones((len(base.vertices), 3))
            add_mesh("Plinth", base, base_rgb, 1)
        head, rgb = simplify(mesh, colors, ~plinth, args.triangles)
        nodes.append(add_mesh(f"Face_{face}", head, rgb, 0, active=index == 0))

    times = np.arange(len(nodes) + 1, dtype=np.float32) * 3.5
    time_accessor = accessor(times, "SCALAR", bounds=True)
    animation = Animation(name="Xom — eight faces of chaos", samplers=[], channels=[])
    for index, node in enumerate(nodes):
        scales = np.zeros((len(times), 3))
        scales[index] = 1
        if index == 0:
            scales[-1] = 1
        animation.samplers.append(AnimationSampler(input=time_accessor,
                                                    output=accessor(scales, "VEC3"),
                                                    interpolation="STEP"))
        animation.channels.append(AnimationChannel(sampler=index,
                                                    target=AnimationChannelTarget(node=node, path="scale")))
    gltf.animations.append(animation)
    gltf.buffers = [Buffer(byteLength=len(binary))]
    gltf.set_binary_blob(bytes(binary))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    gltf.save_binary(str(args.output))
    print(f"Saved {args.output}: {args.output.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
