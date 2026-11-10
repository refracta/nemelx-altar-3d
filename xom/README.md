# Xom: eight faces of chaos

[Open the viewer](https://refracta.github.io/nemelx-altar-3d/xom/) · [Download the animated model](https://refracta.github.io/nemelx-altar-3d/xom/xom.glb)

An original 3D stone head on a stepped altar, with eight expressions based on Crawl's 32×32 Xom altar tiles. The sculpture is built directly from editable geometry in [`model.js`](model.js). No image generation, remote inference or proprietary model file is needed to rebuild it.

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

The stone face, lids, mouth, teeth and tongue have eight morph targets. The viewer blends between them over a 28-second loop and changes the plinth colour to match the tile. The downloadable GLB contains the same eight morph targets and animation, with a purple plinth.

## Controls

Drag to orbit, scroll or pinch to zoom, and use the eight buttons or keys **1–8** to select a face. Selecting a face pauses cycling. **Space** toggles cycling when the viewport is focused. Automatic rotation is optional. Free flight uses **WASD**, **Space/Shift** for height, and **Esc** to return to orbit.

The language selector and `?lang=ko` / `?lang=en` support Korean and English. Reduced-motion preferences disable automatic expression changes initially. Rendering pauses in hidden tabs; animation uses elapsed time rather than frame count.

## Local development and export

From the repository root:

```sh
python3 -m http.server 6061
```

Open <http://localhost:6061/xom/>. No build or package installation is required. Three.js **0.169.0** and the used add-ons are vendored under `vendor/` with their MIT licence, so the viewer makes no runtime CDN requests.

After changing `model.js`, use **Download animated GLB** in the viewer and replace `xom/xom.glb` with that export. This also keeps the no-WebGL download fallback current. Run `npm run check` inside `xom/`, inspect all eight expressions and their transitions, and validate the GLB with the Khronos glTF Validator. Test orbit, zoom, free flight, reset, language switching, narrow screens and reduced motion before publication.

## Asset provenance and licences

- The new sculpture geometry and exported `xom.glb` are dedicated to **CC0 1.0**, following the existing Nemelex model's download convention. See [`LICENSE.model.txt`](LICENSE.model.txt). The editable geometry recipe is in `model.js`.
- `reference/xom0.png` through `reference/xom7.png` are unmodified Crawl reference tiles from [`crawl/crawl` at `181c61d5ab7287e21114405b3e77c4cd3d89733e`](https://github.com/crawl/crawl/tree/181c61d5ab7287e21114405b3e77c4cd3d89733e/crawl-ref/source/rltiles/dngn/altars). They appear as reference thumbnails, not textures on the model. Their upstream notices are preserved in [`reference/LICENSE.crawl.txt`](reference/LICENSE.crawl.txt) and [`reference/LICENSE.rltiles.txt`](reference/LICENSE.rltiles.txt); see [Crawl's tile licensing records](https://github.com/crawl/tiles). The CC0 dedication for the new sculpture does not relicense these files.
- [Ploomutoo's Xom sculpture](https://www.deviantart.com/ploomutoo/art/Xom-753126867) was consulted as a visual reference for the idea of an expressive stone head on a plinth. Its artwork, GIF frames, mesh and textures are **not included or used as model inputs**. That work retains its own CC BY-NC-ND 3.0 licence.
- Three.js and its add-ons retain the [MIT licence](vendor/LICENSE.three). The vendor files are unmodified npm distribution files.
