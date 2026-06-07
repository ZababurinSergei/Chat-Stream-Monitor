export declare class PipelinePool {
    private static pipelineMap;
    static getSharePipeline(shaderVariant: string): any;
    static setSharePipeline(shaderVariant: string, pipeline: GPURenderPipeline): void;
}
