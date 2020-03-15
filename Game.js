let gl;

class TextureLoader {
	static load = (url) => {
		let img = new Image();
		let texture = gl.createTexture();
		img.onload = function(e) {
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		}
		img.src = url;
		return texture;
	}
}

class Quad {
	constructor(shader) {
		this.shader = shader;
		this.posLocation = gl.getAttribLocation(this.shader.program, 'a_pos');
		// this.texCoordLocation = gl.getAttribLocation(this.shader.program, 'a_texcoord');

		this.objectTransformLocation = gl.getUniformLocation(this.shader.program, 'u_objectTransform');
		this.cameraTransformLocation = gl.getUniformLocation(this.shader.program, 'u_cameraTransform');
		this.viewTransformLocation = gl.getUniformLocation(this.shader.program, 'u_viewTransform');
		this.textureTransformLocation = gl.getUniformLocation(this.shader.program, 'u_textureTransform');
		this.colorLocation  = gl.getUniformLocation(this.shader.program, 'u_color');

		let vertexArray = new Float32Array(4*3);
		vertexArray.set([0.0, 0.0, 0.0], 0 * 3);
		vertexArray.set([0.0, 1.0, 0.0], 1 * 3);
		vertexArray.set([1.0, 1.0, 0.0], 2 * 3);
		vertexArray.set([1.0, 0.0, 0.0], 3 * 3);
		
		let indexArray = new Int16Array(6);
		indexArray.set([0, 1, 2, 0, 2, 3]);

		gl.useProgram(this.shader.program);
		gl.enableVertexAttribArray(this.posLocation);
		// gl.enableVertexAttribArray(this.texCoordLocation);
		let vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);
		gl.vertexAttribPointer(this.posLocation, 3, gl.FLOAT, false, 0, 0);

		let indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexArray, gl.STATIC_DRAW);
		
	}

	setCamera = (viewMatrix, cameraMatrix) => { // Must be a Float32Array or glMatrix.mat4 parameters type
		gl.uniformMatrix4fv(this.viewTransformLocation, false, viewMatrix);
		gl.uniformMatrix4fv(this.cameraTransformLocation, false, cameraMatrix);
	}

	z = 0;
	render = (x, y, w, h, uo, vo, color) => {
		let texWidth = 256.0;
		let texHeight = 256.0;
		this.objectMatrix = glMatrix.mat4.create();
		this.textureMatrix = glMatrix.mat4.create();

		// glMatrix.mat4.translate(this.objectMatrix, this.objectMatrix, glMatrix.vec3.clone([0.0, 0.0, -1.0]));
		glMatrix.mat4.translate(this.objectMatrix, this.objectMatrix, glMatrix.vec3.clone([x * 1.0, y * 1.0, -1.0]));
		glMatrix.mat4.scale(this.objectMatrix, this.objectMatrix, glMatrix.vec3.clone([w * 1.0, h * 1.0, 0.0]));

		glMatrix.mat4.translate(this.textureMatrix, this.textureMatrix, glMatrix.vec3.clone([uo * 1.0, vo*1.0, -1.0]));
		glMatrix.mat4.scale(this.textureMatrix, this.textureMatrix, glMatrix.vec3.clone([w*1.0/texWidth, h*1.0/texHeight, 0.0]));

		gl.uniformMatrix4fv(this.objectTransformLocation, false, this.objectMatrix);
		gl.uniformMatrix4fv(this.textureTransformLocation, false, this.textureMatrix);
		gl.uniform4fv(this.colorLocation, color);

		gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
	}
}

class Game {
	
	start = () => {
		this.fov = 90.0;
		this.canvas = document.querySelector('#game_canvas');
		gl = this.canvas.getContext('webgl');
		this.quad = new Quad(new Shader(vertexShader, fragmentShader));
		this.sheetTexture = TextureLoader.load('tex/sheet.png');
		this.render();
	}
	x = 0;
	y = 0;
	render = (time) => {
		gl.viewport(0, 0, this.canvas.width, this.canvas.height);
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		// console.log(mat)
		this.viewMatrix = glMatrix.mat4.create();
		glMatrix.mat4.perspective(this.viewMatrix, glMatrix.glMatrix.toRadian(this.fov), this.canvas.width / this.canvas.height, 0.01, 100.0);
		this.cameraMatrix = glMatrix.mat4.create();
		let scale = 2.0/ this.canvas.height;
		glMatrix.mat4.scale(this.cameraMatrix, this.cameraMatrix, glMatrix.vec3.clone([scale, -scale, 1.0]));
		this.quad.setCamera(this.viewMatrix, this.cameraMatrix);
		// this.quad.render(this.x = this.x+2, 0, 16, 16, 0, 0, glMatrix.vec4.clone([1.0, 0.0, 0.0, 1.0]));
		this.quad.render(0, 0, 24, 95, 0, 0, glMatrix.vec4.clone([1.0, 0.0, 1.0, 1.0]));
		window.requestAnimationFrame(this.render);
	}
}

new Game().start();
