import { CurveValueType, Quaternion, Vector2, Vector3, Vector4 } from "../../../index";
export declare class ValueOp<T extends CurveValueType> {
    static sub<T extends CurveValueType>(v1: T, v2: T): number | Vector3 | Quaternion | Vector2 | Vector4;
}
