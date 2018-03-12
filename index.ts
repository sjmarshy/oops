import P from 'parsimmon';
import { inspect } from 'util';

// 1. (1 2 3)
// => { type: LIST, items: [ { type: NUMBER, value: 1 }, { type: NUMBER, value: 2 }, { type: NUMBER, value: 3 }]}

// 2. (+ 1 2 3)
/**
 * { type: list
 * , items: [
 *     { type: symbol
 *     , value: '+' }, ...
 *   ]
 * }
 */

function printAST(ast: any) {
    console.log(inspect(ast, { depth: null }));
}

interface AST<T> {
    readonly type: symbol;
    value: T;
}

const number = Symbol('number');
const list = Symbol('list');
const program = Symbol('program');
const symbol = Symbol('symbol');

const Language = P.createLanguage({
    Program: v =>
        P.seq(v.List)
            .trim(P.optWhitespace)
            .map(value => ({ type: program, value })),

    List: v =>
        P.string('(')
            .then(P.sepBy(P.alt(v.Number, v.Symbol, v.List), v._))
            .skip(P.string(')'))
            .map(value => ({ type: list, value })),

    Symbol: v =>
        P.regexp(/[a-zA-Z-\+!><?$@*`±^§\/\\]+/).map(value => ({
            type: symbol,
            value,
        })),

    Number: () =>
        P.regexp(/[0-9]+/)
            .map(x => parseInt(x, 10))
            .map(value => ({
                type: number,
                value,
            })),

    _: () => P.whitespace,
});

const ast = Language.Program.parse('   (+ 1 2 999) ');

const symbolTable = {
    '+': (args: number[]): number => args.reduce((a, b) => a + b, 0),
};

function EVAL(ast: any): any {
    if (ast.type === program) {
        return EVAL(ast.value[0]);
    } else if (ast.type === list) {
        const [fn, ...args] = ast.value.map(EVAL);
        if (symbolTable.hasOwnProperty(fn)) {
            return symbolTable[fn](args);
        } else {
            throw new ReferenceError(`no such symbol: ${fn}`);
        }
    } else if (ast.type === number) {
        return ast.value;
    } else if (ast.type === symbol) {
        return ast.value;
    }
    return ast;
}

if (ast.status) {
    console.log(EVAL(ast.value));
}
