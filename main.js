window.onload = main;

let gl;
let program;
let u_GlobalMatrix;
let u_ModelMatrix;
let u_Color;
let a_Position;

let global_rotor = make_rotation_rotor(0, [0, 0, 1]);
let d_theta = 0.05;

let is_mouse_down = false;
let mouse_old_x = undefined;
let mouse_old_y = undefined;
let mouse_dx = 0.1;
let mouse_dy = 0.05;


function main() {
    let canvas = document.getElementById("andy_canvas");
    setupWebGL(canvas);
    connectVariablesToGLSL();
    addUiCallbacks();

    let animation_loop = (timestamp_milis) => {
	render(timestamp_milis);
	requestAnimationFrame(animation_loop);
    };
    requestAnimationFrame(animation_loop);

}

function addUiCallbacks() {
    let radians_counter = document.getElementById("radians_counter");


    document
	.getElementById("angle_slider")
	.addEventListener("input", function(event) {
	    let radians = parseFloat(event.target.value);
	    radians_counter.innerText = radians;
	    make_global_rotor_from_sliders();
	});
    document
	.getElementById("yz_input")
	.addEventListener("input", function(_event) {
	    make_global_rotor_from_sliders();
	});
    document
	.getElementById("zx_input")
	.addEventListener("input", function(_event) {
	    make_global_rotor_from_sliders();
	});
    document
	.getElementById("xy_input")
	.addEventListener("input", function(_event) {
	    make_global_rotor_from_sliders();
	});


    let canvas = document.getElementById("andy_canvas");


    canvas.addEventListener("mousedown", function(event) {
	is_mouse_down = true;
	
	let x = event.clientX;
	let y = event.clientY;

	let rect = event.target.getBoundingClientRect();
	x = (x - rect.left - canvas.width / 2) / (canvas.width / 2);
	y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

	mouse_old_x = x;
	mouse_old_y = y;
	mouse_dx = 0;
	mouse_dy = 0;
    });

    canvas.addEventListener("mouseup", function(_event) {
	is_mouse_down = false;
    });

    canvas.addEventListener("mousemove", function(event) {
	if(!is_mouse_down){
	    return;
	}
	let x = event.clientX;
	let y = event.clientY;

	let rect = event.target.getBoundingClientRect();
	x = (x - rect.left - canvas.width / 2) / (canvas.width / 2);
	y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

	mouse_dx = x-mouse_old_x;
	mouse_dy = y-mouse_old_y;

	d_theta = Math.sqrt(mouse_dx*mouse_dx + mouse_dy*mouse_dy);
	
	mouse_old_x = x;
	mouse_old_y = y;
    });
    


}

function connectVariablesToGLSL() {
    u_GlobalMatrix = gl.getUniformLocation(program, "global_matrix");
    u_ModelMatrix = gl.getUniformLocation(program, "model_matrix");
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

    let position_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, CUBE_VERTS, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);

    
    gl.useProgram(program);

    gl.clearColor(0.2, 0.3, 0.5, 1.0);
    gl.enable(gl.DEPTH_TEST);
}

function render(milis) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let animation_percent = (milis%3000)/3000;
    
    
    gl.uniform4fv(u_Color, new Float32Array([1.0, 1.0, 1.0, 1.0]));

    //let rot_mat = rotor_to_matrix(rotor_multiply(rotor_multiply(global_rotor, rot1), rot2));
    if((mouse_dx*mouse_dx + mouse_dy*mouse_dy) > 0){
	//negate the dy because on the canvas positive Y is down instead of up
	global_rotor = rotor_multiply(make_rotation_rotor(d_theta, normalize_vec_or_bivec([mouse_dy, -mouse_dx, 0])), global_rotor);
	update_sliders();
    }
        
    let rot_mat = rotor_to_matrix(global_rotor);
    set_matrix(u_GlobalMatrix, matrix_multiply(
	rot_mat, make_scale_matrix(0.2, 0.2, 0.2)
    ));
    
    draw_animal(animation_percent);
}


function draw_animal(animation_percent){
    let identity = make_translation_matrix(0, 0, 0);
    
    let body_matrix = draw_body(animation_percent, identity);

    let tail_matrix_1 = draw_tail_1(animation_percent, body_matrix);
}

function draw_body(animation_percent, matrix_stack){
    gl.uniform4fv(u_Color, new Float32Array([1.0, 0.0, 0.0, 1.0]));

    let translate_matrix = matrix_stack;
    let rotate_matrix = rotor_to_matrix(make_rotation_rotor(Math.sin(animation_percent * TAU)/2, [0, 0, 1]));
    let scale_matrix = make_scale_matrix(2, 1, 1);

    let move_matrix = matrix_multiply(translate_matrix, rotate_matrix);
    
    let matrix = matrix_multiply(move_matrix, scale_matrix);
    draw_cube(
	matrix
    );
    return move_matrix;
}

function draw_tail_1(animation_percent, matrix_stack){
    gl.uniform4fv(u_Color, new Float32Array([0.0, 1.0, 0.0, 1.0]));

    let translate_matrix = matrix_multiply(matrix_stack, make_translation_matrix(0, 1, 0.1));
    let rotate_matrix = rotor_to_matrix(make_rotation_rotor((TAU/2) + Math.sin(animation_percent * TAU)/3, [0, 0, 1]));
    let scale_matrix = make_scale_matrix(1, 0.2, 0.8);

    let move_matrix = matrix_multiply(translate_matrix, rotate_matrix);
    
    let matrix = matrix_multiply(move_matrix, scale_matrix);
    draw_cube(
	matrix
    );
    return move_matrix;
}


function draw_cube(model_matrix){
    set_matrix(u_ModelMatrix, model_matrix);
    
    gl.drawArrays(gl.TRIANGLES, 0, NUM_CUBE_VERTS);
}
    
    
function set_matrix(unif, matrix) {
    let flattened_matrix = Array(16).fill().map((_, index) => {
	return matrix[index % 4][Math.trunc(index / 4)]
    });
    
    gl.uniformMatrix4fv(unif, false, flattened_matrix);
}

function make_translation_matrix(dx, dy, dz) {
    return [
	[1.0, 0.0, 0.0, dx],
	[0.0, 1.0, 0.0, dy],
	[0.0, 0.0, 1.0, dz],
	[0.0, 0.0, 0.0, 1.0]
    ];
}

function make_scale_matrix(x, y, z) {
    return [
	[x, 0.0, 0.0, 0],
	[0.0, y, 0.0, 0],
	[0.0, 0.0, z, 0],
	[0.0, 0.0, 0.0, 1.0]
    ];
}

function normalize_vec_or_bivec(vec){
    let magnitude = Math.sqrt(vec.map((x) => x*x).reduce((acc, x) => acc + x), 0);
    return vec.map((x) => x/magnitude)
}

function matrix_multiply(mat1, mat2){
    return Array(4).fill().map((_, row) => {
	return Array(4).fill().map((_, col) => {
	    let sum = 0;
	    for(let i = 0; i < 4; i++){
		sum += mat1[row][i] * mat2[i][col];
	    }
	    return sum;
	})
    });
}

function rotor_multiply([real1, bivector1], [real2, bivector2]){

    let real = real1*real2 - bivector1[0]*bivector2[0] - bivector1[1]*bivector2[1] - bivector1[2]*bivector2[2];
    let yz   = real1*bivector2[0] + bivector1[0]*real2 + bivector1[1]*bivector2[2] - bivector1[2]*bivector2[1]
    let zx   = real1*bivector2[1] + bivector1[1]*real2 + bivector1[2]*bivector2[0] - bivector1[0]*bivector2[2]
    let xy   = real1*bivector2[2] + bivector1[2]*real2 + bivector1[0]*bivector2[1] - bivector1[1]*bivector2[0]

    return [real, [yz, zx, xy]];
}

function make_rotation_rotor(radians, normalized_bivector_plane){
    let real = Math.cos(radians/2.0);
    let bivector = normalized_bivector_plane.map((num) => (Math.sin(radians/2.0) * num));

    return [real, bivector];
}

function rotor_to_matrix([real, bivector]){
    let w = real;
    let yz = bivector[0];
    let zx = bivector[1];
    let xy = bivector[2];
    // https://gabormakesgames.com/blog_quats_to_matrix.html
    return [
	[w*w + yz*yz - zx*zx - xy*xy, 2*yz*zx - 2*w*xy,            2*yz*xy + 2*w*zx,            0                          ],
	[2*yz*zx + 2*w*xy,            w*w - yz*yz + zx*zx - xy*xy, 2*zx*xy - 2*w*yz,            0                          ],
	[2*yz*xy - 2*w*zx,            2*zx*xy + 2*w*yz,            w*w - yz*yz - zx*zx + xy*xy, 0                          ],
	[0,                           0,                           0,                           w*w + yz*yz + zx*zx + xy*xy]
    ];
}


function update_sliders(){
    let [real, bivector] = global_rotor;
    let angle = 2 * Math.acos(real);
    document.getElementById("angle_slider").value = angle;
    document.getElementById("radians_counter").innerText = angle;
    document.getElementById("yz_input").value = bivector[0]/Math.sin(angle/2);
    document.getElementById("zx_input").value = bivector[1]/Math.sin(angle/2);
    document.getElementById("xy_input").value = bivector[2]/Math.sin(angle/2);

    
}

function make_global_rotor_from_sliders(){
    d_theta = 0;
    
    let global_rotation_angle = parseFloat(document.getElementById("angle_slider").value);
    let yz = parseFloat(document.getElementById("yz_input").value)
    let zx = parseFloat(document.getElementById("zx_input").value)
    let xy = parseFloat(document.getElementById("xy_input").value)
    
    let global_rotation_plane = normalize_vec_or_bivec([yz, zx, xy]);
    global_rotor = make_rotation_rotor(global_rotation_angle, global_rotation_plane);
}

const TRIANGLE_VERTS = new Float32Array([
    1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0,
]);

const NUM_TRIANGLE_VERTS = TRIANGLE_VERTS.length / 3;



const CUBE_VERTS = new Float32Array([
    0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0,

    0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0,
    0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0,

    0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0,
    1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0,

    1.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0,
    1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0,
    
    1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0,

    1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0,
    1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0,
]);

const NUM_CUBE_VERTS = CUBE_VERTS.length / 3;


let ANDY_VERTEX_SHADER_SOURCE = `
uniform mat4 global_matrix;
uniform mat4 model_matrix;
attribute vec3 attribute_model_position;
void main() {
gl_Position = global_matrix * model_matrix * vec4(attribute_model_position, 1.0);
}`;

let ANDY_FRAGMENT_SHADER_SOURCE = `
precision mediump float;
uniform vec4 color;
void main() {
gl_FragColor = color;
}`;


let TAU = Math.PI * 2;
