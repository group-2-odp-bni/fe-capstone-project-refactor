export function applyWatermarkPattern(canvas, watermarkSrc) {
    return new Promise((resolve) => {
        const ctx = canvas.getContext("2d");
        const { width, height } = canvas;

        const img = new Image();
        img.src = watermarkSrc;

        img.onload = () => {
            const size = 300;

            const patternCanvas = document.createElement("canvas");
            patternCanvas.width = size;
            patternCanvas.height = size;
            const pctx = patternCanvas.getContext("2d");

            pctx.save();
            pctx.globalAlpha = 0.08;
            pctx.translate(size / 2, size / 2);
            pctx.rotate(Math.PI / 4);
            pctx.drawImage(img, -img.width / 2, -img.height / 2);
            pctx.restore();

            const pattern = ctx.createPattern(patternCanvas, "repeat");

            ctx.save();
            ctx.fillStyle = pattern;
            ctx.fillRect(0, 0, width, height);
            ctx.restore();

            resolve();
        };
    });
}