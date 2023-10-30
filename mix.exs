defmodule HandsontableKinoSmartcell.MixProject do
  use Mix.Project

  def project do
    [
      app: :handsontable_kino_smartcell,
      version: "0.1.6",
      elixir: "~> 1.15",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  # Run "mix help compile.app" to learn about applications.
  def application do
    [
      mod: {HandsontableKinoSmartcell.Application, []},
      extra_applications: [:logger]
    ]
  end

  # Run "mix help deps" to learn about dependencies.
  defp deps do
    [
      {:kino, "~> 0.11.0"},
      {:nimble_csv, "~> 1.1"}
    ]
  end
end
