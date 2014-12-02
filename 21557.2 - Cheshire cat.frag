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



vec3 draw_sun(float density, vec2 position, vec2 mouse_pos, vec2 sun_pos, vec2 origin, float max_dist, float base_norm) {
	vec3 colour = vec3(0);
	float t = time;
	float rel_dist = length(sun_pos - mouse_pos) / max_dist;
	
	vec3 sun_colour1 = vec3(0.2, 0.0, 0.4);
	vec3 sun_colour2 = vec3(0.8, 1.0, 0.8980392156862745);
	vec3 sun_colour = pseudo_speckle2(position-sun_pos, sun_colour1, sun_colour2, (1.0-rel_dist)*mod(time*17.0,100.0));
	float sun_expon = 1000.0 * SQR(rel_dist) ; // + mod(time, 1.0) * 10.0;
	float sun_norm = base_norm + (0.0*(1.0-rel_dist))*sin(1e6 * mod(t, TAU));
	vec2 sun_distweights = vec2(0.5, 3.0);
	
	colour += draw_manifestation(position, max_dist, sun_pos, sun_colour, sun_expon, sun_norm, sun_distweights);
	
	return colour;
}


#define ELLIPSE_Y_INFUN_OF_X(X, A, B) ((1.0 - (SQR(X)/SQR(A))) * SQR(B))

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
	
	vec2 sun1_pos = vec2(-0.17, +0.15);
	vec2 sun2_pos = vec2(+0.17, +0.15);
	
	float mouth_xA = 0.42;
	float mouth_xB = 0.28;
	float mouth_xC = 0.15;
	float mouth_xD = 0.0;
	
	float relY = 0.1;
	float rel_dist = length(vec2(0) - mouse_pos) / max_dist;
	float ellipse_a = 0.10 + 0.10 * rel_dist;
	float ellipse_b = 0.1;	
	
	float mouth_yA = relY + ELLIPSE_Y_INFUN_OF_X(mouth_xA, ellipse_a, ellipse_b);
	float mouth_yB = relY + ELLIPSE_Y_INFUN_OF_X(mouth_xB, ellipse_a, ellipse_b);
	float mouth_yC = relY + ELLIPSE_Y_INFUN_OF_X(mouth_xC, ellipse_a, ellipse_b);
	float mouth_yD = relY + ELLIPSE_Y_INFUN_OF_X(mouth_xD, ellipse_a, ellipse_b);
	
	
	vec2 sun3_pos = vec2(-mouth_xA,  -mouth_yA);
	vec2 sun4_pos = vec2(-mouth_xB,  -mouth_yB);
	vec2 sun5_pos = vec2(-mouth_xC,  -mouth_yC);
	vec2 sun6_pos = vec2( mouth_xD,  -mouth_yD);
	vec2 sun7_pos = vec2(+mouth_xC,  -mouth_yC);
	vec2 sun8_pos = vec2(+mouth_xB,  -mouth_yB);
	vec2 sun9_pos = vec2(+mouth_xA,  -mouth_yA);
	
	
	float eyes_basenorm = 0.6;
	float mouth_basenorm = 0.9;
	colour += draw_sun(density, position, mouse_pos, sun1_pos, origin, max_dist, eyes_basenorm);
	colour += draw_sun(density, position, mouse_pos, sun2_pos, origin, max_dist, eyes_basenorm);
	colour += draw_sun(density, position, mouse_pos, sun3_pos, origin, max_dist, mouth_basenorm);
	colour += draw_sun(density, position, mouse_pos, sun4_pos, origin, max_dist, mouth_basenorm);
	colour += draw_sun(density, position, mouse_pos, sun5_pos, origin, max_dist, mouth_basenorm);
	colour += draw_sun(density, position, mouse_pos, sun6_pos, origin, max_dist, mouth_basenorm);
	colour += draw_sun(density, position, mouse_pos, sun7_pos, origin, max_dist, mouth_basenorm);
	colour += draw_sun(density, position, mouse_pos, sun8_pos, origin, max_dist, mouth_basenorm);
	colour += draw_sun(density, position, mouse_pos, sun9_pos, origin, max_dist, mouth_basenorm);;
	
	colour.x = MIN(1.0, colour.x);
	colour.y = MIN(1.0, colour.y);
	colour.z = MIN(1.0, colour.z);
	gl_FragColor = vec4(colour, 0);
}
