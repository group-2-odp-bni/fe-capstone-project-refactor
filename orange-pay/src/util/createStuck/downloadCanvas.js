
export function downloadCanvas(canvas, filename = "struk.png") {
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = filename;
  link.click();
}