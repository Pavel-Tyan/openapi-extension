import {Endpoint, OpenApiIncluderParams, Specification, Tag} from '../types';
import {evalExp} from '@doc-tools/transform/lib/liquid/evaluation';

export function concatNewLine(prefix: string, suffix: string) {
    return prefix.trim().length ? `${prefix}<br>${suffix}` : suffix;
}

export function matchFilter(
    filter: OpenApiIncluderParams['filter'],
    vars: Record<string, string>,
    action: (endpoint: Endpoint, tag?: Tag) => void,
) {
    const {endpoint: endpointExpr, tag: tagExpr} = filter || {};
    const matchTag = tagExpr ? (tag: Tag) => evalExp(tagExpr as string, {...tag, vars}) : null;
    const matchEndpoint = endpointExpr ? (endpoint: Endpoint) => evalExp(endpointExpr as string, {...endpoint, vars}) : null;

    return (spec: Specification): void => {
        const {tags, endpoints} = spec;

        for (const endpoint of endpoints) {
            if (matchEndpoint && matchEndpoint(endpoint)) {
                action(endpoint);
            }
        }

        for (const [, tag] of tags) {
            // eslint-disable-next-line no-shadow
            const {endpoints} = tag;

            if (matchTag && matchTag(tag)) {
                for (const endpoint of endpoints) {
                    action(endpoint, tag);
                }
            }

            if (matchEndpoint) {
                for (const endpoint of endpoints) {
                    if (matchEndpoint(endpoint)) {
                        action(endpoint, tag);
                    }
                }
            }
        }
    };
}