
# Replace Hex Bin Heatmap with Flat Color Spectrum Heatmap

## What Changes

The current heatmap uses **vertical hexagonal prisms** (hex bins) that rise up from the globe surface. This will be replaced with the **Heatmaps Layer** built into react-globe.gl, which renders smooth, flat color gradients across the globe surface using Gaussian Kernel Density Estimation (KDE). This creates a much more natural "heat signature" visualization with color spectrum transitions.

## Visual Result

Instead of 3D hexagonal columns, you will see smooth colored areas that spread across regions where data is concentrated. High-density areas (like DC/Virginia) will glow bright warm colors, while lower-density areas fade through a cool-to-warm spectrum. The effect is similar to a thermal camera overlay on the globe.

## Technical Details

### File: `src/components/globe/GlobeView.tsx`

**Remove**: All `hexBin*` and `hex*` props (lines 205-229) -- the hex bin layer configuration.

**Add**: Heatmaps Layer props:
- `heatmapsData` -- wraps all heatmap points into a single dataset array `[{ points, color, ... }]`
- `heatmapPoints` -- accessor for the points array within each dataset
- `heatmapPointLat` / `heatmapPointLng` / `heatmapPointWeight` -- same field accessors as before
- `heatmapBandwidth` -- set to ~4 degrees for smooth spread across regions
- `heatmapColorFn` -- custom function mapping density (0-1) to a cyan-to-amber-to-red color spectrum matching the intelligence terminal aesthetic
- `heatmapColorSaturation` -- set to ~1.5 for vivid colors
- `heatmapBaseAltitude` -- 0.004 (just above the surface, flat)
- `heatmapTopAltitude` -- 0.004 (same as base = completely flat surface heatmap)

The `mergedHeatmap` data will be restructured from a flat array of points into a single heatmap dataset object: `[{ points: mergedHeatmap }]`.

The custom color function will use an HSL spectrum:
- Low density (0): transparent dark blue
- Medium density (0.3-0.5): cyan/teal (matching the app's primary color)
- High density (0.7-1.0): amber to red (hot zones)

### File: `src/components/globe/GlobeView.tsx` (interface)

No changes needed to the component interface -- `aiHeatmapPoints` and `showHeatmap` props remain the same.

### Files unchanged
- `src/lib/demo-globe-data.ts` -- HeatmapPoint interface and data remain identical
- `src/pages/GlobePage.tsx` -- toggle logic and filters stay the same
