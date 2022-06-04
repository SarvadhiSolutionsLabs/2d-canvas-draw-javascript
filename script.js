var canvasWidth = 0;
var canvasHeight = 0;
var ctx = null;
var gridSquareSize = 50;
var polygonStartPoint = {
  x: null,
  y: null,
};
var polygonLines = [];
var polygonPoints = [];

var isMouseEventEnabled = true;
var redoLines = [];
// Colors
var gridLineColor = "#D0DBEA";
var polygonLineColor = "#000000";
var polygonFillColor = "#42DA9A80";
var polygonDashedLineColor = "#4f7ef799";
var confirmPointFillColor = "#4F7EF7";
var confirmPointTextColor = "#FFFFFF";
var hoveredPointFillColor = "#4f7ef799";

function init() {
  var canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvasWidth = canvas.width;
  canvasHeight = canvas.height;
  drawGrid();
  canvas.onmousemove = onMouseMove;
  canvas.onclick = onMouseClick;
  canvas.oncontextmenu = onMouseRClick;
}

function drawGrid() {
  ctx.strokeStyle = gridLineColor;
  for (x = 0; x <= canvasWidth; x += gridSquareSize) {
    drawLine(x, 0, x, canvasHeight);
  }
  for (y = 0; y <= canvasHeight; y += gridSquareSize) {
    drawLine(0, y, canvasWidth, y);
  }
  ctx.strokeStyle = polygonLineColor;
  polygonLines.forEach(function (element) {
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    drawLine(element.fromX, element.fromY, element.toX, element.toY);
  });
  if (polygonLines.length > 0) {
    polygonPoints = polygonLines.map((line) => ({
      x: line.fromX,
      y: line.fromY,
    }));
    var lastPoint = {
      x: polygonLines[polygonLines.length - 1].toX,
      y: polygonLines[polygonLines.length - 1].toY,
    };
    polygonPoints.push(lastPoint);
  } else {
    polygonPoints = [];
  }
  if (polygonLines.length === 0 && polygonStartPoint.x != null) {
    drawPoint(polygonStartPoint.x, polygonStartPoint.y, true);
  }
  if (polygonPoints.length > 1) {
    var firstPoint = polygonPoints[0],
      lastPoint = polygonPoints[polygonPoints.length - 1];
    if (JSON.stringify(firstPoint) !== JSON.stringify(lastPoint)) {
      firstPoint && drawPoint(firstPoint.x, firstPoint.y, true);
      lastPoint && drawPoint(lastPoint.x, lastPoint.y, true);
      isMouseEventEnabled = true;
    } else {
      isMouseEventEnabled = false;
    }
    fillPolygon(polygonPoints, polygonFillColor);
  }
  handleActionBtnValidation();
}

function drawLine(aFromX, aFromY, aToX, aToY, lineType) {
  var pattern = [];
  if (lineType === "dashed") {
    pattern = [10, 10];
    ctx.strokeStyle = polygonDashedLineColor;
  }
  ctx.beginPath();
  ctx.setLineDash(pattern);
  ctx.moveTo(aFromX, aFromY);
  ctx.lineTo(aToX, aToY);
  ctx.stroke();
}

function drawPoint(x, y, isHoveredPoint) {
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, 2 * Math.PI, false);
  ctx.fillStyle = isHoveredPoint
    ? confirmPointFillColor
    : hoveredPointFillColor;
  ctx.fill();
  ctx.beginPath();
  ctx.font = "40px Georgia";
  ctx.fillStyle = confirmPointTextColor;
  ctx.fillText("+", x - 12, y + 12);
  ctx.fill();
}

function onMouseMove(event) {
  if (isMouseEventEnabled) {
    var x = Math.round(event.clientX / gridSquareSize) * gridSquareSize;
    var y = Math.round(event.clientY / gridSquareSize) * gridSquareSize;
    init();
    drawPoint(x, y);
    //draw next assumed line on mouse move
    ctx.globalCompositeOperation = "destination-over";
    if (polygonPoints.length > 0 || polygonStartPoint.x !== null) {
      var lastPoint =
        polygonPoints.length > 0
          ? polygonPoints[polygonPoints.length - 1]
          : polygonStartPoint;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      drawLine(lastPoint.x, lastPoint.y, x, y, "dashed");
    }
  }
}

function onMouseClick(event) {
  if (isMouseEventEnabled) {
    var x = Math.round(event.clientX / gridSquareSize) * gridSquareSize;
    var y = Math.round(event.clientY / gridSquareSize) * gridSquareSize;
    if (polygonStartPoint.x == null) {
      polygonStartPoint.x = x;
      polygonStartPoint.y = y;
      polygonPoints.push({
        x: polygonStartPoint.x,
        y: polygonStartPoint.y,
      });
      handleActionBtnValidation();
    } else {
      if (!(polygonStartPoint.x === x && polygonStartPoint.y === y)) {
        polygonLines.push({
          fromX: polygonStartPoint.x,
          fromY: polygonStartPoint.y,
          toX: x,
          toY: y,
        });
        polygonStartPoint.x = x;
        polygonStartPoint.y = y;
      }
    }
    redoLines = [];
    init();
  }
}

function onMouseRClick(event) {
  polygonStartPoint.x = null;
  polygonStartPoint.y = null;
  init();
  return false;
}

window.onresize = function (event) {
  init();
};

window.onload = function (event) {
  init();
};

function fillPolygon(points, color) {
  if (points.length > 0) {
    ctx.fillStyle = color; // all css colors are accepted by this property
    var point = points[0];
    ctx.beginPath();
    ctx.moveTo(point.x, point.y); // point 1
    for (var i = 1; i < points.length; ++i) {
      point = points[i];
      ctx.globalCompositeOperation = "destination-over";
      ctx.lineTo(point.x, point.y);
    }
    ctx.closePath(); // go back to point 1
    ctx.fill();
  }
}

function handleUndo() {
  if (polygonLines.length > 0) {
    var undoElement = polygonLines.pop();
    if (polygonLines.length > 0) {
      var lastLineElement = polygonLines[polygonLines.length - 1];
      polygonStartPoint = {
        x: lastLineElement.toX,
        y: lastLineElement.toY,
      };
    } else {
      polygonStartPoint = {
        x: undoElement.fromX,
        y: undoElement.fromY,
      };
    }
    redoLines.push(undoElement);
  } else {
    polygonStartPoint = {
      x: null,
      y: null,
    };
  }
  init();
}

function handleRedo() {
  if (redoLines.length > 0) {
    if (polygonStartPoint.x !== null) {
      var redoElement = redoLines.pop();
      polygonStartPoint = {
        x: redoElement.toX,
        y: redoElement.toY,
      };
      polygonLines.push(redoElement);
    } else {
      var firstPoint = redoLines[redoLines.length - 1];
      polygonStartPoint = {
        x: firstPoint.fromX,
        y: firstPoint.fromY,
      };
    }
    init();
  }
}
function handleReset() {
  polygonLines = [];
  redoLines = [];
  polygonStartPoint = {
    x: null,
    y: null,
  };
  isMouseEventEnabled = true;
  init();
}

function handleLoadSamplePolygon() {
  handleReset();
  // Sample lines data
  polygonLines = [
    { fromX: 400, fromY: 200, toX: 750, toY: 200 },
    { fromX: 750, fromY: 200, toX: 750, toY: 600 },
    { fromX: 750, fromY: 600, toX: 400, toY: 600 },
    { fromX: 400, fromY: 600, toX: 150, toY: 400 },
    { fromX: 150, fromY: 400, toX: 400, toY: 200 },
  ];
  redoLines = [];
  isMouseEventEnabled = true;
  init();
}

function handleActionBtnValidation() {
  var isDisableUndo =
    polygonLines.length === 0 && polygonStartPoint.x == null ? true : false;
  var isDisableRedo = redoLines.length === 0 ? true : false;
  var isDisableReset = isDisableUndo;

  console.log("isDisableUndo--", isDisableUndo);
  console.log("isDisableRedo--", isDisableRedo);
  console.log("isDisableReset--", isDisableReset);

  document.getElementById("btn_undo").disabled = isDisableUndo;
  document.getElementById("btn_redo").disabled = isDisableRedo;
  document.getElementById("btn_reset").disabled = isDisableReset;
}
