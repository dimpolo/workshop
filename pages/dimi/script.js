(function () {
  "use strict";

  // Curated emoji palette: each entry pairs a glyph with a hand-assigned RGB
  // color representing how it reads visually at a glance. Used to find the
  // closest-matching emoji for each mosaic cell by Euclidean RGB distance.
  const PALETTE = [
    // Faces
    { e: "😀", c: [255, 204, 77] }, { e: "😆", c: [255, 214, 102] },
    { e: "😂", c: [255, 204, 77] }, { e: "🙂", c: [255, 204, 77] },
    { e: "😊", c: [255, 204, 77] }, { e: "😇", c: [255, 224, 153] },
    { e: "🥰", c: [255, 153, 172] }, { e: "😍", c: [255, 102, 140] },
    { e: "🤩", c: [255, 193, 7] }, { e: "😘", c: [255, 153, 172] },
    { e: "😋", c: [255, 180, 90] }, { e: "🤔", c: [200, 150, 90] },
    { e: "😐", c: [219, 187, 128] }, { e: "😴", c: [140, 170, 220] },
    { e: "🤢", c: [140, 180, 90] }, { e: "🥵", c: [235, 80, 60] },
    { e: "🥶", c: [110, 180, 225] }, { e: "😎", c: [60, 60, 70] },
    { e: "😳", c: [255, 170, 170] }, { e: "🥺", c: [255, 190, 150] },
    { e: "😢", c: [140, 170, 220] }, { e: "😭", c: [110, 150, 220] },
    { e: "😱", c: [220, 220, 225] }, { e: "😡", c: [220, 60, 50] },
    { e: "😈", c: [110, 70, 160] }, { e: "💀", c: [235, 235, 230] },
    { e: "👻", c: [245, 245, 245] }, { e: "👽", c: [110, 200, 110] },
    { e: "🤖", c: [160, 170, 180] }, { e: "🎃", c: [237, 110, 20] },

    // Hearts
    { e: "❤️", c: [237, 28, 36] }, { e: "🧡", c: [247, 140, 32] },
    { e: "💛", c: [255, 222, 0] }, { e: "💚", c: [0, 166, 81] },
    { e: "💙", c: [0, 120, 215] }, { e: "💜", c: [140, 80, 190] },
    { e: "🖤", c: [30, 30, 30] }, { e: "🤍", c: [245, 245, 245] },

    // Animals
    { e: "🐶", c: [180, 140, 100] }, { e: "🐱", c: [230, 190, 140] },
    { e: "🐭", c: [190, 190, 190] }, { e: "🐰", c: [240, 240, 240] },
    { e: "🦊", c: [220, 120, 50] }, { e: "🐻", c: [130, 90, 60] },
    { e: "🐼", c: [245, 245, 245] }, { e: "🐨", c: [160, 160, 160] },
    { e: "🐯", c: [230, 150, 40] }, { e: "🦁", c: [220, 160, 60] },
    { e: "🐮", c: [245, 245, 245] }, { e: "🐷", c: [255, 180, 190] },
    { e: "🐸", c: [110, 180, 90] }, { e: "🐵", c: [150, 110, 80] },
    { e: "🐔", c: [255, 255, 255] }, { e: "🐧", c: [30, 30, 40] },
    { e: "🐦", c: [110, 170, 220] }, { e: "🦆", c: [90, 150, 90] },
    { e: "🦉", c: [150, 110, 70] }, { e: "🐺", c: [130, 130, 140] },
    { e: "🐴", c: [170, 120, 80] }, { e: "🦄", c: [230, 200, 240] },
    { e: "🐝", c: [255, 204, 0] }, { e: "🦋", c: [90, 150, 220] },
    { e: "🐢", c: [110, 160, 90] }, { e: "🐍", c: [110, 160, 70] },
    { e: "🐙", c: [190, 80, 140] }, { e: "🦀", c: [230, 80, 60] },
    { e: "🐠", c: [255, 170, 60] }, { e: "🐬", c: [110, 170, 210] },
    { e: "🐳", c: [90, 140, 190] }, { e: "🦈", c: [140, 160, 175] },
    { e: "🐘", c: [160, 165, 170] }, { e: "🦒", c: [230, 190, 110] },
    { e: "🐿️", c: [180, 130, 80] },

    // Food
    { e: "🍎", c: [211, 47, 47] }, { e: "🍏", c: [140, 198, 62] },
    { e: "🍊", c: [255, 152, 0] }, { e: "🍋", c: [255, 235, 59] },
    { e: "🍌", c: [255, 224, 102] }, { e: "🍉", c: [230, 60, 80] },
    { e: "🍇", c: [130, 80, 160] }, { e: "🍓", c: [230, 40, 60] },
    { e: "🫐", c: [70, 90, 180] }, { e: "🍒", c: [200, 20, 50] },
    { e: "🍑", c: [255, 170, 150] }, { e: "🥭", c: [255, 170, 50] },
    { e: "🍍", c: [255, 210, 40] }, { e: "🥥", c: [140, 100, 70] },
    { e: "🥝", c: [140, 180, 60] }, { e: "🍅", c: [230, 60, 50] },
    { e: "🥑", c: [110, 160, 70] }, { e: "🥦", c: [70, 130, 60] },
    { e: "🥬", c: [110, 170, 90] }, { e: "🥒", c: [90, 150, 70] },
    { e: "🌶️", c: [200, 40, 40] }, { e: "🌽", c: [255, 214, 0] },
    { e: "🥕", c: [237, 124, 38] }, { e: "🧄", c: [240, 235, 220] },
    { e: "🧅", c: [220, 180, 150] }, { e: "🥔", c: [200, 160, 100] },
    { e: "🥐", c: [210, 150, 80] }, { e: "🍞", c: [220, 175, 110] },
    { e: "🧀", c: [255, 200, 60] }, { e: "🥚", c: [250, 240, 220] },
    { e: "🍳", c: [255, 220, 80] }, { e: "🥓", c: [200, 90, 80] },
    { e: "🍗", c: [200, 140, 70] }, { e: "🍔", c: [190, 130, 60] },
    { e: "🍟", c: [255, 200, 60] }, { e: "🍕", c: [230, 150, 60] },
    { e: "🌮", c: [220, 160, 60] }, { e: "🍣", c: [240, 240, 235] },
    { e: "🍦", c: [240, 220, 180] }, { e: "🍩", c: [200, 110, 70] },
    { e: "🍪", c: [180, 120, 70] }, { e: "🍫", c: [90, 50, 30] },
    { e: "🍿", c: [255, 235, 180] }, { e: "🎂", c: [255, 170, 190] },
    { e: "🍭", c: [230, 60, 90] },

    // Objects
    { e: "🔥", c: [255, 90, 20] }, { e: "💧", c: [70, 150, 230] },
    { e: "🌊", c: [30, 120, 180] }, { e: "⭐️", c: [255, 214, 0] },
    { e: "☀️", c: [255, 200, 30] }, { e: "🌙", c: [230, 220, 150] },
    { e: "☁️", c: [230, 230, 235] }, { e: "⚡️", c: [255, 224, 0] },
    { e: "❄️", c: [180, 220, 240] }, { e: "🌈", c: [180, 100, 200] },
    { e: "💎", c: [90, 190, 230] }, { e: "🔑", c: [230, 190, 60] },
    { e: "🚗", c: [200, 60, 60] }, { e: "🚀", c: [200, 200, 210] },
    { e: "✈️", c: [180, 190, 200] }, { e: "⛵️", c: [230, 230, 235] },
  ];

  const MAX_SOURCE_DIMENSION = 500; // downscale the upload before sampling, for performance
  const OUTPUT_CELL_SIZE = 24; // px per grid cell in the rendered mosaic
  const DEBOUNCE_MS = 120;

  const dropzone = document.getElementById("dropzone");
  const dropzoneText = document.getElementById("dropzoneText");
  const fileInput = document.getElementById("fileInput");
  const errorText = document.getElementById("errorText");
  const controls = document.getElementById("controls");
  const densitySlider = document.getElementById("density");
  const densityValue = document.getElementById("densityValue");
  const previewArea = document.getElementById("previewArea");
  const originalImage = document.getElementById("originalImage");
  const mosaicCanvas = document.getElementById("mosaicCanvas");
  const mosaicFrame = document.getElementById("mosaicFrame");
  const downloadBtn = document.getElementById("downloadBtn");
  const caveatNote = document.getElementById("caveatNote");
  const confettiLayer = document.getElementById("confettiLayer");

  const sourceCanvas = document.createElement("canvas");
  const sourceCtx = sourceCanvas.getContext("2d", { willReadFrequently: true });
  let sourceImageData = null;
  let debounceTimer = null;

  function spawnConfetti() {
    const pieceCount = 24;
    for (let i = 0; i < pieceCount; i++) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.textContent = PALETTE[Math.floor(Math.random() * PALETTE.length)].e;
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.fontSize = `${1 + Math.random() * 0.75}rem`;
      piece.style.animationDelay = `${Math.random() * 0.3}s`;
      piece.style.animationDuration = `${0.9 + Math.random() * 0.6}s`;
      piece.addEventListener("animationend", () => piece.remove());
      confettiLayer.appendChild(piece);
    }
  }

  function celebrateReveal() {
    mosaicFrame.classList.remove("pop-in");
    // Force reflow so the animation restarts if the class is re-added later.
    void mosaicFrame.offsetWidth;
    mosaicFrame.classList.add("pop-in");
    spawnConfetti();
  }

  function showError(message) {
    errorText.textContent = message;
    errorText.hidden = false;
  }

  function clearError() {
    errorText.hidden = true;
    errorText.textContent = "";
  }

  function openFilePicker() {
    fileInput.click();
  }

  dropzone.addEventListener("click", openFilePicker);
  dropzone.addEventListener("keydown", (evt) => {
    if (evt.key === "Enter" || evt.key === " ") {
      evt.preventDefault();
      openFilePicker();
    }
  });

  dropzone.addEventListener("dragover", (evt) => {
    evt.preventDefault();
    dropzone.classList.add("dragover");
  });
  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
  });
  dropzone.addEventListener("drop", (evt) => {
    evt.preventDefault();
    dropzone.classList.remove("dragover");
    const file = evt.dataTransfer.files && evt.dataTransfer.files[0];
    handleFile(file);
  });

  fileInput.addEventListener("change", () => {
    handleFile(fileInput.files && fileInput.files[0]);
    fileInput.value = "";
  });

  function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showError("That doesn't look like an image file — please choose a photo (JPG, PNG, etc.).");
      return;
    }
    clearError();

    const reader = new FileReader();
    reader.onload = () => {
      originalImage.onload = () => {
        prepareSourceCanvas(originalImage);
        dropzoneText.textContent = "Click or drop another photo to replace this one";
        previewArea.hidden = false;
        controls.hidden = false;
        downloadBtn.hidden = false;
        caveatNote.hidden = false;
        renderMosaic();
        celebrateReveal();
      };
      originalImage.src = reader.result;
    };
    reader.onerror = () => {
      showError("Couldn't read that file — please try a different image.");
    };
    reader.readAsDataURL(file);
  }

  function prepareSourceCanvas(img) {
    const scale = Math.min(1, MAX_SOURCE_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    sourceCanvas.width = w;
    sourceCanvas.height = h;
    sourceCtx.drawImage(img, 0, 0, w, h);
    sourceImageData = sourceCtx.getImageData(0, 0, w, h);
  }

  function nearestEmoji(r, g, b) {
    let best = PALETTE[0];
    let bestDist = Infinity;
    for (const entry of PALETTE) {
      const dr = r - entry.c[0];
      const dg = g - entry.c[1];
      const db = b - entry.c[2];
      const dist = dr * dr + dg * dg + db * db;
      if (dist < bestDist) {
        bestDist = dist;
        best = entry;
      }
    }
    return best.e;
  }

  function renderMosaic() {
    if (!sourceImageData) return;

    const columns = parseInt(densitySlider.value, 10);
    const sw = sourceImageData.width;
    const sh = sourceImageData.height;
    const data = sourceImageData.data;
    const rows = Math.max(1, Math.round(columns * (sh / sw)));

    const cellW = sw / columns;
    const cellH = sh / rows;

    mosaicCanvas.width = columns * OUTPUT_CELL_SIZE;
    mosaicCanvas.height = rows * OUTPUT_CELL_SIZE;
    const ctx = mosaicCanvas.getContext("2d");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${OUTPUT_CELL_SIZE * 0.9}px sans-serif`;
    ctx.clearRect(0, 0, mosaicCanvas.width, mosaicCanvas.height);

    for (let row = 0; row < rows; row++) {
      const y0 = Math.floor(row * cellH);
      const y1 = Math.max(y0 + 1, Math.floor((row + 1) * cellH));
      for (let col = 0; col < columns; col++) {
        const x0 = Math.floor(col * cellW);
        const x1 = Math.max(x0 + 1, Math.floor((col + 1) * cellW));

        let rSum = 0, gSum = 0, bSum = 0, count = 0;
        for (let y = y0; y < y1; y++) {
          let idx = (y * sw + x0) * 4;
          for (let x = x0; x < x1; x++) {
            rSum += data[idx];
            gSum += data[idx + 1];
            bSum += data[idx + 2];
            count++;
            idx += 4;
          }
        }

        const emoji = nearestEmoji(rSum / count, gSum / count, bSum / count);
        const cx = col * OUTPUT_CELL_SIZE + OUTPUT_CELL_SIZE / 2;
        const cy = row * OUTPUT_CELL_SIZE + OUTPUT_CELL_SIZE / 2;
        ctx.fillText(emoji, cx, cy);
      }
    }
  }

  densitySlider.addEventListener("input", () => {
    densityValue.textContent = densitySlider.value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(renderMosaic, DEBOUNCE_MS);
  });

  downloadBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "emoji-mosaic.png";
    link.href = mosaicCanvas.toDataURL("image/png");
    link.click();
  });
})();
