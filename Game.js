let gl;

class Texture {
	static load = (url) => {
		let loaded = false;
		let img = new Image();
		let texture = gl.createTexture();
		let width, height;
		img.addEventListener('load', () => {
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			width = img.width;
			console.log(width);
			height = img.height;
			loaded = true;
		}, false);
		img.src = url;
		document.body.appendChild(img);
		return {texture, width: 256, height: 256, loaded: true, img: img};
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
		this.colorLocation = gl.getUniformLocation(this.shader.program, 'u_color');

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

	setTexture = (texture) => {
		this.texture = texture;
		gl.bindTexture(gl.TEXTURE_2D, texture.texture)
		// console.log(this.texture);
	}

	setCamera = (viewMatrix, cameraMatrix) => { // Must be a Float32Array or glMatrix.mat4 parameters type
		gl.uniformMatrix4fv(this.viewTransformLocation, false, viewMatrix);
		gl.uniformMatrix4fv(this.cameraTransformLocation, false, cameraMatrix);
	}

	z = 0;
	render = (pos, w, h, uo, vo, color) => {
		if (!this.texture.loaded) return;
		this.objectMatrix = glMatrix.mat4.create();
		this.textureMatrix = glMatrix.mat4.create();
		// glMatrix.mat4.translate(this.objectMatrix, this.objectMatrix, glMatrix.vec3.clone([0.0, 0.0, -1.0]));
		glMatrix.mat4.translate(this.objectMatrix, this.objectMatrix, [pos[0]-w / 2.0, pos[1] - h * 1.0,pos[2] * 0.01]);
		glMatrix.mat4.scale(this.objectMatrix, this.objectMatrix, glMatrix.vec3.clone([w * 1.0, h * 1.0, 0.0]));
		gl.uniformMatrix4fv(this.objectTransformLocation, false, this.objectMatrix);
		
		glMatrix.mat4.scale(this.textureMatrix, this.textureMatrix, glMatrix.vec3.clone([1.0/this.texture.width, 1.0/this.texture.height, 0.0]));
		glMatrix.mat4.translate(this.textureMatrix, this.textureMatrix, glMatrix.vec3.clone([uo * 1.0, vo*1.0, 0.0]));
		glMatrix.mat4.scale(this.textureMatrix, this.textureMatrix, glMatrix.vec3.clone([w * 1.0, h * 1.0, 0.0]));
		gl.uniformMatrix4fv(this.textureTransformLocation, false, this.textureMatrix);

		gl.uniform4fv(this.colorLocation, color);

		gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
	}
}

class Game {
	fov = 90;
	start = () => {
		this.canvas = document.querySelector('#game_canvas');
		gl = this.canvas.getContext('webgl');
		this.sheetTexture = Texture.load('tex/sheet.png');
		this.quad = new Quad(new Shader(vertexShader, fragmentShader));
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LESS);
		this.render();
	}

	render = (time) => {
		let pixelScale = 2.0;
		gl.viewport(0, 0, this.canvas.width, this.canvas.height);
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);

		let viewMatrix = glMatrix.mat4.create();
		glMatrix.mat4.perspective(viewMatrix, this.fov * Math.PI / 180, this.canvas.width / this.canvas.height, 0.01, 100.0);
		let scale = pixelScale * 2.0/ this.canvas.height;
		let screenMatrix = glMatrix.mat4.create();
		glMatrix.mat4.scale(screenMatrix, glMatrix.mat4.create(), glMatrix.vec3.clone([scale, -scale, 1.0]));
		let cameraMatrix = glMatrix.mat4.create();
		glMatrix.mat4.translate(cameraMatrix, cameraMatrix, [0.0, 32.0, -100.0]);
		glMatrix.mat4.rotateY(cameraMatrix, cameraMatrix, Date.now()%10000/10000.0 * Math.PI * 2.0);
		let whiteColor = glMatrix.vec4.clone([1.0, 1.0, 1.0, 1.0]);
		
		this.quad.setCamera(viewMatrix, screenMatrix);
		this.quad.setTexture(this.sheetTexture);
		// this.quad.render(glMatrix.vec3.transformMat4(glMatrix.vec3.create(), glMatrix.vec3.clone([30.0, 0.0, 0.0]), cameraMatrix), 24, 95, 0, 0, whiteColor);
		this.quad.render(glMatrix.vec3.clone([0.0, 0.0, -100.0]), 32, 32, 0, 0, whiteColor);
		
		this.quad.setCamera(viewMatrix, screenMatrix);
		this.quad.setTexture(this.sheetTexture);
		this.quad.render(glMatrix.vec3.transformMat4(glMatrix.vec3.create(), glMatrix.vec3.clone([60.0, 0.0, 0.0]), cameraMatrix), 24, 95, 0, 0, whiteColor);
		this.quad.render(glMatrix.vec3.transformMat4(glMatrix.vec3.create(), glMatrix.vec3.clone([-60.0, 0.0, 0.0]), cameraMatrix), 24, 95, 0, 0, whiteColor);
		this.quad.render(glMatrix.vec3.transformMat4(glMatrix.vec3.create(), glMatrix.vec3.clone([0.0, 0.0, 60.0]), cameraMatrix), 24, 95, 0, 0, whiteColor);
		this.quad.render(glMatrix.vec3.transformMat4(glMatrix.vec3.create(), glMatrix.vec3.clone([0.0, 0.0, -60.0]), cameraMatrix), 24, 95, 0, 0, whiteColor);
		window.requestAnimationFrame(this.render);
	}
}

let game = new Game();
game.start();
