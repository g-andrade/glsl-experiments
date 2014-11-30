#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

#define SQR(x) ((x)*(x))
#define MIN(a,b) ((a) < (b) ? (a) : (b))
#define MAX(a,b) ((a) > (b) ? (a) : (b))
#define PI 3.14159265359
#define TAU 6.28318530718
#define SQRT_TWO 1.41421356237

#define COLOURS_BLOODRED vec4(0.5411764705882353, 0.03137254901960784, 0.03137254901960784, 1.0)
#define COLOURS_ORANGE vec4(0.8901960784313725, 0.5490196078431373, 0.17647058823529413, 1.0)
#define COLOURS_BLACK vec4(0, 0, 0, 10)

#define COLOUR1 COLOURS_BLOODRED
#define COLOUR2 (COLOURS_BLOODRED * 1.3)


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
	float dist_from_origin = length(position);
	
	// it's running out
	float tw_base_angle = time;
	float tw_angle1 = 0.35*TAU*tw_base_angle;
	float tw_angle2 = tw_angle1;
	float tw_phase1 = 0.0;
	float tw_phase2 = 0.13*TAU;
	float tw_expon = 20.0;
	float time_weight = 0.7 + 0.3*MIN(1.0, pow(sin(tw_angle1+tw_phase1), tw_expon) + pow(sin(tw_angle2+tw_phase2), tw_expon));

	// what's at the end of the tunnel?
	float d_val = dist_from_origin;
	float d_max_val = sqrt(SQR(ratios.x) + SQR(ratios.y)) / 2.0;
	float dist_weight = pow((d_max_val - d_val) / d_max_val, 4.0);
	
	// such spiral. much void. wow.
	if (position.x != 0.0) {
		float s_angle = degrees( atan(position.y, position.x) );
		float s_amod = mod(abs(s_angle + (22.0*time) - 320.0*log(dist_from_origin)), 30.0);
	
		float s_amod_threshold = 20.0;
		if (s_amod < s_amod_threshold) {
			float norm_s_amod = s_amod / s_amod_threshold;
			vec4 colour1 = COLOUR1;
			vec4 colour2 = COLOUR2;
			gl_FragColor = dist_weight * time_weight * ((colour1 * (1.0 - norm_s_amod)) + (colour2 * norm_s_amod));
			return;
		}
	}
	gl_FragColor = dist_weight * time_weight * COLOUR1;
	
	
	
    /*float angle = 0.0 ;
    float radius = length(position) ;
    if (position.x != 0.0 && position.y != 0.0){
        angle = degrees(atan(position.y,position.x)) ;
    }
    float amod = mod(angle+30.0*time-120.0*log(radius), 30.0) ;
    if (amod<15.0){
        gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
    } else{
        gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 );                    
    }*/
}
