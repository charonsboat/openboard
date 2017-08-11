window._globals = {
  movements: [],
  sets: [],
}; // look into recording and redrawing things...

window.addEventListener('load', function () {
  var peer1 = new window.SimplePeer({ initiator: true });
  var peer2 = new window.SimplePeer();

  peer1.on('signal', function (data) {
    // when peer1 has signaling data, give it to peer2 somehow
    peer2.signal(data)
  });

  peer2.on('signal', function (data) {
    // when peer2 has signaling data, give it to peer1 somehow
    peer1.signal(data)
  });

  peer1.on('connect', function () {
    // wait for 'connect' event before using the data channel
    // peer1.send('hey peer2, how is it going?');

    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');

    context.strokeStyle = '#000000';
    context.lineWidth = 2;

    var drawing = false;
    var position = { x: 0, y: 0 };
    var last_position = position;
    var movement = null;
    var set = [];

    var createMovement = function (start, end) {
      return {
        start: { x: start.x, y: start.y },
        end: { x: end.x, y: end.y },
      };
    };

    var getMousePosition = function (e) {
      var box = canvas.getBoundingClientRect();

      var width_ratio = (canvas.width / canvas.offsetWidth);
      var height_ratio = (canvas.height / canvas.offsetHeight);

      return {
        x: ((e.clientX - box.left) * width_ratio),
        y: ((e.clientY - box.top) * height_ratio),
      };
    };

    var drawLine = function (context, movement, stroke = true) {
      context.moveTo(movement.start.x, movement.start.y);
      context.lineTo(movement.end.x, movement.end.y);

      if (stroke) {
        context.stroke();
      }
    };

    canvas.addEventListener('mousedown', function (e) {
      drawing = true;
      last_position = getMousePosition(e);
    });

    canvas.addEventListener('mousemove', function (e) {
      position = getMousePosition(e);
    });

    canvas.addEventListener('mouseup', function (e) {
      drawing = false;
      window._globals.sets.push(set);
      set = [];
    });

    var clearCanvas = function () {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.beginPath();
    };

    document.getElementById('undo').addEventListener('click', function (e) {
      var last_set = window._globals.sets.pop();

      clearCanvas();

      window._globals.sets.forEach(function (set) {
        set.forEach(function (movement) {
          drawLine(context, movement, false);
        });
      });

      context.stroke();
    });

    var pushMovement = function (movement) {
      window._globals.movements.push(movement);
      set.push(movement);
      peer1.send(JSON.stringify(movement));
    };

    var renderCanvas = function () {
      if (drawing) {
        movement = createMovement(last_position, position);
        drawLine(context, movement);
        pushMovement(movement);
        last_position = position;
      }
    };

    // var draw = function () {
    //   window.requestAnimationFrame(draw);
    //   renderCanvas();
    // };
    //
    // draw();

    window.requestAnimationFrame = (function (callback) {
      return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimaitonFrame ||
        function (callback) {
          window.setTimeout(callback, 1000/60);
        };
    })();

    (function drawLoop () {
      window.requestAnimationFrame(drawLoop);
      renderCanvas();
    })();
  });

  var canvas2 = document.getElementById('canvas2');
  var context2 = canvas2.getContext('2d');

  context2.strokeStyle = '#000000';
  context2.lineWidth = 2;

  var drawLine = function (context, movement) {
    context.moveTo(movement.start.x, movement.start.y);
    context.lineTo(movement.end.x, movement.end.y);
    context.stroke();
  };

  peer2.on('data', function (data) {
    drawLine(context2, JSON.parse(data));
    // got a data channel message
    // console.log('got a message from peer1: ', JSON.parse(data));
  });
});
