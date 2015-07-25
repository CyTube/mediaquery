htmlparser = require 'htmlparser2'

exports.parseDom = (xml) ->
    handler = new htmlparser.DomHandler()
    parser = new htmlparser.Parser(handler, xmlMode: false)
    parser.write(xml)
    parser.done()
    return handler.dom
