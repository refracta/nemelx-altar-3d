# Xom: eight faces of chaos

[Open the viewer](https://refracta.github.io/nemelx-altar-3d/xom/) · [Download the animated model](https://refracta.github.io/nemelx-altar-3d/xom/xom.glb)

An original 3D stone head on a stepped altar, with eight expressions based on Crawl's 32×32 Xom altar tiles. The face has a broad blunt nose, deep empty eye sockets, fleshy cheek folds and sculpted stone teeth. Original image-generation references were reconstructed with TRELLIS, then aligned, smoothed and assembled into the downloadable model. The browser loads the finished geometry; no inference service is needed at runtime.

| Tile | Expression | 한국어 |
| --- | --- | --- |
| xom0 | Grin | 씨익 |
| xom1 | Smirk | 능청 |
| xom2 | Tongue out | 메롱 |
| xom3 | Rage | 격노 |
| xom4 | Delight | 환희 |
| xom5 | Surprise | 경악 |
| xom6 | Grimace | 으득 |
| xom7 | Pleased | 흡족 |

Each expression has its own complete sculpted mesh, including the open mouths and protruding tongue. The viewer switches expressions every 3.5 seconds over a 28-second loop, like the original tile animation, and changes the plinth colour to match the tile. The downloadable GLB contains all eight expressions and the same stepped animation, with a purple plinth. This version uses separate sculpted meshes rather than morph targets.

The head envelope is aligned across expressions, and the two stone steps are shared. An internal recessed mesh closes the sightlines through eye and mouth openings. The asset has no external textures. Only the selected head is rendered in the viewer.

## Controls

Drag to orbit, scroll or pinch to zoom, and use the eight buttons or keys **1–8** to select a face. Selecting a face pauses cycling. **Space** toggles cycling when the viewport is focused. Automatic rotation is optional. Free flight uses **WASD**, **Space/Shift** for height, and **Esc** to return to orbit.

The language selector and `?lang=ko` / `?lang=en` support Korean and English. Reduced-motion preferences disable automatic expression changes initially. Rendering pauses in hidden tabs; animation uses elapsed time rather than frame count.

## Local development and export

From the repository root:

```sh
python3 -m http.server 6061
```

Open <http://localhost:6061/xom/>. No build or package installation is required. Three.js **0.169.0** and the used add-ons are vendored under `vendor/` with their MIT licence, so the viewer makes no runtime CDN requests.

The original generated references, prompts, pinned reconstruction environment and rebuild commands are documented in [`source/README.md`](source/README.md). [`scripts/reconstruct.py`](scripts/reconstruct.py) saves raw mesh arrays; [`scripts/build_glb.py`](scripts/build_glb.py) prepares the geometry and animation. [`model.js`](model.js) loads the resulting GLB and handles expression selection. The download button always serves the complete model, regardless of the selected expression.

Run `npm run check` inside `xom/`, inspect all eight faces from the front and side, and validate the GLB with the Khronos glTF Validator. Check expression selection, autoplay, orbit, download, language switching, narrow screens and reduced motion before publication.

## Asset provenance and licences

- The original generated sculpt references and new `xom.glb` use the **CC0 1.0** dedication, to the extent rights are held in the new work. See [`LICENSE.model.txt`](LICENSE.model.txt) and the complete [asset provenance](source/README.md). Rebuild scripts are included.
- `reference/xom0.png` through `reference/xom7.png` are unmodified Crawl reference tiles from [`crawl/crawl` at `181c61d5ab7287e21114405b3e77c4cd3d89733e`](https://github.com/crawl/crawl/tree/181c61d5ab7287e21114405b3e77c4cd3d89733e/crawl-ref/source/rltiles/dngn/altars). They appear as reference thumbnails, not textures on the model. Their upstream notices are preserved in [`reference/LICENSE.crawl.txt`](reference/LICENSE.crawl.txt) and [`reference/LICENSE.rltiles.txt`](reference/LICENSE.rltiles.txt); see [Crawl's tile licensing records](https://github.com/crawl/tiles). The CC0 dedication for the new sculpture does not relicense these files.
- [Ploomutoo's Xom sculpture](https://www.deviantart.com/ploomutoo/art/Xom-753126867) was consulted as a visual reference for the idea of an expressive stone head on a plinth. Its artwork, GIF frames, mesh and textures are **not included or used as model inputs**. That work retains its own CC BY-NC-ND 3.0 licence.
- Reconstruction uses Microsoft's [MIT-licensed TRELLIS code and models](https://github.com/microsoft/TRELLIS); no model weights are redistributed here.
- Three.js and its add-ons retain the [MIT licence](vendor/LICENSE.three). The vendor files are unmodified npm distribution files.
