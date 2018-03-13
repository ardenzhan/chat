$(() => {
  // DRAWING
  // var canvas = document.getElementsByClassName('whiteboard')[0];
  // var colors = document.getElementsByClassName('color');
  var context = document.getElementsByClassName('whiteboard')[0].getContext('2d');
  // var current = {
  //   color: 'black'
  // };
  // var drawing = false;
  // canvas.addEventListener('mousedown', onMouseDown, false);
  // canvas.addEventListener('mouseup', onMouseUp, false);
  // canvas.addEventListener('mouseout', onMouseUp, false);
  // canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);
  // for (var i = 0; i < colors.length; i++){
  //   colors[i].addEventListener('click', onColorUpdate, false);
  // }
  $('canvas').mousedown(function(e) {
    var mouseX = e.pageX - this.offsetLeft;
    var mouseY = e.pageY - this.offsetTop;
      
    drawing = true;
    addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
    redraw();
  });

  $('canvas').mousemove(function(e) {
    if (drawing) {
      addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
      redraw();
    }
  });

  $('canvas').mouseup(function(e) {
    drawing = false;
  });

  $('canvas').mouseleave(function(e) {
    drawing = false;
  });

  var clickX = new Array();
  var clickY = new Array();
  var clickDrag = new Array();
  var drawing = false;

  function addClick(x, y, dragging) {
    clickX.push(x);
    clickY.push(y);
    clickDrag.push(dragging);
  }
  function redraw(){
    context.clearRect(0, 0, context.canvas.clientWidth, context.canvas.clientHeight); // Clears the canvas
    
    context.strokeStyle = "#df4b26";
    context.lineJoin = "round";
    context.lineWidth = 5;
        
    for(var i=0; i < clickX.length; i++) {		
      context.beginPath();
      if(clickDrag[i] && i){
        context.moveTo(clickX[i-1], clickY[i-1]);
       }else{
         context.moveTo(clickX[i]-1, clickY[i]);
       }
       context.lineTo(clickX[i], clickY[i]);
       context.closePath();
       context.stroke();
    }
  }





  socket.on('drawing', onDrawingEvent);

  function drawLine(x0, y0, x1, y1, color, emit){
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.stroke();
    context.closePath();

    if (!emit) { return; }
    var w = canvas.width;
    var h = canvas.height;

    socket.emit('drawing', {
      x0: x0 / w,
      y0: y0 / h,
      x1: x1 / w,
      y1: y1 / h,
      color: color
    });
  }

  function onMouseDown(e){
    drawing = true;
    current.x = e.clientX;
    current.y = e.clientY;
  }

  function onMouseUp(e){
    if (!drawing) { return; }
    drawing = false;
    drawLine(current.x, current.y, e.clientX, e.clientY, current.color, true);
  }

  function onMouseMove(e){
    if (!drawing) { return; }
    drawLine(current.x, current.y, e.clientX, e.clientY, current.color, true);
    current.x = e.clientX;
    current.y = e.clientY;
  }

  function onColorUpdate(e){
    current.color = e.target.className.split(' ')[1];
  }

  // limit the number of events per second
  function throttle(callback, delay) {
    var previousCall = new Date().getTime();
    return function() {
      var time = new Date().getTime();

      if ((time - previousCall) >= delay) {
        previousCall = time;
        callback.apply(null, arguments);
      }
    };
  }

  function onDrawingEvent(data){
    var w = canvas.width;
    var h = canvas.height;
    drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
  }

})