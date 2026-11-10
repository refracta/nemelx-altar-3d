"""Reconstruct the original Xom sculpt references with TRELLIS on a CUDA GPU.

This runs offline; the published viewer only loads the resulting GLB assets.
See ../source/README.md for the pinned environment and generation provenance.
"""

import argparse
import os
from pathlib import Path
import sys
import time

os.environ.setdefault("ATTN_BACKEND", "xformers")
os.environ.setdefault("SPCONV_ALGO", "native")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--trellis", type=Path, required=True)
    parser.add_argument("--weights", required=True)
    parser.add_argument("--inputs", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--faces", nargs="+", default=[
        "grin", "smirk", "tongue", "rage", "delight", "surprise", "grimace", "pleased"
    ])
    parser.add_argument("--seed", type=int, default=4253)
    args = parser.parse_args()
    sys.path.insert(0, str(args.trellis.resolve()))

    import numpy as np
    from PIL import Image
    import torch
    import trimesh
    from trellis.pipelines import TrellisImageTo3DPipeline

    pipeline = TrellisImageTo3DPipeline.from_pretrained(args.weights)
    pipeline.cuda()
    args.output.mkdir(parents=True, exist_ok=True)
    for face in args.faces:
        if (args.output / f"{face}.npz").exists():
            continue
        started = time.monotonic()
        result = pipeline.run(
            Image.open(args.inputs / f"{face}.png"),
            seed=args.seed,
            formats=["mesh"],
            sparse_structure_sampler_params={"steps": 25, "cfg_strength": 7.5},
            slat_sampler_params={"steps": 25, "cfg_strength": 5.0},
        )["mesh"][0]
        vertices = result.vertices.cpu().numpy()
        faces = result.faces.cpu().numpy()
        colors = result.vertex_attrs[:, :3].cpu().numpy()
        np.savez_compressed(args.output / f"{face}.npz", vertices=vertices,
                            faces=faces, colors=colors)
        # TRELLIS uses Z-up. glTF uses Y-up (same conversion as its exporter).
        vertices = vertices @ np.array([[1, 0, 0], [0, 0, -1], [0, 1, 0]])
        rgba = np.c_[np.clip(colors * 255, 0, 255).astype(np.uint8),
                     np.full(len(vertices), 255, dtype=np.uint8)]
        mesh = trimesh.Trimesh(vertices=vertices, faces=faces,
                               vertex_colors=rgba, process=False)
        mesh.export(args.output / f"{face}-raw.glb")
        print(f"{face}: {len(vertices):,} vertices, {len(faces):,} triangles, "
              f"{time.monotonic() - started:.1f}s", flush=True)
        del result
        torch.cuda.empty_cache()


if __name__ == "__main__":
    main()
