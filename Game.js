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

	renderBillboard = (pos, w, h, uo, vo, color) => {
		if (!this.texture.loaded) return;
		this.objectMatrix = glMatrix.mat4.create();
		this.textureMatrix = glMatrix.mat4.create();
		// glMatrix.mat4.translate(this.objectMatrix, this.objectMatrix, glMatrix.vec3.clone([0.0, 0.0, -1.0]));
		glMatrix.mat4.translate(this.objectMatrix, this.objectMatrix, [pos[0]-w / 2.0, pos[1] - h * 1.0,pos[2]]);
		glMatrix.mat4.scale(this.objectMatrix, this.objectMatrix, glMatrix.vec3.clone([w * 1.0, h * 1.0, 0.0]));
		gl.uniformMatrix4fv(this.objectTransformLocation, false, this.objectMatrix);
		
		glMatrix.mat4.scale(this.textureMatrix, this.textureMatrix, glMatrix.vec3.clone([1.0/this.texture.width, 1.0/this.texture.height, 0.0]));
		glMatrix.mat4.translate(this.textureMatrix, this.textureMatrix, glMatrix.vec3.clone([(uo +0.701) * 1.0, vo*1.0, 0.0]));
		glMatrix.mat4.scale(this.textureMatrix, this.textureMatrix, glMatrix.vec3.clone([(w+1.8) * 1.0, (h+1.8) * 1.0, 0.0]));
		gl.uniformMatrix4fv(this.textureTransformLocation, false, this.textureMatrix);

		gl.uniform4fv(this.colorLocation, color);

		gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
	}

	render = (pos, w, h, uo, vo, color) => {
		if (!this.texture.loaded) return;
		this.objectMatrix = glMatrix.mat4.create();
		this.textureMatrix = glMatrix.mat4.create();
		// glMatrix.mat4.translate(this.objectMatrix, this.objectMatrix, glMatrix.vec3.clone([0.0, 0.0, -1.0]));
		glMatrix.mat4.translate(this.objectMatrix, this.objectMatrix, [pos[0], pos[1],pos[2]]);
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
	fov = 70;
	treePositions = [];
	start = () => {
		this.canvas = document.querySelector('#game_canvas');
		gl = this.canvas.getContext('webgl');
		this.groundTexture = Texture.load('tex/ground.png');
		this.sheetTexture = Texture.load('tex/sheet.png');
		this.quad = new Quad(new Shader(vertexShader, fragmentShader));
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LESS);
		for (let i = 0; i < 100; i++) {
			// let x = (Math.random()-0.5)*512;
			// let z = (Math.random()-0.5)*512;
			let x = (Math.random()-0.5)*128;
			let z = -(Math.random())*512;
			this.treePositions.push(glMatrix.vec3.clone([x, 0, z]));
		}
		this.animate();

		window.addEventListener('keydown', this.onKeyDown);
		window.addEventListener('keyup', this.onKeyUp);
	}

	keysDown = [];
	onKeyDown = (e) => {
		if (e.keyCode<256) this.keysDown[e.keyCode] = true;
	}

	onKeyUp = (e) => {
		if (e.keyCode<256) this.keysDown[e.keyCode] = false;	
	}

	lastTime = Date.now();
	unprocessedFrames = 0.0;
	animate = (time) => {
		let now = Date.now();
		this.unprocessedFrames += (now - this.lastTime) * 60.0/1000.0; 
		if (this.unprocessedFrames > 10.0) this.unprocessedFrames = 10.0;
		while (this.unprocessedFrames>1.0) {
			this.tick();
			this.unprocessedFrames -= 1.0;
		}
		this.render();
		window.requestAnimationFrame(this.animate);
	}

	playerPos = glMatrix.vec3.clone([0.0, 0.0, 0.0]);
	playerPosA = glMatrix.vec3.clone([0.0, 0.0, 0.0]);
	
	tick = () => {
		if (this.keysDown[87]) { // up
			if (this.playerPos[1] == 0) {
				this.playerPosA[1] = -0.3;
			}
		}
		if (this.keysDown[83]) { // down
		}
		let speed = 0.02;
		if (this.keysDown[38]) 
			this.playerPosA[2] -= speed;
		if (this.keysDown[40])
			this.playerPosA[2] += speed;
		if (this.keysDown[65]) { // left
			this.playerPosA[0]-=speed;
		}
		if (this.keysDown[74]) {
			this.z += 1;
		}
		if (this.keysDown[76]) {
			this.z -= 1;
		}
		if (this.keysDown[68]) { // right
			this.playerPosA[0]+=speed;
		}
		glMatrix.vec3.add(this.playerPos, this.playerPos, this.playerPosA);
		this.playerPosA[0]*=0.9;
		this.playerPosA[1]+=0.002;
		this.playerPosA[2]*=0.9;

		let max = 64;
		if (this.playerPos[0]<-max) this.playerPos[0] = -max;
		if (this.playerPos[0]>max) this.playerPos[0] = max;
		if (this.playerPos[1]>0.0) this.playerPos[1] = 0.0;
	}

	render = () => {
		let pixelScale = 2.0;
		gl.viewport(0, 0, this.canvas.width, this.canvas.height);
		gl.clearColor(0.2, 0.2, 0.2, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);

		let viewMatrix = glMatrix.mat4.create();
		glMatrix.mat4.perspective(viewMatrix, this.fov * Math.PI / 180, this.canvas.width / this.canvas.height, 0.01, 2.0);
		let scale = pixelScale * 2.0/ this.canvas.height;
		let screenMatrix = glMatrix.mat4.create();
		glMatrix.mat4.scale(screenMatrix, glMatrix.mat4.create(), glMatrix.vec3.clone([scale, -scale, scale]));
		let cameraMatrix = glMatrix.mat4.create();
		glMatrix.mat4.translate(cameraMatrix, cameraMatrix, [-this.playerPos[0]*0.5, 16.0-this.playerPos[1]*0.5, -32.0 -this.playerPos[2]]);
		// glMatrix.mat4.rotateX(cameraMatrix, cameraMatrix, -0.4);
		// glMatrix.mat4.rotateY(cameraMatrix, cameraMatrix, this.z % 10 / 10.0 * Math.PI / 2.0);
		let floorCameraMatrix = glMatrix.mat4.create();
		glMatrix.mat4.rotateX(floorCameraMatrix, floorCameraMatrix, Math.PI / 2.0);

		let whiteColor = glMatrix.vec4.clone([1.0, 1.0, 1.0, 1.0]);
		
		this.quad.setCamera(viewMatrix, glMatrix.mat4.mul(glMatrix.mat4.create(), glMatrix.mat4.mul(glMatrix.mat4.create(), screenMatrix, cameraMatrix), floorCameraMatrix));
		this.quad.setTexture(this.groundTexture);
		// Renders Ground
		// for (let x = -1; x <= 1; x++) {
		// 	for (let y = -1; y <= 1; y++) {
		// 		this.quad.render(glMatrix.vec3.clone([x*256.0, y*256.0, 0.0]), 256, 256, 0, 0, whiteColor);
		// 	}
		// }
		this.quad.render(glMatrix.vec3.clone([-80.0, -256.0, 0.0]), 160, 256, 0, 0, whiteColor);
		
		// Renders Trees
		this.quad.setCamera(viewMatrix, screenMatrix);
		this.quad.setTexture(this.sheetTexture);
		for (let i = 0; i < 100; i++) {
			this.quad.renderBillboard(glMatrix.vec3.transformMat4(glMatrix.vec3.create(), this.treePositions[i], cameraMatrix), 31.5, 48, 34.0, 0, whiteColor);
		}

		// Renders Players
		this.quad.renderBillboard(glMatrix.vec3.transformMat4(glMatrix.vec3.create(), this.playerPos, cameraMatrix), 14, 15, 0, 0, whiteColor);
	}
}

let game = new Game();
game.start();
