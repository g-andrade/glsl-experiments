#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
uniform vec2 surfaceSize;
varying vec2 surfacePosition;

#define SQR(x) ((x)*(x))
#define MIN(a,b) ((a) < (b) ? (a) : (b))
#define MAX(a,b) ((a) > (b) ? (a) : (b))
#define PI 3.14159265359
#define TAU 6.28318530718
#define SQRT_TWO 1.41421356237
#define DEG_TO_RAD(x) ((x)*TAU / 180.0)

#define COLOURS_BACKGROUND vec4(0.6, 0.7, 0.9, 0)
#define COLOURS_FACE_BORDER vec4(0, 0, 0, 0)
#define COLOURS_EYE_BORDER vec4(0.2, 0.2, 0.2, 0)
#define COLOURS_IRIS vec4(0.54, 0.27, 0.07, 0)
#define COLOURS_MOUTH_BORDER vec4(0, 0, 0, 0)
#define COLOURS_TOOTH vec4(0, 0, 0, 0)

#define FACE_SIZE 0.2
#define FACE_HALF_SIZE (FACE_SIZE / 2.0)
#define FACE_RADIUS (SQRT_TWO * FACE_HALF_SIZE)
#define FACE_BWIDTH 0.003
#define FACE_HALF_BWIDTH (FACE_BWIDTH / 2.0)

#define EYES_L_RPOS vec2(-FACE_HALF_SIZE * (1.0/2.2), FACE_HALF_SIZE * (1.0/2.0))
#define EYES_R_RPOS vec2(+FACE_HALF_SIZE * (1.0/2.2), FACE_HALF_SIZE * (1.0/2.0))
#define EYES_SIZE (FACE_SIZE / 5.0)
#define EYES_HALF_SIZE (EYES_SIZE / 2.0)
#define EYES_BWIDTH 0.003
#define EYES_HALF_BWIDTH (EYES_BWIDTH / 2.0)

#define IRIS_SIZE (EYES_SIZE / 3.0)
#define IRIS_HALF_SIZE (IRIS_SIZE / 2.0)
#define IRIS_MAX_OFFSET (EYES_HALF_SIZE - IRIS_HALF_SIZE)
#define IRIS_HAPPY_MOV_AMPL_L 3.0
#define IRIS_HAPPY_MOV_AMPL_R 7.0
#define IRIS_HAPPY_MOV_AMPL_ANGLE_FREQ 1.0
#define IRIS_HAPPY_MOV_ANGLE_FREQ 1.0
#define IRIS_HAPPY_MOV_ABS_SIGN_MULT 0.9

#define MOUTH_RPOS vec2(0.0, -FACE_HALF_SIZE * (2.0/5.0))
#define MOUTH_ELLIPSE_A (FACE_SIZE / 3.0)
#define MOUTH_ELLIPSE_B (FACE_SIZE / 5.0)
#define MOUTH_ELLIPSE_HALF_B (MOUTH_ELLIPSE_B / 2.0)
#define MOUTH_BWIDTH 0.003
#define MOUTH_HALF_BWIDTH (MOUTH_BWIDTH / 2.0)
#define MOUTH_HALF_BWIDTH_TOLERANCE (MOUTH_HALF_BWIDTH * 20.0)
#define MOUTH_HAPPY_FREQ 5.0
#define MOUTH_UNHAPPY_FREQ 0.2

#define TOOTH_SIZE (MOUTH_ELLIPSE_B * (2.0/8.0))
#define TOOTH_HALF_SIZE (TOOTH_SIZE / 2.0)
#define TOOTH_RPOS vec2(-MOUTH_ELLIPSE_A * (1.0/3.0), -TOOTH_HALF_SIZE)

#define PERSONAL_BUBBLE_RADIUS (FACE_RADIUS*2.0)


void draw_eye_iris(float density, vec2 position, vec2 mouse_pos, vec2 eye_pos, bool is_left_eye, bool is_happy) {
	vec2 iris_pos = eye_pos;
	if (is_happy) {
		float angle = mod(time, TAU);
		float mov_ampl = (is_left_eye ? IRIS_HAPPY_MOV_AMPL_L : IRIS_HAPPY_MOV_AMPL_R);
		float mov_angle_mult = MAX(0.0, (mov_ampl + ((mov_ampl / 2.0) * tan(IRIS_HAPPY_MOV_AMPL_ANGLE_FREQ * angle))));
		float mov_angle = mod(IRIS_HAPPY_MOV_ANGLE_FREQ * mov_angle_mult * angle, TAU);
		float sign_mult = (is_left_eye ? -IRIS_HAPPY_MOV_ABS_SIGN_MULT : IRIS_HAPPY_MOV_ABS_SIGN_MULT);
		iris_pos.x += (sign_mult * IRIS_MAX_OFFSET * cos(mov_angle));
		iris_pos.y += (sign_mult * IRIS_MAX_OFFSET * sin(mov_angle));
	}
	else {
		vec2 mouse_diffs = iris_pos - mouse_pos;
		float angle = atan(mouse_diffs.y / mouse_diffs.x);
		float mult = sign(mouse_diffs.x);
		iris_pos.x -= (mult * IRIS_MAX_OFFSET * cos(angle));
		iris_pos.y -= (mult * IRIS_MAX_OFFSET * sin(angle));
	}
	vec2 diffs = iris_pos - position;
	float radial_diff = sqrt(SQR(diffs.x) + SQR(diffs.y));
	if (radial_diff < IRIS_HALF_SIZE)
		gl_FragColor = COLOURS_IRIS;
}



void draw_eye(float density, vec2 position, vec2 mouse_pos, vec2 cretino_pos, bool is_left_eye, bool is_happy) {
	vec2 eye_pos = cretino_pos + (is_left_eye ? EYES_L_RPOS : EYES_R_RPOS);
	vec2 diffs = eye_pos - position;
	float radial_diff = sqrt(SQR(diffs.x) + SQR(diffs.y));
	if (radial_diff > (EYES_HALF_SIZE + EYES_HALF_BWIDTH))
		return;

	// eye border
	if (radial_diff >= (EYES_HALF_SIZE - EYES_HALF_BWIDTH))
		gl_FragColor = COLOURS_EYE_BORDER;
	
	draw_eye_iris(density, position, mouse_pos, eye_pos, is_left_eye, is_happy);
}



void draw_mouth(float density, vec2 position, vec2 cretino_pos, bool is_happy) {
	float ellipse_B = 0.0;
	float ellipse_halfB = 0.0;
	if (is_happy) {
		float angle = mod(time, TAU);
		float mouth_angle = mod(MOUTH_HAPPY_FREQ * angle, TAU);
		ellipse_B = MOUTH_ELLIPSE_B + (MOUTH_ELLIPSE_HALF_B * sin(mouth_angle));
		ellipse_halfB = ellipse_B / 2.0;	
	}
	else {
		ellipse_B = MOUTH_ELLIPSE_B * 2.0;
		ellipse_halfB = ellipse_B / 2.0;	
	}
	
	vec2 mouth_pos = cretino_pos + MOUTH_RPOS;
	mouth_pos.y += (is_happy ? MOUTH_ELLIPSE_HALF_B : -MOUTH_ELLIPSE_HALF_B);
	vec2 diffs = mouth_pos - position;
	float mouth_bwidth_cmptolerance = MAX(density*30.0, MOUTH_HALF_BWIDTH);
	float radial_diff = (SQR(diffs.x)/SQR(MOUTH_ELLIPSE_A)) 
		+ ((SQR(diffs.y)/SQR(ellipse_B)));

	if ((radial_diff > (1.0 + mouth_bwidth_cmptolerance))
	    || (is_happy && (diffs.y < 0.0)) || (!is_happy && (diffs.y > 0.0)))
		return;
	
	// mouth border	
	vec2 abs_diffs = abs(diffs);
	if ((abs_diffs.y <= MOUTH_HALF_BWIDTH) || (radial_diff >= (1.0 - mouth_bwidth_cmptolerance)))
		gl_FragColor = COLOURS_MOUTH_BORDER;
	
	// tooth
	if (is_happy) {
		vec2 tooth_pos = mouth_pos + TOOTH_RPOS;
		vec2 abs_tooth_diffs = abs(tooth_pos - position);
		if ((abs_tooth_diffs.x <= TOOTH_HALF_SIZE) && (abs_tooth_diffs.y <= TOOTH_HALF_SIZE)) {
			gl_FragColor = COLOURS_TOOTH;
		}
	}
	
}



void draw_cretino(float density, vec2 ratios, vec2 position, vec2 mouse_pos) {
	vec2 cretino_pos = vec2(0.0, 0.0);
	vec2 mouse_diffs = cretino_pos - mouse_pos;
	float mouse_radius = sqrt(SQR(mouse_diffs.x) + SQR(mouse_diffs.y));
	bool is_happy = (mouse_radius > PERSONAL_BUBBLE_RADIUS);
	
	if (!is_happy) {
		float angle = atan(mouse_diffs.y / mouse_diffs.x);
		float mult = sign(mouse_diffs.x);
		cretino_pos.x = mouse_pos.x + (mult * PERSONAL_BUBBLE_RADIUS * cos(angle));
		cretino_pos.y = mouse_pos.y + (mult * PERSONAL_BUBBLE_RADIUS * sin(angle));
/*		cretino_pos.x = MIN(0.5*ratios.x, MAX(-0.5*ratios.x, cretino_pos.x));
		cretino_pos.y = MIN(0.5*ratios.y, MAX(-0.5*ratios.y, cretino_pos.y));*/
	}
		
	
	float h_diff = abs(position.x - cretino_pos.x);
	float v_diff = abs(position.y - cretino_pos.y);
	if ((h_diff > (FACE_HALF_SIZE + FACE_HALF_BWIDTH) 
	     || (v_diff > (FACE_HALF_SIZE + FACE_HALF_BWIDTH))))
		return;

	// face border
	if (((h_diff >= (FACE_HALF_SIZE - FACE_HALF_BWIDTH))
	    && (h_diff <= (FACE_HALF_SIZE + FACE_HALF_BWIDTH)))
	    	||
	    ((v_diff >= (FACE_HALF_SIZE - FACE_HALF_BWIDTH))
	    && (v_diff <= (FACE_HALF_SIZE + FACE_HALF_BWIDTH))))
	{
		gl_FragColor = COLOURS_FACE_BORDER;
	}


	// face contents
	draw_eye(density, position, mouse_pos, cretino_pos, true, is_happy);
	draw_eye(density, position, mouse_pos, cretino_pos, false, is_happy);
	draw_mouth(density, position, cretino_pos, is_happy);
}


void main( void ) {
	float density;
	vec2 ratios;
	if (resolution.x > resolution.y) {
		density = 1.0 / resolution.y;
		ratios.x = resolution.x / resolution.y;
		ratios.y = 1.0;
	}
	else {
		density = 1.0 / resolution.x;
		ratios.y = resolution.y / resolution.x;
		ratios.x = 1.0;
	}
	
	vec2 position = ( (gl_FragCoord.xy - (resolution.xy/2.0)) / (resolution.xy) );
	position.x *= ratios.x;
	position.y *= ratios.y;

	vec2 mouse_pos = (mouse - ( gl_FragCoord.xy / (resolution) )) * surfaceSize + surfacePosition;
	//mouse_pos /= 2.0;
	mouse_pos.x *= ratios.x;
	mouse_pos.y *= ratios.y;
	
	gl_FragColor = COLOURS_BACKGROUND;
	draw_cretino(density, ratios, position, mouse_pos);
}
