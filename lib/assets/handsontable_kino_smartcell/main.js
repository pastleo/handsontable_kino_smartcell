const DEFAULT_CONFIG = {
  height: 250,
  fixedRowsTop: 0,
  fixedColumnsLeft: 0,
}
export async function init(ctx, payload) {
  ctx.importCSS("main.css");
  ctx.importCSS("https://cdn.jsdelivr.net/npm/handsontable@16.2.0/styles/handsontable.min.css");
  ctx.importCSS(payload.theme_css);
  await import("https://cdn.jsdelivr.net/npm/handsontable@16.2.0/dist/handsontable.full.min.js");

  ctx.root.innerHTML = `
    <div id="handsontable"></div>

    <div class="controls">
      <div class="controls-row">
        <div class="control-field primary">
          <label>Assign to</label>
          <input id="variable" type="text" name="variable" />
        </div>
        <div class="control-field primary">
          <label>CSV file path</label>
          <div class="input-group">
            <input id="file" type="text" name="file" />
            <button id="read-btn" class="btn-primary">Read</button>
            <button id="save-btn" class="btn-primary">Save</button>
          </div>
        </div>
      </div>
      <div id="error-message-container" class="error-message"></div>
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
  const errorMessageContainer = document.getElementById('error-message-container');
  const readBtn = document.getElementById('read-btn');
  const saveBtn = document.getElementById('save-btn');

  const hot = new Handsontable(container, {
    data: payload.data,
    width: '100%',
    rowHeaders: true,
    colHeaders: true,
    contextMenu: true,
    undo: true,
    ...DEFAULT_CONFIG,
    licenseKey: payload.license_key,
    themeName: payload.theme,
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

  readBtn.addEventListener("click", () => {
    errorMessageContainer.textContent = ""; // Clear previous errors
    errorMessageContainer.classList.remove('shown');
    if (fileInput.value) {
      ctx.pushEvent("read_file", {});
    }
  });

  saveBtn.addEventListener("click", () => {
    errorMessageContainer.textContent = ""; // Clear previous errors
    errorMessageContainer.classList.remove('shown');
    if (fileInput.value) {
      console.log(fileInput.value, hot.getData())
      ctx.pushEvent("save_file", hot.getData());
    }
  });

  ctx.handleEvent("save_success", () => {
    const originalText = "Save"; // Assuming "Save" is the default text
    saveBtn.textContent = "OK";
    saveBtn.disabled = true;
    saveBtn.classList.remove("error");
    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    }, 3000);
  });

  ctx.handleEvent("save_error", (payload) => {
    const originalText = "Save"; // Assuming "Save" is the default text
    saveBtn.textContent = "Error";
    saveBtn.disabled = true;
    saveBtn.classList.add("error");
    errorMessageContainer.textContent = `Error: ${payload.message}`; // Display error message
    errorMessageContainer.classList.add('shown')
    console.error("Save failed:", payload.message);
    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
      saveBtn.classList.remove("error");
      errorMessageContainer.textContent = ""; // Clear error message after timeout
      errorMessageContainer.classList.remove('shown')
    }, 5000);
  });

  ctx.handleEvent("read_success", (payload) => {
    const originalText = "Read";
    readBtn.textContent = "OK";
    readBtn.disabled = true;
    readBtn.classList.remove("error");
    errorMessageContainer.textContent = ""; // Clear any previous errors
    errorMessageContainer.classList.remove('shown');
    hot.loadData(payload.data); // Load the data read from the file
    setTimeout(() => {
      readBtn.textContent = originalText;
      readBtn.disabled = false;
    }, 3000);
  });

  ctx.handleEvent("read_error", (payload) => {
    const originalText = "Read";
    readBtn.textContent = "Error";
    readBtn.disabled = true;
    readBtn.classList.add("error");
    errorMessageContainer.textContent = `Error: ${payload.message}`; // Display error message
    errorMessageContainer.classList.add('shown');
    console.error("Read failed:", payload.message);
    setTimeout(() => {
      readBtn.textContent = originalText;
      readBtn.disabled = false;
      readBtn.classList.remove("error");
      errorMessageContainer.textContent = ""; // Clear error message after timeout
      errorMessageContainer.classList.remove('shown');
    }, 5000);
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
  ctx.handleEvent("update_config", (config) => {
    updateConfig(config);
  });
}
