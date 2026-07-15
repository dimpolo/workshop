/* Watts <-> dBm converter. Direction toggles which field is the input vs. the readonly result. */

const inputField = document.getElementById('input-value');
const outputField = document.getElementById('output-value');
const inputLabel = document.getElementById('input-label');
const outputLabel = document.getElementById('output-label');
const statusLine = document.getElementById('status-line');
const swapButton = document.getElementById('swap-button');

let direction = 'w2d'; // 'w2d' = Watts -> dBm, 'd2w' = dBm -> Watts

function wattsToDbm(watts) {
  return 10 * Math.log10(watts * 1000);
}

function dbmToWatts(dbm) {
  return Math.pow(10, dbm / 10) / 1000;
}

function recompute() {
  const raw = inputField.value;

  if (raw === '') {
    outputField.value = '';
    statusLine.textContent = '';
    return;
  }

  const value = Number(raw);

  if (direction === 'w2d') {
    if (!(value > 0)) {
      outputField.value = '';
      statusLine.textContent = 'Watts must be a positive number.';
      return;
    }
    statusLine.textContent = '';
    outputField.value = wattsToDbm(value).toFixed(2);
  } else {
    statusLine.textContent = '';
    outputField.value = dbmToWatts(value).toFixed(2);
  }
}

function updateLabels() {
  if (direction === 'w2d') {
    inputLabel.textContent = 'Watts';
    outputLabel.textContent = 'dBm';
    inputField.placeholder = 'Enter watts';
  } else {
    inputLabel.textContent = 'dBm';
    outputLabel.textContent = 'Watts';
    inputField.placeholder = 'Enter dBm';
  }
}

inputField.addEventListener('input', recompute);

swapButton.addEventListener('click', () => {
  const carriedValue = outputField.value;

  direction = direction === 'w2d' ? 'd2w' : 'w2d';
  updateLabels();

  inputField.value = carriedValue;
  recompute();
});
