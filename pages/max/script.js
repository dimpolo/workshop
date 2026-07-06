// Staircase calculator: computes steps, run, angle and a Blondel's-formula
// compliance check from total height, riser height and tread depth, and
// renders a to-scale SVG side-profile diagram. Everything updates live on
// every input change - there is no submit button.

const totalHeightInput = document.getElementById("total-height");
const riserHeightInput = document.getElementById("riser-height");
const treadDepthInput = document.getElementById("tread-depth");

const stepsOut = document.getElementById("result-steps");
const coveredOut = document.getElementById("result-covered");
const shortfallOut = document.getElementById("result-shortfall");
const runOut = document.getElementById("result-run");
const angleOut = document.getElementById("result-angle");
const warningsOut = document.getElementById("warnings");
const diagram = document.getElementById("diagram");

const RISER_RANGE = [15, 20];
const TREAD_RANGE = [24, 32];
const BLONDEL_RANGE = [59, 65];

function fmt(n) {
  return Math.round(n * 10) / 10;
}

function update() {
  const totalHeight = totalHeightInput.valueAsNumber;
  const riserHeight = riserHeightInput.valueAsNumber;
  const treadDepth = treadDepthInput.valueAsNumber;

  const valid =
    Number.isFinite(totalHeight) && totalHeight > 0 &&
    Number.isFinite(riserHeight) && riserHeight > 0 &&
    Number.isFinite(treadDepth) && treadDepth > 0;

  if (!valid) {
    for (const el of [stepsOut, coveredOut, shortfallOut, runOut, angleOut]) {
      el.textContent = "-";
    }
    warningsOut.textContent = "";
    diagram.innerHTML = "";
    return;
  }

  const steps = Math.floor(totalHeight / riserHeight);
  const covered = steps * riserHeight;
  const shortfall = totalHeight - covered;
  const totalRun = Math.max(steps - 1, 0) * treadDepth;
  const angleDeg = Math.atan(riserHeight / treadDepth) * (180 / Math.PI);

  stepsOut.textContent = String(steps);
  coveredOut.textContent = `${fmt(covered)} cm`;
  shortfallOut.textContent = `${fmt(shortfall)} cm`;
  runOut.textContent = `${fmt(totalRun)} cm`;
  angleOut.textContent = `${fmt(angleDeg)}°`;

  const warnings = [];
  const blondel = 2 * riserHeight + treadDepth;
  if (blondel < BLONDEL_RANGE[0] || blondel > BLONDEL_RANGE[1]) {
    warnings.push(
      `Blondel's formula (2×riser + tread = ${fmt(blondel)} cm) is outside the comfortable ${BLONDEL_RANGE[0]}-${BLONDEL_RANGE[1]} cm range.`
    );
  }
  if (riserHeight < RISER_RANGE[0] || riserHeight > RISER_RANGE[1]) {
    warnings.push(`Riser height is outside the typical ${RISER_RANGE[0]}-${RISER_RANGE[1]} cm range.`);
  }
  if (treadDepth < TREAD_RANGE[0] || treadDepth > TREAD_RANGE[1]) {
    warnings.push(`Tread depth is outside the typical ${TREAD_RANGE[0]}-${TREAD_RANGE[1]} cm range.`);
  }
  warningsOut.textContent = warnings.join("\n");

  drawDiagram(steps, riserHeight, treadDepth, covered, totalRun);
}

function drawDiagram(steps, riserHeight, treadDepth, covered, totalRun) {
  const vbWidth = 400;
  const vbHeight = 300;
  const padding = 20;
  const availableWidth = vbWidth - padding * 2;
  const availableHeight = vbHeight - padding * 2;

  const drawWidth = Math.max(totalRun, treadDepth);
  const drawHeight = covered;
  const scale = Math.min(availableWidth / drawWidth, availableHeight / drawHeight);

  const originX = padding;
  const baseY = vbHeight - padding;

  let x = originX;
  let y = baseY;
  const points = [`${x},${y}`];

  for (let i = 0; i < steps; i++) {
    y -= riserHeight * scale;
    points.push(`${x},${y}`);
    if (i < steps - 1) {
      x += treadDepth * scale;
      points.push(`${x},${y}`);
    }
  }

  const landingWidth = treadDepth * scale;
  const landingEndX = x + landingWidth;

  const svgNs = "http://www.w3.org/2000/svg";
  diagram.innerHTML = "";

  const floor = document.createElementNS(svgNs, "line");
  floor.setAttribute("x1", originX);
  floor.setAttribute("y1", baseY);
  floor.setAttribute("x2", landingEndX);
  floor.setAttribute("y2", baseY);
  floor.setAttribute("stroke", "#999");
  floor.setAttribute("stroke-dasharray", "4 2");
  diagram.appendChild(floor);

  const landing = document.createElementNS(svgNs, "line");
  landing.setAttribute("x1", x);
  landing.setAttribute("y1", y);
  landing.setAttribute("x2", landingEndX);
  landing.setAttribute("y2", y);
  landing.setAttribute("stroke", "#999");
  landing.setAttribute("stroke-dasharray", "4 2");
  diagram.appendChild(landing);

  const stairs = document.createElementNS(svgNs, "polyline");
  stairs.setAttribute("points", points.join(" "));
  stairs.setAttribute("fill", "none");
  stairs.setAttribute("stroke", "#6a2be2");
  stairs.setAttribute("stroke-width", "3");
  stairs.setAttribute("stroke-linejoin", "round");
  diagram.appendChild(stairs);
}

[totalHeightInput, riserHeightInput, treadDepthInput].forEach((input) => {
  input.addEventListener("input", update);
});

update();
