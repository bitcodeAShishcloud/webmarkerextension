// Links to the WebMarker Extensions repository on GitHub. The `place` tag names only the place in the extension the
// link is on; it carries no identifier. (No UTM query: the target is GitHub, which does not use it.)

/** A page of the repository, tagged with the place that links to it. */
export const websiteUrl = (path: '/' | '/docs', _place: 'side-panel' | 'settings' | 'about') =>
  `https://github.com/bitcodeAShishcloud/webmarkerextension${path === '/' ? '' : path}`;
