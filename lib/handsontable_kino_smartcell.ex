defmodule HandsontableKinoSmartcell do
  use Kino.JS, assets_path: "lib/assets/handsontable_kino_smartcell"
  use Kino.JS.Live
  use Kino.SmartCell, name: "Handsontable"

  require Logger

  @init_data_size 10

  @impl true
  def init(%{"file" => file} = attrs, ctx) when is_binary(file) and byte_size(file) > 0 do
    try do
      data =
        File.stream!(file)
        |> NimbleCSV.RFC4180.parse_stream(skip_headers: false)
        |> Enum.to_list()

      Map.delete(attrs, "file")
      |> Map.put("data", data)
      |> init(ctx)
    rescue
      err ->
        Logger.warning(err)
        init(Map.delete(attrs, "file"), ctx)
    end
  end

  def init(attrs, ctx) do
    data = attrs["data"] || init_data(@init_data_size, @init_data_size)
    variable = Kino.SmartCell.prefixed_var_name("data", attrs["variable"])
    file = attrs["file"]
    config = attrs["config"] || %{}

    {
      :ok,
      assign(
        ctx,
        data: data,
        variable: variable,
        file: file,
        config: config
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
       config: ctx.assigns.config
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
      NimbleCSV.RFC4180.dump_to_stream(assigns.data)
      |> Stream.into(File.stream!(assigns.file, [:write, :utf8]))
      |> Stream.run()

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

  def to_source(%{"variable" => variable, "data" => data, "elixir" => elixir} = attrs) do
    quote do
      unquote(quoted_var(variable)) = unquote(data)
    end
    |> to_source_variable(attrs)
    |> Kino.SmartCell.quoted_to_string()
    |> (&(&1 <> "\n" <> elixir)).()
  end

  defp to_source_variable(data, %{"variable" => variable})
       when is_binary(variable) and byte_size(variable) > 0 do
    quote do
      unquote(quoted_var(variable)) = unquote(data)
    end
  end

  defp to_source_variable(_attrs, data), do: data

  defp init_data(rows, columns) do
    Enum.map(1..rows, fn _x -> Enum.map(1..columns, fn _x -> nil end) end)
  end

  defp quoted_var(nil), do: nil
  defp quoted_var(string), do: {String.to_atom(string), [], nil}
end
