import { RenderNode } from '../../../components/renderer/RenderNode';
import { KDTreeEntity } from './KDTreeEntity';
/**
 * @internal
 * @group Core
 */
export declare class IKDTreeUserData {
    get data(): RenderNode;
    entity: KDTreeEntity;
}
