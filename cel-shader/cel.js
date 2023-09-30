"use strict";

/*
Copyright 2023 steve hocktail

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

(function() {
 // the first three constants should be changed to point to the URL of cel.fs and your albedo and emissive maps.
 // SHADER_URL should work as is if you keep this script and the shader in the same folder.
 // MATERIAL_NAME should be "[mat::" followed by the name of your avatar's material followed by a closing "]"
 // if your avatar has multiple materials, put them all in the same set of brackets, and separate them by commas without spaces between, with "mat::" before each one.
 const ALBEDO_URL = "https://example.com/albedo.png";
 const EMISSIVE_URL = "https://example.com/emissive.png";
 const SHADER_URL = Script.resolvePath("cel.fs");
 const MATERIAL_NAME = "[mat::body,mat::shirt,mat::pants]";

 {
  // remove old shader material manually if it didn't properly get removed last
  // time the script ended, such as on a crash
  const wearables = Entities.getChildrenIDs(MyAvatar.sessionUUID);
  var i = 0;
  while (i < wearables.length) {
   const wearableID = wearables[i];
   if (Entities.getEntityType(wearableID) === "Material") {
    const properties = Entities.getEntityProperties(wearableID);
    if (Object.hasOwn(properties, "materialData")) {
     const materialData = JSON.parse(properties.materialData);
     if (Object.hasOwn(materialData.materials, "procedural") && materialData.materials.procedural.shaderUrl === SHADER_URL) {
      Entities.deleteEntity(wearableID);
     } else i++;
    } else i++;
   } else i++;
  }
 }

 const shader = {materials:{
  model:"hifi_shader_simple",
  procedural:{
   version:1,
   shaderUrl:SHADER_URL,
   channels:[ALBEDO_URL, EMISSIVE_URL],
   uniforms:{_directionalLight:[0.0,0.0,0.0]}
  }
 }};
 const materialID = Entities.addEntity({
  type:"Material",
  parentID:MyAvatar.sessionUUID,
  parentMaterialName:MATERIAL_NAME,
  materialURL:"materialData",
  priority:1,
  materialData:JSON.stringify(shader)
 }, "avatar");
 const shaderLight = shader.materials.procedural.uniforms._directionalLight;

 function amIInLight(light) {
  if (!light.visible) return false;
  const distance = Vec3.subtract(MyAvatar.position, light.position);
  return Math.abs(distance.x) < light.dimensions.x && Math.abs(distance.y) < light.dimensions.y && Math.abs(distance.z) < light.dimensions.z;
 }

 function lerpLight(to, delta) {
  const speed = Math.min(delta * 10.0, 1.0);
  const oneMinusSpeed = 1.0 - speed;
  shaderLight[0] = shaderLight[0] * oneMinusSpeed + to.x * speed;
  shaderLight[1] = shaderLight[1] * oneMinusSpeed + to.y * speed;
  shaderLight[2] = shaderLight[2] * oneMinusSpeed + to.z * speed;
 }

 Script.update.connect(function(delta) {
  const lights = Entities.findEntitiesByType("Light", MyAvatar.position, 100.0);
  var closestLight = {position:Vec3.ZERO};
  var distanceToClosestLight = 999999999999;
  var closeLightFound = false;
  for (var i = 0; i < lights.length; i++) {
   const light = Entities.getEntityProperties(lights[i], ["position", "dimensions", "visible"]);
   if (!amIInLight(light)) continue;
   const distance = Vec3.distance(MyAvatar.position, light.position);
   if (distanceToClosestLight > distance) {
    closestLight = light;
    distanceToClosestLight = distance;
    closeLightFound = true;
   }
  }
  if (closeLightFound) {
   lerpLight(Vec3.subtract(MyAvatar.position, closestLight.position), delta);
  } else {
   const zones = Entities.findEntitiesByType("Zone", MyAvatar.position, 100.0);
   var zoneFound = false;
   for (var i = 0; i < zones.length; i++) {
    const zone = Entities.getEntityProperties(zones[i]/*, ["keyLight", "position", "dimensions", "visible"] idk why it isn't getting keyLight when i use an array*/);
    if (amIInLight(zone)) {
     lerpLight(zone.keyLight.direction, delta);
     zoneFound = true;
     break;
    }
   }
   if (!zoneFound) {
    shaderLight[0] = 0.0;
    shaderLight[1] = 0.0;
    shaderLight[2] = 0.0;
   }
  }
  Entities.editEntity(materialID, {materialData:JSON.stringify(shader)});
 });

 Script.scriptEnding.connect(function() {
  Entities.deleteEntity(materialID);
 });
}());
