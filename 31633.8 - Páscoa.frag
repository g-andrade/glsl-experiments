#ifdef GL_ES
precision mediump float;
#endif

#extension GL_OES_standard_derivatives : enable


#define OCT_PI 0.39269908169875
#define QUARTER_PI 0.7853981633975
#define HALF_PI 1.570796326795
#define PI 3.14159265359
#define TAU 6.28318530718

#define SQR(x) ((x)*(x))
#define MIN(a,b) ((a) < (b) ? (a) : (b))
#define MAX(a,b) ((a) > (b) ? (a) : (b))
#define IS_IN_MARGIN(value, reference, margin) ((value) <= ((reference) + ((margin) / 2.0)) && (value) >= ((reference) - ((margin) / 2.0)))
#define RETURN_IF_HIDDEN(z_order) if ((z_order) > rendering_point.z_order) return;
#define RENDER(z_order, c) {rendering_point.color = c; rendering_point.z_order = z_order;}

#define RED(intensity) vec4((intensity), 0.0, 0.0, 0.0)
#define GREEN(intensity) vec4(0.0, (intensity), 0.0, 0.0)
#define BLUE(intensity) vec4(0.0, 0.0, (intensity), 0.0)
#define YELLOW(intensity) (RED((intensity)) + GREEN((intensity)))
#define PURPLE(intensity) (RED((intensity)) + BLUE((intensity)))
#define BLACK vec4(0.0, 0.0, 0.0, 0.0)
#define WHITE(intensity) ((RED((intensity)) + GREEN((intensity)) + BLUE((intensity))))

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
vec2 frag_position;
float screen_YX_ratio;
float screen_XY_ratio;
vec2 mouse_position;

struct {
    vec4 color;
    int z_order;
} rendering_point;

void initialize_globals() {
    vec2 prop_center_position = gl_FragCoord.xy - (resolution.xy / 2.0);
    vec2 prop_center_rel_position = prop_center_position / resolution.xy;
    vec2 prop_position = prop_center_rel_position;
    screen_YX_ratio = resolution.y / resolution.x;
    screen_XY_ratio = resolution.x / resolution.y;
    if (screen_YX_ratio > 1.0) {
        frag_position = vec2(prop_position.x, prop_position.y * screen_YX_ratio);
    }
    else {
        frag_position = vec2(prop_position.x * screen_XY_ratio, prop_position.y);
    }
    rendering_point.color = vec4(0.0, 0.0, 0.0, 0.0);
    rendering_point.z_order = 0;
    mouse_position = mouse.xy - vec2(0.5, 0.5);
}

/////////////////////////////////////////////////////////////////////
// creepiness

vec4 creepify_color_timed_bw(vec4 color) {
    float time_modulus = mod(time, 2.0 * PI);
    float r = ((1.0 + sin(3. * time_modulus * (0.5 - length(mouse_position)))) / 2.0) * color.x;
    /*float g = ((1.0 + sin(333.3 * time_modulus * (0.5 - length(mouse_position))) / 2.0)) * color.y;
    float b = ((1.0 * sin(77.7 * time_modulus * (0.5 - length(mouse_position))) / 2.0)) * color.z;*/
    float g = color.y;
    float b = color.z;
    return vec4(r, g, b, 0.0);
    /*float l = (r * 0.2126) + (g * 0.7152) + (b * 0.0722);
    vec4 l_color = vec4(l, l, l, 0);
    float weight = (sin(time * 30.0) + 1.0) / 2.0;
    return (color * weight) + (l_color * (1.0 - weight));*/
}

vec4 creepify_color(vec4 color) {
    //return creepify_color_timed_bw(color);
    return color;
}

float creepify_vec2_length(vec2 vector) {
    float time_modulus = mod(time, 2.0 * PI);
    float len = length(vector);
    float variance = 0.1 * len;
    float timed_variance_weight = SQR(SQR(1.3 * sin(1.0 * time_modulus))); // + sin(time * 7.0);
    float location_variance_weight = sin(length(frag_position * resolution));
    float variance_weight = timed_variance_weight * location_variance_weight;
    return len + (variance * variance_weight);
}

float creepify_atan(vec2 vector) {
    float time_modulus = mod(time, 2.0 * PI);
    return tan(QUARTER_PI + (SQR(1.0 * (0.5 - length(mouse_position))) * time_modulus)) * atan(abs(vector.y) / abs(vector.x));
}

/////////////////////////////////////////////////////////////////////
// vectors

float vec2_length(vec2 v) {
    return creepify_vec2_length(v);
}

float vec2_angle(vec2 v) {
   float baseAngle = 0.0;
   if (v.x != 0.0) {
      //baseAngle = atan(abs(v.y) / abs(v.x));
      baseAngle = creepify_atan(v);
   }
   else {
      baseAngle = HALF_PI;
   }

   // Why doesn't atan(y, x) work properly? Jesus.
   if (v.x < 0.0) {
      if (v.y < 0.0)
         baseAngle += PI;
      else
         baseAngle = PI - baseAngle;
   }
   else if (v.y < 0.0)
      baseAngle = -baseAngle;

   return baseAngle;
}

vec2 vec2_from_angle(float angle, float magnitude) {
    return vec2(magnitude * cos(angle), magnitude * sin(angle));
}

vec2 vec2_rotate(vec2 v, float rotation_angle) {
    return vec2_from_angle(vec2_angle(v) - rotation_angle, vec2_length(v));
}


/////////////////////////////////////////////////////////////////////
// colors


/////////////////////////////////////////////////////////////////////
// circles

void draw_circle(int z_order, vec2 circle_position, float radius, vec4 base_color) {
    RETURN_IF_HIDDEN(z_order);
    if (vec2_length(frag_position - circle_position) <= radius) {
        RENDER(z_order, base_color);
    }
}

void draw_circumference(int z_order, vec2 circle_position, float radius, float thickness, vec4 base_color) {
    RETURN_IF_HIDDEN(z_order);
    float value = vec2_length(frag_position - circle_position);
    if (IS_IN_MARGIN(value, radius, thickness)) {
        RENDER(z_order, base_color);
    }
}

/////////////////////////////////////////////////////////////////////
// ellipses

float ellipse_value(vec2 ellipse_position, float a, float b, float rotation_angle) {
    vec2 position = vec2_rotate(frag_position - ellipse_position, rotation_angle);
    return ((SQR(position.x / a)) + (SQR(position.y / b)));
}

void draw_ellipse(int z_order, vec2 ellipse_position, float a, float b, float rotation_angle, vec4 base_color) {
    RETURN_IF_HIDDEN(z_order);
    float value = ellipse_value(ellipse_position, a, b, rotation_angle);
    if (value <= 1.0) {
        RENDER(z_order, base_color);
    }
}

void draw_ellipse_border(int z_order, vec2 ellipse_position, float a, float b, float thickness_constant, float rotation_angle, vec4 base_color) {
    RETURN_IF_HIDDEN(z_order);
    float value = ellipse_value(ellipse_position, a, b, rotation_angle);
    if (IS_IN_MARGIN(value, 1.0, thickness_constant)) {
        RENDER(z_order, base_color);
    }
}

/////////////////////////////////////////////////////////////////////
// rectangles

void draw_rectangle(int z_order, vec2 rectangle_position, vec2 dimensions, float rotation_angle, vec4 base_color) {
    RETURN_IF_HIDDEN(z_order);
    vec2 position = vec2_rotate(frag_position - rectangle_position, rotation_angle);
    if ((position.x >= (-dimensions.x / 2.0)) &&
        (position.x <= (dimensions.x / 2.0)) &&
        (position.y >= (-dimensions.y / 2.0)) &&
        (position.y <= (dimensions.y / 2.0)))
    {
        RENDER(z_order, base_color);
    }

}


/////////////////////////////////////////////////////////////////////
// easter
void draw_rabbit_ear(int z_order, vec2 rabbit_position, float rabbit_size, float rabbit_rotation, bool is_left) {
    float ear_rotation = (is_left ? HALF_PI / 3.0 : 11.0 * HALF_PI / 3.0);
    float ear_size = rabbit_size * 0.3;
    vec2 ear_vec = (is_left ?
            vec2_rotate(vec2(-ear_size * 1.4, 0.0 * rabbit_size), rabbit_rotation) :
            vec2_rotate(vec2(ear_size * -0.3, 0.29 * rabbit_size), rabbit_rotation))
            + vec2_from_angle(ear_rotation + rabbit_rotation, ear_size);
    vec2 ear_position = rabbit_position + ear_vec;
    float ear_ellipse_a = 0.2;
    float ear_ellipse_b = 0.9;
    draw_ellipse_border(z_order, ear_position, ear_ellipse_a * ear_size,
                ear_ellipse_b * ear_size, 0.1, ear_rotation, YELLOW(1.0));

    float inner_ellipse_ratio = 0.3;
    draw_ellipse_border(z_order, ear_position,
                ear_ellipse_a * ear_size * inner_ellipse_ratio,
                ear_ellipse_b * ear_size * inner_ellipse_ratio,
                0.05, ear_rotation, PURPLE(0.5));

    vec2 rectangle_dimensions = vec2(ear_size, ear_size) * MAX(ear_ellipse_a, ear_ellipse_b) * 1.5;
    draw_rectangle(z_order - 1,
               ear_position + vec2_from_angle(ear_rotation + rabbit_rotation - HALF_PI, ear_size * 0.8),
               rectangle_dimensions,
               ear_rotation,
               BLACK);
}

void draw_rabbit_eye(int z_order, vec2 rabbit_position, float rabbit_size, float rabbit_rotation) {
    draw_circumference(z_order,
               rabbit_position,
               rabbit_size * 0.08,
               0.06 * rabbit_size,
               WHITE(0.7));
    draw_circle(z_order,
            rabbit_position + vec2_from_angle(vec2_angle(mouse_position - rabbit_position), 0.01),
            rabbit_size * 0.01,
            RED(0.5));

}

void draw_rabbit_mouth(int z_order, vec2 rabbit_position, float rabbit_size, float rabbit_rotation) {
    float mouth_size = 0.1 * rabbit_size;
    vec2 mouth_position = rabbit_position + vec2_from_angle((1.5 * PI) + rabbit_rotation, mouth_size * 2.0);
    float mouth_ellipse_a = 0.3 * mouth_size;
    float mouth_ellipse_b = 1.7 * mouth_size;
    draw_ellipse_border(z_order,
                mouth_position,
                mouth_ellipse_a,
                mouth_ellipse_b,
                mouth_size,
                HALF_PI,
                PURPLE(1.0));
    float tongue_factor = 0.3;
/*  draw_ellipse(z_order,
             mouth_position - (vec2(0.0, 0.023) * rabbit_size),
             mouth_ellipse_a * tongue_factor,
             mouth_ellipse_b * tongue_factor,
             HALF_PI,
             PURPLE(1.0));*/
}

void draw_rabbit(int z_order, vec2 rabbit_position, float rabbit_size, float rabbit_rotation) {
    draw_rabbit_eye(z_order - 10, rabbit_position, rabbit_size, rabbit_rotation);
    draw_rabbit_ear(z_order, rabbit_position, rabbit_size, rabbit_rotation, true);
    draw_rabbit_ear(z_order, rabbit_position, rabbit_size, rabbit_rotation, false);
    draw_rabbit_mouth(z_order - 10, rabbit_position, rabbit_size, rabbit_rotation);
}

/////////////////////////////////////////////////////////////////////
// DO IT

void main( void ) {
    initialize_globals();
    //draw_circle(vec2(0, 0), 0.2);
    /*draw_ellipse_border(-50, vec2(0.0, 0.0), 0.1, 0.4, 0.1, - HALF_PI / 2.0, RED(1.0));
    draw_ellipse(-49, vec2(0.0, 0.0), 0.01, 0.2, HALF_PI / 2.0, YELLOW(1.0));*/
    draw_rabbit(-10, vec2(0.0, 0), 0.8, 0.0);
    gl_FragColor = creepify_color(rendering_point.color);
}
