// Copyright 2023 steve hocktail

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

// http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

uniform vec3 _directionalLight = vec3(0.0);

vec3 getProceduralColor() {
 // emissive
 vec3 color = texture(iChannel1, _texCoord0).rgb;
 if (color.r > 0.0 || color.g > 0.0 || color.b > 0.0) {
  return color;
 }
 if (_directionalLight.x == 0.0 && _directionalLight.y == 0.0 && _directionalLight.z == 0.0) {
  return vec3(0.0);
 }
 // albedo
 color = texture(iChannel0, _texCoord0).rgb;
 float dotProduct = dot(normalize(_directionalLight), _normal);
 if (dotProduct <= -0.0625) {
  return color;
 } else if (dotProduct < 0.0625) {
  return color * (-7 * dotProduct + 0.5625);
 } else {
  return color * 0.125;
 }
}
