class Shader {
	constructor(vertexShaderCode, fragmentShaderCode) {
		this.vertexShaderCode = vertexShaderCode;
		this.fragmentShaderCode = fragmentShaderCode;
		this.compile();
	}

	compile = () => {
		this.vertexShader = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(this.vertexShader, this.vertexShaderCode);
		gl.compileShader(this.vertexShader);
		if (!gl.getShaderParameter(this.vertexShader, gl.COMPILE_STATUS)) {
			throw new Error(gl.getShaderInfoLog(this.vertexShader));
		}

		this.fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(this.fragmentShader, this.fragmentShaderCode);
		gl.compileShader(this.fragmentShader);
		if (!gl.getShaderParameter(this.fragmentShader, gl.COMPILE_STATUS)) {
			throw new Error(gl.getShaderInfoLog(this.fragmentShader));
		}

		this.program = gl.createProgram();
		gl.attachShader(this.program, this.fragmentShader);
		gl.attachShader(this.program, this.vertexShader);
		gl.linkProgram(this.program);
		if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
			throw new Error(gl.getProgramInfoLog(this.program));
		}
	}
}

let vertexShader = `
	precision highp float;

	attribute vec3 a_pos;
	// attribute vec3 a_normal;
	// attribute vec2 a_texcoord;
	// attribute vec4 a_color;

	uniform mat4 u_objectTransform;
	uniform mat4 u_cameraTransform;
	uniform mat4 u_viewTransform;
	uniform mat4 u_textureTransform;

	// varying vec2 v_normal;
	varying vec2 v_texcoord;

	void main() {
		// v_normal = a_normal;
		// v_texcoord = a_texcoord;
		v_texcoord = (u_textureTransform*vec4(a_pos, 1.0)).xy;
		// v_texcoord = a_pos.xy;
		vec4 pos = u_viewTransform * u_cameraTransform * u_objectTransform * vec4(a_pos, 1.0);
		gl_Position = pos;
	}
`;
let fragmentShader = `
	precision highp float;

	// varying vec2 v_normal;
	// varying vec3 v_color;
	varying vec2 v_texcoord;

	uniform sampler2D u_tex;
	uniform vec4 u_color;

	void main() {
		vec4 col = texture2D(u_tex, v_texcoord);
		// col = vec4(1.0, 0.0, 1.0, 1.0);
		if (col.a > 0.0) {
			gl_FragColor = col * u_color;
		} else {
			discard;
		}
	}
`;
