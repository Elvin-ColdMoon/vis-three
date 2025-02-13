import { Blending } from "three";
import { SymbolConfig } from "../common/CommonConfig";
export interface MaterialConfig extends SymbolConfig {
    alphaTest: number;
    colorWrite: boolean;
    depthTest: boolean;
    depthWrite: boolean;
    format: number;
    fog: boolean;
    name: string;
    needsUpdate: boolean;
    opacity: number;
    dithering: boolean;
    shadowSide: number | null;
    side: number;
    toneMapped: boolean;
    transparent: boolean;
    visible: boolean;
    blendDst: number;
    blendDstAlpha: number | null;
    blendEquation: number;
    blendEquationAlpha: number | null;
    blending: Blending;
    blendSrc: number;
    blendSrcAlpha: number | null;
}
export interface MeshBasicMaterial extends MaterialConfig {
    color: string;
    combine: number;
    aoMapIntensity: number;
    fog: boolean;
    lightMapIntensity: number;
    reflectivity: number;
    refractionRatio: number;
    wireframe: boolean;
    wireframeLinecap: string;
    wireframeLinejoin: string;
    wireframeLinewidth: number;
    map: string;
    envMap: string;
    alphaMap: string;
    aoMap: string;
    lightMap: string;
    specularMap: string;
}
export interface MeshStandardMaterialConfig extends MaterialConfig {
    aoMapIntensity: number;
    bumpScale: number;
    color: string;
    displacementScale: number;
    displacementBias: number;
    emissive: string;
    emissiveIntensity: number;
    envMapIntensity: number;
    flatShading: boolean;
    lightMapIntensity: number;
    metalness: number;
    normalMapType: number;
    refractionRatio: number;
    roughness: number;
    wireframe: boolean;
    wireframeLinecap: string;
    wireframeLinejoin: string;
    roughnessMap: string;
    normalMap: string;
    metalnessMap: string;
    map: string;
    lightMap: string;
    envMap: string;
    emissiveMap: string;
    displacementMap: string;
    bumpMap: string;
    alphaMap: string;
    aoMap: string;
}
export interface MeshPhongMaterialConfig extends MaterialConfig {
    aoMapIntensity: number;
    bumpScale: number;
    color: string;
    displacementScale: number;
    displacementBias: number;
    emissive: string;
    emissiveIntensity: number;
    flatShading: boolean;
    lightMapIntensity: number;
    normalMapType: number;
    refractionRatio: number;
    wireframe: boolean;
    wireframeLinecap: string;
    wireframeLinejoin: string;
    specular: string;
    shininess: number;
    combine: number;
    normalMap: string;
    map: string;
    lightMap: string;
    envMap: string;
    emissiveMap: string;
    displacementMap: string;
    bumpMap: string;
    alphaMap: string;
    aoMap: string;
    specularMap: string;
}
export interface SpriteMaterialConfig extends MaterialConfig {
    color: string;
    rotation: number;
    map: string;
    alphaMap: string;
    sizeAttenuation: boolean;
}
export interface LineBasicMaterialConfig extends MaterialConfig {
    color: string;
    linecap: string;
    linejoin: string;
    linewidth: number;
}
export interface PointsMaterialConfig extends MaterialConfig {
    alphaMap: string;
    color: string;
    map: string;
    size: number;
    sizeAttenuation: boolean;
}
export interface ShaderMaterialConfig extends MaterialConfig {
    shader: string;
    uniforms: {
        [key: string]: any;
    };
}
export interface LoadMaterialConfig extends MaterialConfig {
    url: string;
}
export declare type MaterialAllType = MeshBasicMaterial | MeshStandardMaterialConfig | MeshPhongMaterialConfig | LineBasicMaterialConfig | SpriteMaterialConfig | PointsMaterialConfig | ShaderMaterialConfig;
export declare const getMaterialConfig: () => MaterialConfig;
export declare const getMeshBasicMaterialConfig: () => MeshBasicMaterial;
export declare const getMeshStandardMaterialConfig: () => MeshStandardMaterialConfig;
export declare const getMeshPhongMaterialConfig: () => MeshPhongMaterialConfig;
export declare const getSpriteMaterialConfig: () => SpriteMaterialConfig;
export declare const getLineBasicMaterialConfig: () => LineBasicMaterialConfig;
export declare const getPointsMaterialConfig: () => PointsMaterialConfig;
export declare const getShaderMaterialConfig: () => ShaderMaterialConfig;
