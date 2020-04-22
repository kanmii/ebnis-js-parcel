/* istanbul ignore file */
export function windowReplaceUrl(url: string) {
  window.location.replace(url);
}

export function setUpRoutePage(args: SetUpRoutePageArgs) {
  const {
    title, //
    rootClassName,
  } = args;

  if (title) {
    document.title = title + " - Ebnis";
  }

  if (rootClassName) {
    const el = document.getElementById("root") as HTMLElement;
    el.classList.add(rootClassName);
  }
}

interface SetUpRoutePageArgs {
  title?: string;
  rootClassName?: string;
}
