import { Parser } from 'htmlparser2';
import { DomHandler } from 'domhandler';

export function parseDom(xml) {
    const handler = new DomHandler();
    const parser = new Parser(handler, { xmlMode: false });
    parser.write(xml);
    parser.done();
    return handler.dom;
}
