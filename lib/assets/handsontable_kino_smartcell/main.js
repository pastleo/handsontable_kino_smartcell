const DEFAULT_CONFIG = {
  licenseKey: "non-commercial-and-evaluation",
  height: 250,
  fixedRowsTop: 0,
  fixedColumnsLeft: 0,
}
export async function init(ctx, payload) {
  ctx.importCSS("main.css");
  ctx.importCSS("https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.css");
  await import("https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.js");

  ctx.root.innerHTML = `
    <div id="handsontable"></div>

    <div class="controls">
      <div class="controls-row">
        <div class="control-field primary">
          <label>Assign to</label>
          <input id="variable" type="text" name="variable" />
        </div>
        <div class="control-field primary">
          <label>Write CSV file to</label>
          <input id="file" type="text" name="file" />
        </div>
      </div>
      <div class="controls-row">
        <div class="control-field">
          <label for="height">
            Height:
            <input type="number" id="height" name="height" class="short-number" />
          </label>
          <label for="fix-top-rows">
            Fix Top Rows:
            <input type="number" id="fix-top-rows" name="fix-top-rows" class="short-number" />
          </label>
          <label for="fix-left-columns">
            Fix Left Columns:
            <input type="number" id="fix-left-columns" name="fix-left-columns" class="short-number" />
          </label>
          <label for="license-key">
            License Key:
            <input type="text" id="license-key" name="license-key" />
          </label>
        </div>
      </div>
    </div>
  `;

  const container = document.getElementById('handsontable');
  const variableInput = document.getElementById('variable');
  const fileInput = document.getElementById('file');

  const heightInput = document.getElementById('height');
  const fixTopRowsInput = document.getElementById('fix-top-rows');
  const fixLeftColumnsInput = document.getElementById('fix-left-columns');
  const licenseKeyInput = document.getElementById('license-key');

  const hot = new Handsontable(container, {
    data: payload.data,
    width: '100%',
    rowHeaders: true,
    colHeaders: true,
    contextMenu: true,
    undo: true,
    ...DEFAULT_CONFIG,
  });

  let pushingDataUpdates = 0, loadingUpdatedData = 0;
  hot.addHook('afterChange', (changes) => {
    if (loadingUpdatedData >= 1) {
      loadingUpdatedData -= 1;
      return;
    }
    pushingDataUpdates += 1;
    const data = hot.getData();
    ctx.pushEvent("update_data", data);
  })
  ctx.handleEvent("update_data", (data) => {
    if (pushingDataUpdates >= 1) {
      pushingDataUpdates -= 1;
      return;
    }
    loadingUpdatedData += 1;
    hot.loadData(data);
  });

  variableInput.value = payload.variable;
  variableInput.addEventListener("change", (event) => {
    ctx.pushEvent("update_variable", event.target.value);
  });
  ctx.handleEvent("update_variable", (variable) => {
    variableInput.value = variable;
  });

  fileInput.value = payload.file;
  fileInput.addEventListener("change", (event) => {
    ctx.pushEvent("update_file", event.target.value);
  });
  ctx.handleEvent("update_file", (file) => {
    fileInput.value = file;
  });

  let config = {
    ...DEFAULT_CONFIG,
    ...payload.config,
  };
  function updateConfig(newConfig, pushEvent) {
    config = {
      ...config,
      ...newConfig,
    }
    heightInput.value = config.height;
    fixTopRowsInput.value = config.fixedRowsTop;
    fixLeftColumnsInput.value = config.fixedColumnsLeft;
    licenseKeyInput.value = config.licenseKey;
    hot.updateSettings(config);
    hot.render();
    if (pushEvent) {
      ctx.pushEvent("update_config", config);
    }
  }
  updateConfig();
  fixTopRowsInput.addEventListener("change", (event) => {
    updateConfig({
      fixedRowsTop: parseInt(event.target.value),
    }, true);
  });
  fixLeftColumnsInput.addEventListener("change", (event) => {
    updateConfig({
      fixedColumnsLeft: parseInt(event.target.value),
    }, true);
  });
  heightInput.addEventListener("change", (event) => {
    updateConfig({
      height: parseInt(event.target.value),
    }, true);
  });
  licenseKeyInput.addEventListener("change", (event) => {
    updateConfig({
      licenseKey: event.target.value,
    }, true);
  });
  ctx.handleEvent("update_config", (config) => {
    updateConfig(config);
  });
}