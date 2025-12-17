# Handsontable Kino Smartcell

use [Handsontable](https://handsontable.com/) to edit/enter data in [livebook](https://livebook.dev/) like excel/spreadsheet, created with livebook's [smart cell](https://hexdocs.pm/kino/Kino.SmartCell.html)

![demo](docs/demo.png)

## Installation

Add these lines to `Notebook dependencies and setup` to install package and set config

```elixir
Application.put_all_env(
  handsontable: [
    license_key: "non-commercial-and-evaluation",
    working_dir: __DIR__,
    # theme: "ht-theme-classic",
    # theme_css: "https://cdn.jsdelivr.net/npm/handsontable@16.2.0/styles/ht-theme-classic.min.css",
  ]
)

Mix.install([
  {:handsontable_kino_smartcell, git: "https://github.com/pastleo/handsontable_kino_smartcell.git", tag: "0.1.9"},
])
```

> about [Handsontable license key](https://handsontable.com/docs/javascript-data-grid/license-key/)
> about [theme](https://handsontable.com/docs/javascript-data-grid/themes/)

then you can add `Handsontable` in `+ Smart` list:

![adding](docs/adding.png)

Documentation can be generated with [ExDoc](https://github.com/elixir-lang/ex_doc)
and published on [HexDocs](https://hexdocs.pm). Once published, the docs can
be found at <https://hexdocs.pm/handsontable_kino_smartcell>.

