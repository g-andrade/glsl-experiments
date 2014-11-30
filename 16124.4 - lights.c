#ifdef GL_ES
precision mediump float;
#endif

uniform vec2  resolution;
uniform float time;
uniform sampler2D backbuffer;

const float PI = 3.14159265359;
const int num_x = 5;
const int num_y = 5;
float w = resolution.x;
float h = resolution.y;
 
vec4 draw_ball(int i, int j) {
	float t = time;
	float sin_t = sin(t);
	float cos_t = cos(t);
	float tan_t = tan(t);
	
	
	float x_offset = 1.0;
	float x_amp = 0.2;
	float x_angle = (t/2.0);
	float x_phase = float(3*i + 4*j);
	
	float y_offset = 1.0;
	float y_amp = 0.2;
	float y_angle = (t);
	float y_phase = float(3*i + 4*j);
	
	
	float int_mult = 2.0;
	float int_exp = 2.5 + cos_t;
	
	float size_offset = 3.0;
	float size_amp = -2.0;
	float size_angle = 0.0;
	float size_phase = 0.0;
	
	
	float red_offset = 0.5;
	float red_amp = 1.0;
	float red_angle = t + float(i);
	float red_phase = 0.0;
	
	float green_offset = 0.5;
	float green_amp = 1.0;
	float green_angle = t + float(i);
	float green_phase = PI / 1.0;
	
	float blue_offset = 0.1;
	float blue_amp = 0.0;
	float blue_angle = 0.0;
	float blue_phase = 0.0;
	
	
	float x = w/2.0 * (x_offset + (x_amp*cos(x_angle + x_phase)));
	float y = h/2.0 * (y_offset + (y_amp*sin(y_angle + y_phase)));
	float size = size_offset + (size_amp * sin(size_angle + size_phase));
	vec2 pos = vec2(x, y);
	float dist = length(gl_FragCoord.xy - pos);
	float intensity = int_mult * pow(size/dist, int_exp);
	vec4 color = vec4(0.0);
	color.r = red_offset + (red_amp * cos(red_angle + red_phase));
	color.g = green_offset + (green_amp * sin(green_angle + green_phase));
	color.b = blue_offset + (blue_amp * sin(blue_angle + blue_phase));
	return color*intensity;
}


void main() {
	vec4 color = vec4(0.0);
	for (int i = 0; i < num_x; ++i) {
		for (int j = 0; j < num_y; ++j) {
			color += draw_ball(i, j);
		}
	}
	vec2 texPos = vec2(gl_FragCoord.xy/resolution);
	vec4 shadow = texture2D(backbuffer, texPos)*0.7;
	gl_FragColor = color + shadow;
}

