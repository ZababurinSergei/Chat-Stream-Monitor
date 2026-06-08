import { ViewQuad } from '../../../core/ViewQuad';
import { VirtualTexture } from '../../../textures/VirtualTexture';
import { Texture } from '../../graphics/webGpu/core/texture/Texture';
import { PostRenderer } from '../passRenderer/post/PostRenderer';
import { View3D } from '../../../core/View3D';
import { RendererPassState } from '../passRenderer/state/RendererPassState';
/**
 * @internal
 * Base class for post-processing effects
 * @group Post Effects
 */
export declare class PostBase {
    enable: boolean;
    postRenderer: PostRenderer;
    rendererPassState: RendererPassState;
    protected rtViewQuad: Map<string, ViewQuad>;
    protected virtualTexture: Map<string, VirtualTexture>;
    constructor();
    protected createRTTexture(name: string, rtWidth: number, rtHeight: number, format: GPUTextureFormat, useMipmap?: boolean, sampleCount?: number): import("../../../index").RenderTexture;
    protected createViewQuad(name: string, shaderName: string, outRtTexture: VirtualTexture, msaa?: number): ViewQuad;
    protected getLastRenderTexture(): Texture;
    compute(view: View3D): void;
    onAttach(view: View3D): void;
    onDetach(view: View3D): void;
    onResize(): void;
    render(view: View3D, command: GPUCommandEncoder): void;
    destroy(force?: boolean): void;
}
