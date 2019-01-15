function $(selector){
	return document.querySelectorAll(selector);
}

var canvas = document.querySelector("canvas#bullets");
var ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.style.width = window.innerWidth+"px";
canvas.height = 600;
canvas.style.height = 600+"px";



var matrix = [[1, 0],[0, 1]];
var vector = [0,0];

var defaultColor = '#000';
var startingGradientColor = '#FF0000';
var stoppingGradientColor = '#0000FF';
var bulletIsHoveredColor = '#dd3838';


function getGradientColor(start_color, end_color, percent) {
	// strip the leading # if it's there
	start_color = start_color.replace(/^\s*#|\s*$/g, '');
	end_color = end_color.replace(/^\s*#|\s*$/g, '');

	// convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
	if(start_color.length == 3){
		start_color = start_color.replace(/(.)/g, '$1$1');
	}

	if(end_color.length == 3){
		end_color = end_color.replace(/(.)/g, '$1$1');
	}

	// get colors
	var start_red = parseInt(start_color.substr(0, 2), 16),
	start_green = parseInt(start_color.substr(2, 2), 16),
	start_blue = parseInt(start_color.substr(4, 2), 16);

	var end_red = parseInt(end_color.substr(0, 2), 16),
	end_green = parseInt(end_color.substr(2, 2), 16),
	end_blue = parseInt(end_color.substr(4, 2), 16);

	// calculate new color
	var diff_red = end_red - start_red;
	var diff_green = end_green - start_green;
	var diff_blue = end_blue - start_blue;

	diff_red = ( (diff_red * percent) + start_red ).toString(16).split('.')[0];
	diff_green = ( (diff_green * percent) + start_green ).toString(16).split('.')[0];
	diff_blue = ( (diff_blue * percent) + start_blue ).toString(16).split('.')[0];

	// ensure 2 digits by color
	if( diff_red.length == 1 ) diff_red = '0' + diff_red
	if( diff_green.length == 1 ) diff_green = '0' + diff_green
	if( diff_blue.length == 1 ) diff_blue = '0' + diff_blue

	return '#' + diff_red + diff_green + diff_blue;
}

function createOriginalPoints(n) {
	var arr = [];
	var xValue=0; var yValue=0; 
	var angleValue=0; var colorValue=defaultColor;
	for (var i=0;i<n;i++) {

		angleValue = i*2*Math.PI/n;

		xValue = Math.cos(angleValue);
		yValue = Math.sin(angleValue);

		colorValue = getGradientColor(startingGradientColor, stoppingGradientColor, angleValue/(2*Math.PI));

     		arr[i] = {x:xValue, y:yValue, angle:angleValue, color:colorValue};
  	}
	return arr;
}

var step = 36;
var originalBullets = createOriginalPoints(step);

var bullets = [];
for(var i=0;i<originalBullets.length;i++){
	var originalBullet = originalBullets[i];
	bullets.push({
		x: originalBullet.x*10,
		y: originalBullet.y*10,
		angle:originalBullet.angle,
		color:originalBullet.color
	});
}

// Mouse
var Mouse = {
	x: 0,
	y: 0
};

// Make inputs scrubbable
var scrubInput = null;
var scrubPosition = {x:0, y:0};
var scrubStartValue = 0;
function makeScrubbable(input){
	input.onmousedown = function(e){
		scrubInput = e.target;
		scrubPosition.x = e.clientX;
		scrubPosition.y = e.clientY;
		scrubStartValue = parseFloat(input.value);
	}
	input.onclick = function(e){
		e.target.select();
	}
}
window.onmousemove = function(e){
	// Mouse
	Mouse.x = e.clientX;
	Mouse.y = e.clientY;

	// If browser allows it, try to find x/y relative to canvas rather than page
	if(e.offsetX != undefined){
		Mouse.x = e.offsetX;
		Mouse.y = e.offsetY;
	}
	else if(e.layerX != undefined && e.originalTarget != undefined){
		Mouse.x = e.layerX-e.originalTarget.offsetLeft;
		Mouse.y = e.layerY-e.originalTarget.offsetTop;
	}

	// Scrubbing
	if(!scrubInput) return;
	scrubInput.blur();
	var deltaX = e.clientX - scrubPosition.x;
	deltaX = Math.round(deltaX/10)*0.1; // 0.1 for every 10px
	var val = scrubStartValue + deltaX;
	scrubInput.value = (Math.round(val*10)/10).toFixed(1);
	updateMatrixLeft();

}
window.onmouseup = function(){
	scrubInput = null;
}

var mtx_matrix = $("#mtx_matrix input");
for(var i=0;i<mtx_matrix.length;i++){
	var input = mtx_matrix[i];
	input.onchange = updateMatrixLeft;
	makeScrubbable(input);
}
var mtx_vector = $("#mtx_vector input");
for(var i=0;i<mtx_vector.length;i++){
	var input = mtx_vector[i];
	input.onchange = updateMatrixLeft;
	makeScrubbable(input);
}

function updateMatrixLeft(){

	/*for(var i=0;i<6;i++){
		var m = mtx_expanded_left[i];
		var t = mtx_transforms[i];
		m.innerHTML = t.value;
	}*/

	matrix[0][0] = parseFloat(mtx_matrix[0].value) || 0;
	matrix[1][0] = parseFloat(mtx_matrix[1].value) || 0;
	vector[0] = parseFloat(mtx_vector[0].value) || 0;
	matrix[0][1] = parseFloat(mtx_matrix[2].value) || 0;
	matrix[1][1] = parseFloat(mtx_matrix[3].value) || 0;
	vector[1] = parseFloat(mtx_vector[1].value) || 0;

	draw();
}

function calculate(x,y){
	x = x || 0;
	y = y || 0;
	var x2 = (matrix[0][0])*x + (matrix[1][0])*y + vector[0];
	var y2 = (matrix[0][1])*x + (matrix[1][1])*y + vector[1];
	return {x:x2, y:y2};
}


function draw(){

	// TEMP CANVAS saved
	//tempContext.clearRect(0,0,canvas.width,canvas.height);	
	//tempContext.drawImage(canvas,0,0);

	// Clear canvas
	canvas.width = window.innerWidth;
	canvas.style.width = window.innerWidth+"px";
	//ctx.clearRect(0,0,canvas.width,canvas.height);
	ctx.save();

	// Draw trail
	/*ctx.globalAlpha = 0.7;
	ctx.drawImage(tempCanvas,0,0);
	ctx.globalAlpha = 1.0;*/

	// Center
	ctx.translate(canvas.width/2,canvas.height/2);

	// Draw axes
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.strokeStyle = '#bbb';
	ctx.moveTo(-canvas.width/2,0);
	ctx.lineTo(canvas.width/2,0);
	ctx.moveTo(0,-canvas.height/2);
	ctx.lineTo(0,canvas.height/2);
	ctx.stroke();

	// Calculate bullets
	for(var i=0;i<bullets.length;i++){
		var bullet = bullets[i];
		var originalBullet = originalBullets[i];
		var newBullet = calculate(originalBullet.x,originalBullet.y);
		bullet.x = bullet.x*0.93 + newBullet.x*0.07;
		bullet.y = bullet.y*0.93 + newBullet.y*0.07;
	}

	// Draw bullets original
	var anyHovered = false;
	for(var i=0;i<bullets.length;i++){

		var bullet = bullets[i];
		var originalBullet = originalBullets[i];

/*
		// IS IT HOVERED?
		var dx = (Mouse.x-canvas.width/2) - (originalBullet.x*100);
		var dy = (Mouse.y-canvas.height/2) - (-originalBullet.y*100);
		var isHovered = (dx*dx+dy*dy<25);
		dx = (Mouse.x-canvas.width/2) - (bullet.x*100);
		dy = (Mouse.y-canvas.height/2) - (-bullet.y*100);
		bullet.isHovered = isHovered || (dx*dx+dy*dy<100); // radius:10px
		if(bullet.isHovered){
			anyHovered = true;
			mtx_inputs[0].innerHTML = originalBullet.x.toFixed(1);
			mtx_inputs[1].innerHTML = originalBullet.y.toFixed(1);
			updateMatrixRight();
		}
*/

		// Draw connecting line
		ctx.beginPath();
		ctx.lineWidth = 1;
		ctx.strokeStyle = bullet.isHovered ? "#EE3838" : '#888';
		ctx.moveTo(originalBullet.x*100, -originalBullet.y*100);
		ctx.lineTo(bullet.x*100, -bullet.y*100);
		ctx.stroke();

		// Draw where original was
		ctx.beginPath();
		ctx.arc(originalBullet.x*100, -originalBullet.y*100, 4, 0, 2*Math.PI, false);
		ctx.fillStyle = '#ddd';
		ctx.fill();
		ctx.stroke();

	}

	// Draw bullets
	for(var i=0;i<bullets.length;i++){

		var bullet = bullets[i];
		var originalBullet = originalBullets[i];

		// Draw where bullet is
		ctx.beginPath();
		ctx.arc(bullet.x*100, -bullet.y*100, 8, 0, 2*Math.PI, false);
				
		ctx.fillStyle = bullet.isHovered ? bulletIsHoveredColor : bullet.color;
		ctx.fill();

	}
/*
	if(!anyHovered && mtx_inputs[0].innerHTML!="x"){
		mtx_inputs[0].innerHTML = "x";
		mtx_inputs[1].innerHTML = "y";
		updateMatrixRight();
	}
*/
	ctx.restore();


	// CURSOR
	canvas.style.cursor = anyHovered ? "pointer": "default";

}











window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();


updateMatrixLeft();


(function animloop(){
	draw();
	requestAnimFrame(animloop);
})();


