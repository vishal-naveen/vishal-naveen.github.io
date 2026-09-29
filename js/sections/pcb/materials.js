// Shared materials. Everything is physically based; the look comes from the studio environment.
import * as THREE from 'three';

export function makeMaterials(grain, env) {
  const mask = new THREE.MeshPhysicalMaterial({
    color: 0x090909, roughness: 0.52, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.32,
    roughnessMap: grain, bumpMap: grain, bumpScale: 0.35,
  });
  const edge = new THREE.MeshStandardMaterial({ color: 0x3a3025, roughness: 0.78, metalness: 0 });
  // Metals carry their own envMap (and intensity); the dielectrics use the scene's quieter one.
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xd8a04f, metalness: 1, roughness: 0.27, envMap: env, envMapIntensity: 1.15 });
  const goldSoft = new THREE.MeshPhysicalMaterial({ color: 0xcf9848, metalness: 1, roughness: 0.4, envMap: env, envMapIntensity: 1.0 });
  const tin = new THREE.MeshPhysicalMaterial({ color: 0xcfcac3, metalness: 1, roughness: 0.34, envMap: env, envMapIntensity: 1.0 });
  const steel = new THREE.MeshPhysicalMaterial({ color: 0xb9b5b0, metalness: 1, roughness: 0.26, envMap: env, envMapIntensity: 1.1 });
  const plastic = new THREE.MeshPhysicalMaterial({ color: 0x0e0e0f, roughness: 0.55, clearcoat: 0.2, clearcoatRoughness: 0.5 });
  const substrate = new THREE.MeshPhysicalMaterial({ color: 0x171310, roughness: 0.6, clearcoat: 0.25, clearcoatRoughness: 0.45 });
  const resistor = new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.5 });
  const ceramic = new THREE.MeshStandardMaterial({ color: 0x7c6446, roughness: 0.55 });
  const silk = new THREE.MeshStandardMaterial({ color: 0xf1ebe1, roughness: 0.62, transparent: true, depthWrite: false });
  return { mask, edge, gold, goldSoft, tin, steel, plastic, substrate, resistor, ceramic, silk };
}

/** A chip-top material. The etched name doubles as the emissive map, so it can light up on hover. */
export function chipMaterial(map, { metal = 0 } = {}) {
  return new THREE.MeshPhysicalMaterial({
    map, roughness: metal ? 0.4 : 0.48, metalness: metal, clearcoat: 0.22, clearcoatRoughness: 0.5,
    emissive: new THREE.Color(1, 0.92, 0.84), emissiveMap: map, emissiveIntensity: 0,
  });
}

/** A trace material with a travelling current pulse. Uniforms live in `u` so the scene can drive them. */
export function traceMaterial(base) {
  const m = base.clone();
  const u = { uHead: { value: -100 }, uLit: { value: 0 }, uTail: { value: 9 } };
  m.userData.u = u;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aT;\nvarying float vT;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvT = aT;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vT;\nuniform float uHead;\nuniform float uLit;\nuniform float uTail;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        diffuseColor.rgb *= 1.0 - 0.86 * min(uLit, 1.0) * smoothstep(0.0, 2.5, uHead - vT);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        {
          float dd = vT - uHead;
          float comet = dd < 0.0 ? exp(dd / uTail) : exp(-dd * dd * 1.6);
          float reached = smoothstep(0.0, 2.5, uHead - vT);
          vec3 hot = mix(vec3(1.0, 0.13, 0.025), vec3(1.0, 0.8, 0.58), smoothstep(0.4, 1.0, comet));
          totalEmissiveRadiance += hot * (comet * 3.4 + uLit * reached * 1.05);
        }`);
  };
  m.customProgramCacheKey = () => 'vn-trace';
  return m;
}
