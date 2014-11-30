#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

#define MIN(a,b) ((a) < (b) ? (a) : (b))
#define MAX(a,b) ((a) > (b) ? (a) : (b))
#define PI 3.14159265359
#define TAU 6.28318530718
#define MAX_HUMANOID_COUNT 10
#define SPAWNING_TIMESPAN 10.0

float skewed_inv_distance(float dist, float max_dist, float expon) {
	float norm_factor = 1.0;
	float inv_dist = max_dist - dist;
	float norm = norm_factor * (inv_dist / max_dist);
	float max_norm = norm_factor;
	float distorted = pow(norm/max_norm, expon);
	float max_distorted = pow(max_norm, expon);
	return MAX(0.0, MIN(1.0, (distorted / max_distorted)));
}



vec4 draw_manifestation(vec2 pos, float max_dist, vec2 manif_pos, vec4 colour, float magic_expon) {
	float dist = length(pos - manif_pos);
	float distweight = skewed_inv_distance(dist, max_dist, magic_expon);
	return distweight * colour;
}


vec4 draw_humanoid(float density, vec2 position, vec2 origin, float max_dist, float rel_left, float height) {
	float left = origin.x + rel_left;
	vec2 feet_pos = vec2(left, origin.y);
	float head_h_dist = 0.0;
	float head_v_dist = height;
	float arm_h_dist = height / 3.0;
	float arm_v_dist = 0.7 * height;
	float foot_h_dist = height / 8.0;
	float foot_v_dist = 0.1 * height;
	vec4 colour = vec4(0, 0, 0, 0);
	float magic_expon_base_angle = mod(time, TAU);
	float magic_expon_angle = mod(TAU * 0.2 * magic_expon_base_angle, TAU);
	float magic_expon = 300.0 + (250.0*sin(magic_expon_angle));
	
	// dance!
	float d_wave_param = mod(TAU*time + (50.0*position.x), TAU);
	head_h_dist += MAX(density, (0.05 * head_h_dist)) * sin(d_wave_param);
	head_v_dist += (0.05 * head_v_dist) * sin(d_wave_param);
	arm_v_dist += (0.1 * arm_v_dist) * sin(d_wave_param);
	foot_h_dist += (0.1 * foot_h_dist) * sin(d_wave_param);
	foot_v_dist += (0.1 * foot_v_dist) * sin(d_wave_param);
	
	// somewhere over
	float r_red_param = mod(TAU*time + position.x*17.0, TAU);
	float r_green_param = mod(TAU*time + position.x*11.0, TAU);
	float r_blue_param = mod(TAU*time + position.x*43.0, TAU);
	float r_red = 0.5 + 0.5*sin(r_red_param);
	float r_green = 0.5 + 0.5*sin(r_green_param);
	float r_blue = 0.5 + 0.5*sin(r_blue_param);	
	vec4 rainbow_pick = vec4(r_red, r_green, r_blue, 0);
	
	
	// head
	vec2 head_pos = feet_pos + vec2(head_h_dist, head_v_dist);
	colour += draw_manifestation(position, max_dist, head_pos, rainbow_pick, magic_expon);	
	
	// left arm
	vec2 larm_pos = feet_pos + vec2(-arm_h_dist, arm_v_dist);
	colour += draw_manifestation(position, max_dist, larm_pos, rainbow_pick, magic_expon*2.0);
	
	// right arm
	vec2 rarm_pos = feet_pos + vec2(arm_h_dist, arm_v_dist);
	colour += draw_manifestation(position, max_dist, rarm_pos, rainbow_pick, magic_expon*2.0);
	
	// left foot
	vec2 lfoot_pos = feet_pos + vec2(-foot_h_dist, foot_v_dist);
	colour += draw_manifestation(position, max_dist, lfoot_pos, rainbow_pick, magic_expon*2.0);
	
	// right foot
	vec2 rfoot_pos = feet_pos + vec2(foot_h_dist, foot_v_dist);
	colour += draw_manifestation(position, max_dist, rfoot_pos, rainbow_pick, magic_expon*2.0);
	
	return colour;
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
	vec2 origin = -ratios / 2.0;
	vec2 arch_origin = -origin;
	float max_dist = max(ratios.x, ratios.y);
	vec4 color = vec4(0, 0, 0, 0);
	
	// yessssss
	int humanoid_count = int(float(MAX_HUMANOID_COUNT) * MIN(1.0, (time / SPAWNING_TIMESPAN)));
	if (humanoid_count > 0) {
		float horiz_span = arch_origin.x - origin.x;
		float left_iter = 0.0;
		for (int i=0; i < MAX_HUMANOID_COUNT; i++) {
			float height_base_angle = mod(time/4.0, TAU);
			float height_angle = mod((5.0 + 4.0*abs(tan(height_base_angle)))*position.x, TAU);
			float height_ratio = 0.04;
			height_ratio += (height_ratio/8.0) * sin(height_angle);
			float height = height_ratio * max_dist;
			left_iter = (float(i) / float(humanoid_count-1)) * horiz_span;
			color += draw_humanoid(density, position, origin, max_dist, left_iter, height);
			if (i > humanoid_count)
				break;
		}
	}
	
	color.x = MIN(1.0, color.x);
	color.y = MIN(1.0, color.y);
	color.z = MIN(1.0, color.z);
	color.a = MIN(1.0, color.a);
	gl_FragColor = color;
}
