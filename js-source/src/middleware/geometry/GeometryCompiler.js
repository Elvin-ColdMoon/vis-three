import { BoxBufferGeometry, BufferGeometry, CircleBufferGeometry, ConeBufferGeometry, CylinderBufferGeometry, EdgesGeometry, Euler, Matrix4, PlaneBufferGeometry, Quaternion, SphereBufferGeometry, Vector3, } from "three";
import { validate } from "uuid";
import { LoadGeometry } from "../../extends/geometry/LoadGeometry";
import { Compiler } from "../../core/Compiler";
import { CONFIGTYPE } from "../constants/configType";
import { MODULETYPE } from "../constants/MODULETYPE";
export class GeometryCompiler extends Compiler {
    // 变换锚点
    static transfromAnchor = function (geometry, config) {
        geometry.center();
        !geometry.boundingBox && geometry.computeBoundingBox();
        const box = geometry.boundingBox;
        const position = config.position;
        const rotation = config.rotation;
        const scale = config.scale;
        const materix = new Matrix4();
        const vPostion = new Vector3(((box.max.x - box.min.x) / 2) * position.x, ((box.max.y - box.min.y) / 2) * position.y, ((box.max.z - box.min.z) / 2) * position.z);
        const quaternion = new Quaternion().setFromEuler(new Euler(rotation.x, rotation.y, rotation.z, "XYZ"));
        const vScale = new Vector3(scale.x, scale.y, scale.z);
        materix.compose(vPostion, quaternion, vScale);
        geometry.applyMatrix4(materix);
        return geometry;
    };
    MODULE = MODULETYPE.GEOMETRY;
    target = {};
    map = new Map();
    weakMap = new WeakMap();
    constructMap;
    resourceMap = new Map();
    replaceGeometry = new BoxBufferGeometry(5, 5, 5);
    constructor() {
        super();
        const constructMap = new Map();
        constructMap.set(CONFIGTYPE.BOXGEOMETRY, (config) => {
            return GeometryCompiler.transfromAnchor(new BoxBufferGeometry(config.width, config.height, config.depth, config.widthSegments, config.heightSegments, config.depthSegments), config);
        });
        constructMap.set(CONFIGTYPE.SPHEREGEOMETRY, (config) => {
            return GeometryCompiler.transfromAnchor(new SphereBufferGeometry(config.radius, config.widthSegments, config.heightSegments, config.phiStart, config.phiLength, config.thetaStart, config.thetaLength), config);
        });
        constructMap.set(CONFIGTYPE.PLANEGEOMETRY, (config) => {
            return GeometryCompiler.transfromAnchor(new PlaneBufferGeometry(config.width, config.height, config.widthSegments, config.heightSegments), config);
        });
        constructMap.set(CONFIGTYPE.LOADGEOMETRY, (config) => {
            return GeometryCompiler.transfromAnchor(new LoadGeometry(this.getGeometry(config.url)), config);
        });
        constructMap.set(CONFIGTYPE.CIRCLEGEOMETRY, (config) => {
            return GeometryCompiler.transfromAnchor(new CircleBufferGeometry(config.radius, config.segments, config.thetaStart, config.thetaLength), config);
        });
        constructMap.set(CONFIGTYPE.CONEGEOMETRY, (config) => {
            return GeometryCompiler.transfromAnchor(new ConeBufferGeometry(config.radius, config.height, config.radialSegments, config.heightSegments, config.openEnded, config.thetaStart, config.thetaLength), config);
        });
        constructMap.set(CONFIGTYPE.CYLINDERGEOMETRY, (config) => {
            return GeometryCompiler.transfromAnchor(new CylinderBufferGeometry(config.radiusTop, config.radiusBottom, config.height, config.radialSegments, config.heightSegments, config.openEnded, config.thetaStart, config.thetaLength), config);
        });
        constructMap.set(CONFIGTYPE.EDGESGEOMETRY, (config) => {
            return GeometryCompiler.transfromAnchor(new EdgesGeometry(this.map.get(config.url), config.thresholdAngle), config);
        });
        this.constructMap = constructMap;
    }
    linkRescourceMap(map) {
        this.resourceMap = map;
        return this;
    }
    getRescource(url) {
        if (!this.resourceMap.has(url)) {
            console.error(`rescoure can not found url: ${url}`);
            return this.replaceGeometry.clone();
        }
        if (this.resourceMap.has(url) &&
            this.resourceMap.get(url) instanceof BufferGeometry) {
            const geometry = this.resourceMap.get(url);
            return geometry.clone();
        }
        else {
            console.error(`url mapping rescource is not class with BufferGeometry: ${url}`);
            return this.replaceGeometry.clone();
        }
    }
    getGeometry(url) {
        if (this.map.has(url)) {
            return this.map.get(url);
        }
        return this.getRescource(url);
    }
    getMap() {
        return this.map;
    }
    useEngine(engine) {
        return this;
    }
    setTarget(target) {
        this.target = target;
        return this;
    }
    add(vid, config) {
        if (config.type && this.constructMap.has(config.type)) {
            const geometry = this.constructMap.get(config.type)(config);
            geometry.clearGroups();
            for (const group of config.groups) {
                geometry.addGroup(group.start, group.count, group.materialIndex);
            }
            this.map.set(vid, geometry);
            this.weakMap.set(geometry, vid);
        }
        return this;
    }
    addGroup(vid, group) {
        if (!this.map.has(vid)) {
            console.warn(`geometry compiler can not found object with vid: ${vid}`);
            return this;
        }
        const geometry = this.map.get(vid);
        geometry.addGroup(group.start, group.count, group.materialIndex);
        return this;
    }
    updateGroup(vid, index) {
        return this.removeGroup(vid, index).addGroup(vid, this.target[vid].groups[index]);
    }
    removeGroup(vid, index) {
        if (!this.map.has(vid)) {
            console.warn(`geometry compiler can not found object with vid: ${vid}`);
            return this;
        }
        const geometry = this.map.get(vid);
        geometry.groups.splice(index, 1);
        return this;
    }
    // 几何的set是重新生成几何然后clone或者copy
    set(vid, path, value) {
        if (!validate(vid)) {
            console.warn(`geometry compiler set function vid parameters is illeage: '${vid}'`);
            return this;
        }
        if (!this.map.has(vid)) {
            console.warn(`geometry compiler set function can not found vid geometry: '${vid}'`);
            return this;
        }
        const currentGeometry = this.map.get(vid);
        const config = this.target[vid];
        const newGeometry = this.constructMap.get(config.type)(config);
        currentGeometry.copy(newGeometry);
        // 辅助的更新根据uuid的更新而更新，直接copy无法判断是否更新
        // TODO: 使用dispatch通知更新
        currentGeometry.dispatchEvent({
            type: "update",
        });
        currentGeometry.uuid = newGeometry.uuid;
        newGeometry.dispose();
        return this;
    }
    remove(vid) {
        if (!this.map.has(vid)) {
            console.warn(`Geometry Compiler: can not found vid in compiler: ${vid}`);
            return this;
        }
        const geometry = this.map.get(vid);
        geometry.dispose();
        this.map.delete(vid);
        this.weakMap.delete(geometry);
        return this;
    }
    compileAll() {
        const target = this.target;
        for (const key in target) {
            this.add(key, target[key]);
        }
        return this;
    }
    dispose() {
        this.map.forEach((geometry, vid) => {
            geometry.dispose();
        });
        return this;
    }
    getObjectSymbol(texture) {
        return this.weakMap.get(texture) || null;
    }
    getObjectBySymbol(vid) {
        return this.map.get(vid) || null;
    }
}
//# sourceMappingURL=GeometryCompiler.js.map