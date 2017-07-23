import htmlparser from 'htmlparser2';

export function parseDom(xml) {
    const handler = new htmlparser.DomHandler();
    const parser = new htmlparser.Parser(handler, { xmlMode: false });
    parser.write(xml);
    parser.done();
    return handler.dom;
}
