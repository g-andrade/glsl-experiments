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
#define MAX_HUMANOID_COUNT 10
#define SPAWNING_TIMESPAN 10.0




float weighted_length_2(vec2 v1, vec2 v2, vec2 weights) {
	vec2 diffs = v2 - v1;
	return sqrt(weights.x*SQR(diffs.x) + weights.y*SQR(diffs.y));
}


float skewed_inv_distance(float dist, float max_dist, float expon, float norm_val) {
	norm_val = MAX(0.0, MIN(0.1, norm_val/10.0));
	float norm_factor = 0.9 + norm_val;
	float inv_dist = max_dist - dist;
	float norm = norm_factor * (inv_dist / max_dist);
	float max_norm = norm_factor;
	float distorted = pow(norm/max_norm, expon);
	float max_distorted = pow(max_norm, expon);
	return MAX(0.0, MIN(1.0, (distorted / max_distorted)));
}



vec3 draw_manifestation(
		vec2 pos, float max_dist, vec2 manif_pos, vec3 colour,
		float magic_expon, float magic_norm, vec2 dist_weights) 
{
	//float dist = length(pos - manif_pos);
	float dist = weighted_length_2(pos, manif_pos, dist_weights);
	float distweight = skewed_inv_distance(dist, max_dist, magic_expon, magic_norm);
	return distweight * colour;
}


vec3 pseudo_speckle2(vec2 position, vec3 colour1, vec3 colour2, float freq) {
	float dist = weighted_length_2(position, vec2(0, 0), vec2(1.0, 1.0));
	float factor = 0.5 + 0.5*SQR(SQR(cos(freq * dist * TAU)));
	factor = MAX(0.0, MIN(1.0, factor));
	return (factor * colour1) + ((1.0 - factor) * colour2);
}



vec3 draw_sun(float density, vec2 position, vec2 mouse_pos, vec2 sun_pos, vec2 origin, float max_dist) {
	vec3 colour = vec3(0);
	float t = time;
	float rel_dist = length(sun_pos - mouse_pos) / max_dist;
	
	vec3 sun_colour1 = vec3(0.9921568627450981, 0.7215686274509804, 0.07450980392156863);
	vec3 sun_colour2 = vec3(0.611764705882353, 0.16470588235294117, 0.0);
	vec3 sun_colour = pseudo_speckle2(position-sun_pos, sun_colour1, sun_colour2, 1.0+sin(mod(t, TAU)));
	float sun_expon = 100.0 * rel_dist ; // + mod(time, 1.0) * 10.0;
	float sun_norm = 0.1 + (0.02*(1.0-rel_dist))*sin(1e5 * mod(t, TAU));
	vec2 sun_distweights = vec2(1.0);
	
	colour += draw_manifestation(position, max_dist, sun_pos, sun_colour, sun_expon, sun_norm, sun_distweights);
	
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
	
	vec2 mouse_pos = (mouse - ( gl_FragCoord.xy / (resolution) )) * surfaceSize + surfacePosition;
	//mouse_pos /= 2.0;
	mouse_pos.x *= ratios.x;
	mouse_pos.y *= ratios.y;
		
	vec2 origin = -ratios / 2.0;
	vec2 arch_origin = -origin;
	float max_dist = max(ratios.x, ratios.y);
	vec3 colour = vec3(0, 0, 0);
	
	vec2 sun_pos = vec2(0);
	colour += draw_sun(density, position, mouse_pos, sun_pos, origin, max_dist);
	// yessssss
	/*int humanoid_count = int(float(MAX_HUMANOID_COUNT) * MIN(1.0, (time / SPAWNING_TIMESPAN)));
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
			colour += draw_humanoid(density, position, origin, max_dist, left_iter, height);
			if (i > humanoid_count)
				break;
		}
	}*/
	
	colour.x = MIN(1.0, colour.x);
	colour.y = MIN(1.0, colour.y);
	colour.z = MIN(1.0, colour.z);
	gl_FragColor = vec4(colour, 0);
}
