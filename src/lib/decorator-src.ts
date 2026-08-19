export type PopupDecorator = {
  id: string;
  label: string;
  src: string;
};

export function decoratorSrc(slug: string, file: string): string {
  return `/popups/${slug}/decorators/${file}`;
}

export function decoratorLabel(file: string): string {
  return file.replace(/\.[^.]+$/, "").replace(/-/g, " ");
}
