# VisualPDE

## Interactive solutions of partial differential equations, live on your device.

VisualPDE is a browser-based simulator of a broad range of [partial differential equations](https://en.wikipedia.org/wiki/Partial_differential_equation), with solve-as-you-type speed and no knowledge of numerical methods required.

The site, hosted at [VisualPDE.com](https://visualpde.com), contains a range of educational and scientific material, including a collection of Visual Stories written with the layperson in mind.

For more information on the technology and philosophy behind VisualPDE, check out our [open-access publication](https://doi.org/10.1007/s11538-023-01218-4).

## Hosting a local copy

VisualPDE is updated regularly, so using [VisualPDE.com](https://visualpde.com) is recommended for most users. However, you may wish to host your own local copy of the VisualPDE site to guarantee stability or privacy. Local versions of VisualPDE automatically have analytics disabled and are entirely self-contained.

### Best hosting

The best, most customisable way to do this is via [Jekyll](https://jekyllrb.com), which requires a [Ruby](https://www.ruby-lang.org/) installation (version 3.1.x is required; newer versions are not compatible with Jekyll).

For instance, on macOS with Homebrew installed, the following will install and configure Ruby and Jekyll:

```
brew install ruby@3.1
gem install bundler jekyll
bundle install
```

To build and serve the site locally, download the entire VisualPDE source from this repo and navigate to it in your terminal. Hosting the site at `http://localhost:4000` is then as simple as running

```
bundle exec jekyll serve
```

You can then customise your local version of VisualPDE by editing any of the various Markdown files used to build the site.

### Simple hosting

A simpler but less flexible method of hosting your own version of the site is to [download](https://benjaminwalker.info/visual-pde.zip) an archived version of the built site.

This can then be served with any local webserver. For instance, with Python3 installed you can simply run

```
cd path/to/visual-pde
python3 -m http.server
```

## Having trouble?

VisualPDE has extensive documentation, so we recommend trying out any suggestions found on the main site. For anything else, please get in touch with us on [hello@visualpde.com](mailto:hello@visualpde.com) or raise an issue on GitHub.
