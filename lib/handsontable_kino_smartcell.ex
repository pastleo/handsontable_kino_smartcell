defmodule HandsontableKinoSmartcell do
  use Kino.JS, assets_path: "lib/assets/handsontable_kino_smartcell"
  use Kino.JS.Live
  use Kino.SmartCell, name: "Handsontable"

  require Logger

  @init_data_size 10

  @impl true
  def init(%{"file" => file} = attrs, ctx) when is_binary(file) and byte_size(file) > 0 do
    try do
      File.stream!(file)
      |> NimbleCSV.RFC4180.parse_stream(skip_headers: false)
      |> Enum.to_list()
      |> init_with(attrs, ctx)
    rescue
      err ->
        Logger.warning(err)
        init(Map.delete(attrs, "file"), ctx)
    end
  end

  def init(attrs, ctx) do
    init_with(attrs["data"], attrs, ctx)
  end

  defp init_with(data, attrs, ctx) do
    variable = Kino.SmartCell.prefixed_var_name("data", attrs["variable"])

    {
      :ok,
      assign(
        ctx,
        data: data || init_data(@init_data_size, @init_data_size),
        variable: variable,
        file: attrs["file"],
        config: attrs["config"] || %{},
        license_key: Application.get_env(:handsontable, :license_key)
      ),
      editor: [
        attribute: "elixir",
        language: "elixir",
        default_source: "IO.inspect(#{variable})\n:ok"
      ]
    }
  end

  @impl true
  def handle_connect(ctx) do
    {:ok,
     %{
       file: ctx.assigns.file,
       data: ctx.assigns.data,
       variable: ctx.assigns.variable,
       config: ctx.assigns.config,
       license_key: ctx.assigns.license_key
     }, ctx}
  end

  @impl true
  def handle_event("update_data", data, ctx) do
    broadcast_event(ctx, "update_data", data)
    {:noreply, assign(ctx, data: data)}
  end

  def handle_event("update_file", file, ctx) do
    broadcast_event(ctx, "update_file", file)
    {:noreply, assign(ctx, file: file)}
  end

  def handle_event("update_variable", variable, ctx) do
    broadcast_event(ctx, "update_variable", variable)
    {:noreply, assign(ctx, variable: variable)}
  end

  def handle_event("update_config", config, ctx) do
    broadcast_event(ctx, "update_config", config)
    {:noreply, assign(ctx, config: config)}
  end

  @impl true
  def to_attrs(%{assigns: %{file: file} = assigns} = ctx)
      when is_binary(file) and byte_size(file) > 0 do
    try do
      File.write(
        assigns.file,
        NimbleCSV.RFC4180.dump_to_iodata(assigns.data)
      )

      %{
        "variable" => assigns.variable,
        "file" => assigns.file,
        "config" => assigns.config
      }
    rescue
      err ->
        Logger.warning(err)
        to_attrs(put_in(ctx, [:assigns, :file], nil))
    end
  end

  def to_attrs(ctx) do
    %{
      "data" => ctx.assigns.data,
      "variable" => ctx.assigns.variable,
      "config" => ctx.assigns.config
    }
  end

  @impl true
  def to_source(%{"file" => file, "elixir" => elixir} = attrs)
      when is_binary(file) and byte_size(file) > 0 do
    quote do
      try do
        File.stream!(unquote(file))
        |> NimbleCSV.RFC4180.parse_stream(skip_headers: false)
        |> Enum.to_list()
      rescue
        err ->
          Logger.warning(err)
          nil
      end
    end
    |> to_source_variable(attrs)
    |> Kino.SmartCell.quoted_to_string()
    |> (&(&1 <> "\n" <> elixir)).()
  end

  def to_source(%{"data" => data, "elixir" => elixir} = attrs) do
    to_source_variable(data, attrs)
    |> Kino.SmartCell.quoted_to_string()
    |> (&(&1 <> "\n" <> elixir)).()
  end

  defp init_data(rows, columns) do
    Enum.map(1..rows, fn _x -> Enum.map(1..columns, fn _x -> "" end) end)
  end

  defp to_source_variable(data, %{"variable" => variable})
       when is_binary(variable) and byte_size(variable) > 0 do
    quote do
      unquote(quoted_var(variable)) = unquote(data)
    end
  end

  defp to_source_variable(data, _attrs), do: data

  defp quoted_var(string), do: {String.to_atom(string), [], nil}
end
