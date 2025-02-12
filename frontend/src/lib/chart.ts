export type ViewBox = {
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export const getTooltipStyle = (width: number, viewBox: ViewBox, x: number) => {
  const top = viewBox.top;
  let left: string | number = "auto";
  let right: string | number = "auto";
  const sideOffset = 2 * 4; // px

  const isAtRightBoundary =
    x - viewBox.left > viewBox.width - (sideOffset + width);
  if (isAtRightBoundary) {
    right = Math.min(
      viewBox.left + viewBox.width + viewBox.right - width,
      viewBox.left + viewBox.width + viewBox.right - (x - sideOffset),
    );
  } else {
    left = Math.min(
      viewBox.left + viewBox.width + viewBox.right - width,
      x + sideOffset,
    );
  }

  return { width, top, left, right };
};
