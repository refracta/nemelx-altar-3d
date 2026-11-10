# Sculpt source and reconstruction

These eight PNGs are original **OpenAI image_gen** sculpt references, generated
on 2026-11-11 from the original Crawl `xom0.png` tile and then edited into eight
expressions. They are modelling inputs, not billboards or textures in the viewer.
The published sculpture has real geometry on all sides.

The first draft had a very wide head, realistic pupils and three widely spaced
teeth. A second edit (`grin.png`) narrowed the head, removed the pupils, added two
rows of blunt teeth, reduced the bulbous nose, and smoothed the stone surface.
The seven expression edits use only this revised original sculpt as their image
reference. The complete prompts are in `grin-prompts.txt` and
`expression-prompts.json`.

Ploomutoo's DeviantArt sculpture was inspected as a visual reference. **No frame
from that artwork, no third-party mesh and no third-party texture was provided
to either image generation or 3D reconstruction.**

## Offline reconstruction

The reconstruction uses the public MIT-licensed
[Microsoft TRELLIS](https://github.com/microsoft/TRELLIS) at
`193e0502b5cb3eb5997ec457d5340e95d09b158e` with
[`microsoft/TRELLIS-image-large`](https://huggingface.co/microsoft/TRELLIS-image-large).
Only the sparse-structure, structured-latent flow and mesh-decoder checkpoints
are needed; the Gaussian and radiance-field decoders are omitted from the local
`pipeline.json`. DINOv2 ViT-L/14 with registers is its original image encoder.

Generation used an isolated Python 3.10 environment on an RTX 3090 with PyTorch
2.4.0 + CUDA 12.1, torchvision 0.19.0, xformers 0.0.27.post2, kaolin 0.17.0,
spconv-cu120, NumPy 1.26.4, Pillow 11.1.0, transformers 4.46.3, rembg 2.0.61,
and the upstream utils3d revision `9a4eb15e4021b67b12c460c7057d642626897ec8`.
Use TRELLIS's documented basic dependencies in addition to those pins.

```sh
PYTHONNOUSERSITE=1 CUDA_VISIBLE_DEVICES=0 python scripts/reconstruct.py \
    --trellis /path/to/TRELLIS --weights /path/to/weights \
    --inputs source --output /path/to/raw

python scripts/build_glb.py --input /path/to/raw --output xom.glb
```

The reconstruction seed is **4253**, with 25 steps for both samplers, sparse
guidance 7.5 and latent guidance 5.0. The script skips existing `.npz` files so a
long run can resume. The raw arrays preserve positions, topology and predicted
vertex colour before mesh preparation.

`build_glb.py` requires NumPy, SciPy, trimesh, fast-simplification and pygltflib.
It converts the axes to glTF's Y-up convention, registers the skull envelopes,
corrects the surprise reconstruction's orientation, and replaces the generated
plinth with two clean bevelled stone steps. It reduces each head to about 70,000
triangles, applies volume-preserving Taubin smoothing, and softens the predicted
vertex shading in linear colour space. A recessed interior mesh closes sightlines
through the eye and mouth tunnels. The output contains eight independently
sculpted heads and a 28-second **stepped** expression animation. The distinct
open mouths and tongue have their own topology.

The generated source images and our new mesh assets use the CC0 dedication in
[`../LICENSE.model.txt`](../LICENSE.model.txt), to the extent rights are held in
the new work. Upstream Crawl tiles and third-party software retain their own
licences; this dedication does not relicense them.
