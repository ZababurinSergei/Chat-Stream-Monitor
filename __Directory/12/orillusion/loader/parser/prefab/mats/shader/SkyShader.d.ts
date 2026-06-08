import { Shader } from "../../../../../gfx/graphics/webGpu/shader/Shader";
export declare class SkyShader extends Shader {
    private readonly _fixOrthMatrix;
    private _cacheData;
    constructor();
    fixOrthProj(enable: boolean, aspect: number, near: number, far: number): void;
}
