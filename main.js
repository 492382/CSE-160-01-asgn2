window.onload = main;

let gl;
let program;
let u_Matrix;
let u_Color;
let a_Position;
function main() {
    let canvas = document.getElementById("andy_canvas");
    setupWebGL(canvas);
    connectVariablesToGLSL();
    addUiCallbacks();


    let animation_loop = (timestamp_milis) => {
	render();
	requestAnimationFrame(animation_loop);
    };
    requestAnimationFrame(animation_loop);
    
}

function addUiCallbacks(){
    
}

function connectVariablesToGLSL() {
    u_Matrix = gl.getUniformLocation(program, "translation_matrix");
    u_Color = gl.getUniformLocation(program, "color");
    a_Position = gl.getAttribLocation(program, "attribute_model_position");
}

function setupWebGL(canvas) {
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });

    //https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/By_example/Hello_GLSL
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, ANDY_VERTEX_SHADER_SOURCE);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, ANDY_FRAGMENT_SHADER_SOURCE);
    gl.compileShader(fragmentShader);

    program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);

    gl.detachShader(program, vertexShader);
    gl.detachShader(program, fragmentShader);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
	const linkErrLog = gl.getProgramInfoLog(program);
	console.error(
	    `Shader program did not link successfully. Error log: ${linkErrLog}`,
	);
	return null;
    }

    let a_Position = gl.getAttribLocation(program, "attribute_model_position");
    gl.enableVertexAttribArray(a_Position);

    gl.useProgram(program);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    //gl.enable(gl.DEPTH_TEST);
}

function render(){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    

    let position_buffer = gl.createBuffer();
    
    gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, TRIANGLE_VERTS, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    

    gl.uniform4fv(u_Color, new Float32Array([1.0, 1.0, 1.0, 1.0]));
    set_matrix(0.5, [0.0, 0.0, 0.0]);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

let ANDY_VERTEX_SHADER_SOURCE = `
uniform mat4 translation_matrix;
attribute vec3 attribute_model_position;
void main() {
gl_Position = translation_matrix * vec4(attribute_model_position, 1.0);
}`;

let ANDY_FRAGMENT_SHADER_SOURCE = `
precision mediump float;
uniform vec4 color;
void main() {
gl_FragColor = color;
}`;


function set_matrix(scale, transpose) {
    gl.uniformMatrix4fv(u_Matrix, false, [
	scale,
	0.0,
	0.0,
	0.0,
	0.0,
	scale,
	0.0,
	0.0,
	0.0,
	0.0,
	scale,
	0.0,
	transpose[0],
	transpose[1],
	transpose[2],
	1.0,
    ]);
    }

const TRIANGLE_VERTS = new Float32Array([
    1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0,
]);
