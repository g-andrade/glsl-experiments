#ifdef GL_ES
precision mediump float;
#endif

#define OCT_PI 0.39269908169875
#define QUARTER_PI 0.7853981633975
#define HALF_PI 1.570796326795
#define PI 3.14159265359
#define TAU 6.28318530718

#define SQR(x) ((x)*(x))
#define MIN(a,b) ((a) < (b) ? (a) : (b))
#define MAX(a,b) ((a) > (b) ? (a) : (b))

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

float xyRatio;
vec2 fragPosition;
float timeAngle;
vec2 mousePosition;

/* based on old code */
float weighted_length_2(vec2 v1, vec2 v2, vec2 weights) {
   vec2 diffs = v2 - v1;
   return sqrt(weights.x*SQR(diffs.x) + weights.y*SQR(diffs.y));
}

vec4 pseudo_speckle2(vec2 position, vec4 colour1, vec4 colour2, float freq) {
   float dist = weighted_length_2(position, vec2(0, 0), vec2(1.0, 1.0));
   float factor = 0.1 + 0.9*SQR(SQR(cos(freq * dist * TAU)));
   factor = MAX(0.0, MIN(1.0, factor));
   return (factor * colour1) + ((1.0 - factor) * colour2);
}
/*************************************************/


void intializeGlobals() {
   xyRatio = resolution.x / resolution.y;
   fragPosition = gl_FragCoord.xy / resolution.xy;
   timeAngle = time;
   mousePosition = mouse.xy;
}

float modAngle(float angle) {
   float moddedAngle = sign(angle) * mod(abs(angle), TAU);
   if (moddedAngle < 0.0)
      moddedAngle += TAU;
   return moddedAngle;
}

float steppedValue(float value, float stepSize) {
   return stepSize * floor(value / stepSize);
}

vec2 normVec2(float magnitude, float angle) {
   float x = magnitude * cos(angle) / xyRatio;
   float y = magnitude * sin(angle);
   return vec2(x, y);
}

float vec2_magnitude(vec2 v) {
   float compensatedX = v.x * xyRatio;
   return sqrt((compensatedX * compensatedX) + (v.y * v.y));
}

float vec2_angle(vec2 v) {
   float baseAngle = 0.0;
   if (v.x != 0.0) {
      baseAngle = atan(abs(v.y) / abs(v.x * xyRatio));
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

bool isValueNear(float value, float target, float tolerance) {
   return abs(target - value) <= tolerance;
}

bool isAngleBetween(float angle, float minAngle, float maxAngle) {
   minAngle = modAngle(minAngle);
   maxAngle = modAngle(maxAngle);
   if (minAngle > maxAngle) {
      minAngle -= TAU;
   }
   angle = modAngle(angle);
   if (angle > maxAngle)
      angle -= TAU;
   return (angle >= minAngle) && (angle < maxAngle);
}


void drawGenericEye(vec2 coords, float size, vec2 lookingTo) {
   vec2 relCoords = fragPosition.xy - coords.xy;
   float radius = size;
   if (vec2_magnitude(relCoords) <= radius) {
      float irisSize = 0.3 * size;
      float irisDist = 0.7 * size;
      float irisAngle = vec2_angle(lookingTo - coords.xy);
      vec2 irisCoords = coords + normVec2(irisDist, irisAngle);
      vec2 irisRelCoords = fragPosition.xy - irisCoords.xy;
      if (vec2_magnitude(irisRelCoords) <= irisSize) {
         gl_FragColor = vec4(0, 0, 0, 0);
      }
      else {
         // sclera
         gl_FragColor = vec4(1, 1, 1, 0);
      }
   }

}

// mouthOpenness between 0 and 1
void drawGenericPacman(vec2 coords, float size, float mouthOpenness, float rotationAngle, vec2 lookingTo, vec4 color) {
   float radius = size;
   vec2 relCoords = fragPosition.xy - coords.xy;
   float allowedMouthRange = abs(mouthOpenness) * PI;
   float minMouthAngle = ((-allowedMouthRange / 2.0) + rotationAngle);
   float maxMouthAngle = ((+allowedMouthRange / 2.0) + rotationAngle);
   float relCoordsAngle = vec2_angle(relCoords);
   if ((vec2_magnitude(relCoords) <= radius)
         && ! (isAngleBetween(vec2_angle(relCoords), minMouthAngle, maxMouthAngle))) {
      gl_FragColor = color;
   }

   float eyeSize = 0.2 * size;
   float eyeDist = 0.78 * size;
   float eyeAngle = 5.0 * PI / 16.0 + rotationAngle;
   vec2 eyeCoords = coords + normVec2(eyeDist, eyeAngle);
   drawGenericEye(eyeCoords, eyeSize, lookingTo);
}

void drawPacmanInstance(vec2 coords, float size, float hunger, float baseMouthOpenness, vec4 color) {
   float mouthOpenness = 0.00 + (baseMouthOpenness * abs(sin(modAngle(SQR(hunger) * 3.0 * timeAngle))));
   float rotationAngle = vec2_angle(mouse.xy - coords);
   vec2 lookingTo = mouse.xy;
   drawGenericPacman(coords, size, mouthOpenness, rotationAngle, lookingTo, color);
}

float pacman_dynamicWaveFreq() {
   float mouseDistance = abs(mouse.x - 0.0);
   float steppedDistance = steppedValue(mouseDistance, 0.1);
   return 0.0 + (3.9 * steppedDistance);
   //return 0.0;
}

float pacman_dynamicSize() {
   float mouseDistance = abs(mouse.y - 0.0);
   float steppedDistance = steppedValue(mouseDistance, 0.1);
   return 0.01 + (0.05 * 2.0 * steppedDistance);
   //return 0.04;
}

float pacman_dynamicHunger(vec2 pacman_coords) {
   float mouseDistance = vec2_magnitude(mouse.xy - pacman_coords.xy);
   float maxMouseDistance = vec2_magnitude(vec2(1.0, 1.0));
   float steppedDistance = steppedValue(abs(maxMouseDistance - mouseDistance), 0.5);
   return steppedDistance;
}

float pacman_dynamicMouthOpenness(vec2 pacman_coords) {
   float mouseDistance = vec2_magnitude(mouse.xy - pacman_coords.xy);
   float maxMouseDistance = vec2_magnitude(vec2(1.0, 1.0));
   float steppedDistance = steppedValue(abs(maxMouseDistance - mouseDistance), 0.01);
   return 0.02 * SQR(SQR(steppedDistance));
}

vec4 pacman_dynamicColor(vec2 pacman_coords) {
   float rightEndDistance = fragPosition.x;
   float magnitude = rightEndDistance;
   vec4 color1 = vec4(abs((magnitude - 0.5) * 2.0),
         (1.0 - abs((magnitude - 0.5) * 2.0)),
         MAX(0.0, ((magnitude * 1.5) - 0.5)),
         1.0);
   vec4 color2 = color1; //vec4(0.96, 1.0, 0.0, 1.0);
   float speckleFreq = timeAngle / 50.0;
   return pseudo_speckle2(pacman_coords, color2, color1, speckleFreq);
}


void maybeDrawPacman() {
   vec2 coords = fragPosition.xy;
   float size = pacman_dynamicSize();
   float margin = 0.01;
   float occupation = size + margin;
   float waveFreq = pacman_dynamicWaveFreq();
   float waveRelInputOffset = timeAngle;
   float baseX = coords.x;
   float baseY = coords.y;
   float offsetX = 0.0; //waveFreq * timeAngle / 2.0;
   float pacmanXmod = mod(baseX+offsetX, occupation);
   if (isValueNear(pacmanXmod, 0.0, size)) {
      float pacmanX = (occupation * floor((baseX+offsetX) / occupation)) + (size/2.0) - offsetX;
      float waveAmplitude = 0.1;
      float wavePhase = modAngle(waveFreq * TAU * (pacmanX + waveRelInputOffset));
      float baseWaveValue = waveAmplitude*sin(wavePhase);
      float waveOffset = ((occupation * 6.0) * floor((baseY-baseWaveValue) / (occupation * 6.0)) + (occupation));// + baseWaveValue;
      float pacmanY = baseWaveValue + waveOffset;
      vec2 pacmanCoords = vec2(pacmanX, pacmanY);
      float mouthOpenness = pacman_dynamicMouthOpenness(pacmanCoords);
      float hunger = pacman_dynamicHunger(pacmanCoords);
      vec4 color = pacman_dynamicColor(pacmanCoords);
      drawPacmanInstance(pacmanCoords, size, hunger, mouthOpenness, color);
   }
}


void main( void ) {
   intializeGlobals();
   gl_FragColor = vec4(0, 0, 0, 0);
   // drawPacmanInstance(mousePosition);
   maybeDrawPacman();
   /*drawPacmanInstance(mousePosition + normPos(0.05, 0.0), HALF_PI);
     drawPacmanInstance(mousePosition + normPos(0.10, 0.0), PI);
     drawPacmanInstance(mousePosition + normPos(0.15, 0.00), 6.0*QUARTER_PI);
     drawPacmanInstance(mousePosition + normPos(0.20, 0.0), 7.0*QUARTER_PI);
     drawPacmanInstance(mousePosition + normPos(0.25, 0.0), TAU);*/
}
