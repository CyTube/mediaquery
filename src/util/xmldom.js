import { Parser } from 'htmlparser2';
import { DomHandler } from 'domhandler';
import { findOne } from 'domutils';

export function parseDom(xml) {
    const handler = new DomHandler();
    const parser = new Parser(handler, { xmlMode: false });
    parser.write(xml);
    parser.done();
    return handler.dom;
}

export function mustFindOne(pred, dom) {
    const res = findOne(pred, dom);
    if (res === null) {
        throw new Error(`Failed to find matching element for ${pred}`);
    }

    return res;
}
