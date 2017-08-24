var CanvasRenderer = function (canvas) {
  var context = canvas.getContext('2d');
  var is_changed = false;

  context.strokeStyle = '#000000';
  context.lineWidth = 2;

  this.drawLine = function (line) {
    context.moveTo(line.start.x, line.start.y);
    context.lineTo(line.end.x, line.end.y);

    is_changed = true;
  };

  this.clearCanvas = function () {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.beginPath();

    is_changed = true;
  };

  this.render = function () {
    if (is_changed) {
      context.stroke();
      context.beginPath();

      is_changed = false;
    }
  };
};

var VirtualInterface = function (canvas, virtual, renderer) {
  offset = {
    x: (canvas.width / 2),
    y: (canvas.height / 2),
  };

  this.offset = offset;

  this.lineToVirtual = function (line) {
    return {
      start: {
        x: line.start.x - offset.x,
        y: line.start.y - offset.y,
      },
      end: {
        x: line.end.x - offset.x,
        y: line.end.y - offset.y,
      },
    };
  };

  this.lineToCanvas = function (line) {
    return {
      start: {
        x: line.start.x + offset.x,
        y: line.start.y + offset.y,
      },
      end: {
        x: line.end.x + offset.x,
        y: line.end.y + offset.y,
      },
    };
  };

  this.drawVirtual = function () {
    virtual.state.collections.current.forEach(function (collection) {
      collection.forEach(function (line) {
        line = this.lineToCanvas(line);
        start_inside_canvas = (line.start.x >= 0 && line.start.x <= canvas.width && line.start.y >= 0 && line.start.y <= canvas.height);
        end_inside_canvas = (line.end.x >= 0 && line.end.x <= canvas.width && line.end.y >= 0 && line.end.y <= canvas.height);

        if (start_inside_canvas || end_inside_canvas) {
          renderer.drawLine(line);
        }
      }.bind(this));
    }.bind(this));
  }.bind(this);
};

var VirtualCanvas = function () {
  this.state = {
    collections: {
      current: [],
      history: [],
    }
  };

  this.createLine = function (start, end) {
    return {
      start: {
        x: start.x,
        y: start.y,
      },
      end: {
        x: end.x,
        y: end.y,
      },
    };
  };
};

window.addEventListener('load', function () {
  var canvas = document.getElementById('canvas');
  var renderer = new CanvasRenderer(canvas);
  var virtual = new VirtualCanvas();
  var virtual_interface = new VirtualInterface(canvas, virtual, renderer);
  var bounding = canvas.getBoundingClientRect();

  window.virtual = virtual;
  window.renderer = renderer;

  var collection = [];
  var is_drawing = false;
  var is_panning = false;
  var pan_mode = false;

  canvas.addEventListener('mousedown', function (e) {
    if (!pan_mode) {
      is_drawing = true;
    } else {
      is_panning = true;
    }

    last_position = {
      x: e.clientX - bounding.left,
      y: e.clientY - bounding.top,
    };
  });

  canvas.addEventListener('mousemove', function (e) {
    position = {
      x: e.clientX - bounding.left,
      y: e.clientY - bounding.top,
    };
  });

  canvas.addEventListener('mouseup', function (e) {
    if (!pan_mode) {
      is_drawing = false;
      virtual.state.collections.current.push(collection);
      collection = [];
    } else {
      is_panning = false;
    }
  });

  (function run() {
    window.requestAnimationFrame(run);

    if (is_drawing) {
      var line = {
        start: last_position,
        end: position,
      };
      collection.push(virtual_interface.lineToVirtual(line));
      renderer.drawLine(line);
      last_position = position;
    } else if (is_panning) {
      var line = {
        start: last_position,
        end: position,
      };
      virtual_interface.offset.x -= (line.start.x - line.end.x);
      virtual_interface.offset.y -= (line.start.y - line.end.y);
      renderer.clearCanvas();
      virtual_interface.drawVirtual();
      last_position = position;
    }

    renderer.render();
  })();

  document.getElementById('move-left').addEventListener('click', function () {
    renderer.clearCanvas();
    virtual_interface.offset.x -= 10;
    virtual_interface.drawVirtual();
  });

  document.getElementById('move-right').addEventListener('click', function () {
    renderer.clearCanvas();
    virtual_interface.offset.x += 10;
    virtual_interface.drawVirtual();
  });

  document.getElementById('toggle-pan').addEventListener('click', function () {
    pan_mode = !pan_mode;
  });

  // peer stuff
  // window.peer = new window.SimplePeer({ initiator: true });
  //
  // window.peer.on('signal', function (data) {
  //   console.log('signal');
  //   // console.log(JSON.stringify(data));
  //   var key = 'signal-key-' + Math.random();
  //   console.log('key', key);
  //   localStorage.setItem(key, JSON.stringify(data));
  // });
  //
  // window.peer.on('connect', function () {
  //   console.log('connected!');
  // });
  //
  // window.signal_peer = function (key) {
  //   var data = JSON.parse(localStorage.getItem(key));
  //
  //   window.peer.signal(data);
  // }
});

// var CanvasListener = function (virtual, renderer) {
//
// };


// window._globals = {
//   movements: [],
//   sets: [],
// }; // look into recording and redrawing things...
//
// window.addEventListener('load', function () {
//   var peer1 = new window.SimplePeer({ initiator: true });
//   var peer2 = new window.SimplePeer();
//
//   peer1.on('signal', function (data) {
//     // when peer1 has signaling data, give it to peer2 somehow
//     peer2.signal(data)
//   });
//
//   peer2.on('signal', function (data) {
//     // when peer2 has signaling data, give it to peer1 somehow
//     peer1.signal(data)
//   });
//
//   peer1.on('connect', function () {
//     // wait for 'connect' event before using the data channel
//     // peer1.send('hey peer2, how is it going?');
//
//     var canvas = document.getElementById('canvas');
//     var context = canvas.getContext('2d');
//
//     context.strokeStyle = '#000000';
//     context.lineWidth = 2;
//
//     var drawing = false;
//     var position = { x: 0, y: 0 };
//     var last_position = position;
//     var movement = null;
//     var set = [];
//
//     var createMovement = function (start, end) {
//       return {
//         start: { x: start.x, y: start.y },
//         end: { x: end.x, y: end.y },
//       };
//     };
//
//     var getMousePosition = function (e) {
//       var box = canvas.getBoundingClientRect();
//
//       var width_ratio = (canvas.width / canvas.offsetWidth);
//       var height_ratio = (canvas.height / canvas.offsetHeight);
//
//       return {
//         x: ((e.clientX - box.left) * width_ratio),
//         y: ((e.clientY - box.top) * height_ratio),
//       };
//     };
//
//     var drawLine = function (context, movement, stroke = true) {
//       context.moveTo(movement.start.x, movement.start.y);
//       context.lineTo(movement.end.x, movement.end.y);
//
//       if (stroke) {
//         context.stroke();
//         context.beginPath();
//       }
//     };
//
//     canvas.addEventListener('mousedown', function (e) {
//       drawing = true;
//       last_position = getMousePosition(e);
//     });
//
//     canvas.addEventListener('mousemove', function (e) {
//       position = getMousePosition(e);
//     });
//
//     canvas.addEventListener('mouseup', function (e) {
//       drawing = false;
//       window._globals.sets.push(set);
//       set = [];
//     });
//
//     var clearCanvas = function () {
//       context.clearRect(0, 0, canvas.width, canvas.height);
//       context.beginPath();
//     };
//
//     document.getElementById('undo').addEventListener('click', function (e) {
//       var last_set = window._globals.sets.pop();
//
//       clearCanvas();
//
//       window._globals.sets.forEach(function (set) {
//         set.forEach(function (movement) {
//           drawLine(context, movement, false);
//         });
//       });
//
//       context.stroke();
//     });
//
//     var pushMovement = function (movement) {
//       window._globals.movements.push(movement);
//       set.push(movement);
//       peer1.send(JSON.stringify(movement));
//     };
//
//     var renderCanvas = function () {
//       if (drawing) {
//         movement = createMovement(last_position, position);
//         drawLine(context, movement);
//         pushMovement(movement);
//         last_position = position;
//       }
//     };
//
//     // var draw = function () {
//     //   window.requestAnimationFrame(draw);
//     //   renderCanvas();
//     // };
//     //
//     // draw();
//
//     window.requestAnimationFrame = (function (callback) {
//       return window.requestAnimationFrame ||
//         window.webkitRequestAnimationFrame ||
//         window.mozRequestAnimationFrame ||
//         window.oRequestAnimationFrame ||
//         window.msRequestAnimaitonFrame ||
//         function (callback) {
//           window.setTimeout(callback, 1000/60);
//         };
//     })();
//
//     (function drawLoop () {
//       window.requestAnimationFrame(drawLoop);
//       renderCanvas();
//     })();
//   });
//
//   var canvas2 = document.getElementById('canvas2');
//   var context2 = canvas2.getContext('2d');
//
//   context2.strokeStyle = '#000000';
//   context2.lineWidth = 2;
//
//   var drawLine = function (context, movement) {
//     context.moveTo(movement.start.x, movement.start.y);
//     context.lineTo(movement.end.x, movement.end.y);
//     context.stroke();
//     context.beginPath();
//   };
//
//   peer2.on('data', function (data) {
//     drawLine(context2, JSON.parse(data));
//     // got a data channel message
//     // console.log('got a message from peer1: ', JSON.parse(data));
//   });
// });
