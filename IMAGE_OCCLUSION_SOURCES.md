# Native image occlusion research

Confirmed with the installed official `anki==26.8.1` Python backend in
`D:\CODEX\.venv`, creating a temporary collection outside the workspace.

The stock note type has `originalStockKind: 6`. Its field tags identify roles:
0 = occlusion, 1 = image, 2 = header, 3 = back extra, 4 = comments. Use field tags,
not field names or array positions: names can be translated and fields reordered.

Native format example: `{{c1::image-occlusion:rect:left=.1:top=.2:width=.3:height=.4:oi=1}}<br>`.
Coordinates are fractions of original image width/height. Ellipse `left,top` is
the bounding box origin; center is `(left+rx,top+ry)`. Polygon vertices are moved
by `(left-min(point.x),top-min(point.y))`. Repeated cloze numbers form groups.
`oi=1` means an inactive mask is painted on both question and answer. Without it,
other cards' masks are absent. Current masks are pink on question and a transparent
pink outline on answer. c0 shapes remain pink and opaque on both sides. Painter
order is active/c0, inactive, then answer highlights.

The official JavaScript additionally supports text, fill colors and rotations.
This helper deliberately rejects those instead of guessing or silently omitting
them. Stored `angle` is units of 1/10000 revolution, not degrees. A future exact
rotation implementation must rotate in pixel coordinates around `(left,top)`.
Text annotations can cover content, so silently dropping unsupported c0 text
would be unsafe. A malformed/unknown shape rejects the ENTIRE card. A missing
selected ordinal also fails closed; it is not safe to render the image alone.

Official primary sources (read 2026-09-10):

- https://github.com/ankitects/anki/blob/main/ts/routes/image-occlusion/shapes/to-cloze.ts
- https://github.com/ankitects/anki/blob/main/ts/routes/image-occlusion/shapes/from-cloze.ts
- https://github.com/ankitects/anki/blob/main/ts/routes/image-occlusion/shapes/rectangle.ts
- https://github.com/ankitects/anki/blob/main/ts/routes/image-occlusion/shapes/ellipse.ts
- https://github.com/ankitects/anki/blob/main/ts/routes/image-occlusion/shapes/polygon.ts
- https://github.com/ankitects/anki/blob/main/ts/routes/image-occlusion/shapes/lib.ts
- https://github.com/ankitects/anki/blob/main/ts/routes/image-occlusion/review.ts
- https://github.com/ankitects/anki/blob/main/docs-site/manual/editing.mdx

Implementation is an original conservative data parser/SVG generator, not copied
Anki JavaScript. It never imports/evaluates template code or trusts supplied SVG.

## Integration

Call `render_native_image_occlusion(model, note.fields, card.ord, resolve_media)`.
The resolver returns `MediaAsset('/media/URL-encoded-basename.png', width, height)`
after confirming the file is a local raster and dimensions are actual pixels.
Return None for missing/invalid images. `recognized` tells whether the native IO
branch applies. If recognized but unsupported, preserve the warning HTML and do
not fall back to the standard JS-dependent Anki rendering.

Keep generated SVG image + mask elements together through sanitization. Permit
only local `/media/basename` href on generated SVG `image` tags; other foreign
hrefs must stay forbidden. The generated image and masks are one SVG, without a
separate img element. The resolver must not trust merely the file extension: use
a raster decoder to verify content. Server media responses need appropriate MIME,
nosniff, and restricted paths as elsewhere in the app.

Native template customization is not interpreted: static default mask colors and
plain text Header/Back Extra are rendered. Comments remain hidden. HTML content
and imported CSS/JavaScript are not copied into the static card.
