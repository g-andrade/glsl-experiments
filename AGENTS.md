# GLSL Experiments — Agent Guide

## Project shape

Nine standalone GLSL ES fragment shaders originally written for
[glslsandbox.com](http://glslsandbox.com) (~2014). No build system, no
dependencies. MIT licensed.

File naming: `<glslsandbox_id>.<revision> - <title>.frag`

## Uniform / varying conventions (glslsandbox)

| Name | Type | Notes |
|------|------|-------|
| `time` | `float` | Seconds since shader start |
| `mouse` | `vec2` | **Normalised [0,1]**, Y=0 at bottom — not pixels |
| `resolution` | `vec2` | Canvas size in pixels |
| `backbuffer` | `sampler2D` | Previous frame (ping-pong); only some shaders use it |
| `surfaceSize` | `vec2 uniform` | Pass `vec2(1.0, 1.0)` |
| `surfacePosition` | `vec2 varying` | Must be declared in the vertex shader as `pos / 2.0` (where `pos` is the clip-space attribute). Shaders that use this need a vertex shader that outputs it — a minimal quad VS that omits it will fail to link. |

## Known GLSL ES pitfall

`pow(x, y)` with `x < 0` is **undefined behaviour** in GLSL ES. It commonly
manifests as bright garbage pixels on desktop GPUs (the driver returns a large
positive value instead of 0). Guard any `pow` call whose base can go negative:

```glsl
float norm = MAX(0.0, (max_dist - dist) / max_dist);
float distorted = pow(norm, expon);
```

This affected `skewed_inv_distance()` in Humanóides na discoteca and Cheshire
cat and has been fixed in both.

## Indentation

Most files use **tabs**. Pacmen on steroids and Páscoa use **spaces**. Every
file has a vim/emacs modeline on line 1 — respect it and do not reformat.

## Testing

Open `demo.html` directly in a browser (`file://` — no server needed). It
implements the full glslsandbox uniform set including ping-pong FBO for
`backbuffer`, and selects the correct vertex shader (with or without
`surfacePosition`) based on the fragment shader source.
