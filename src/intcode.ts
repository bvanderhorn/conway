import * as h from './helpers';

export type Instruction = {
    op: number,
    a: number,
    b: number,
    c: number,
    a0: number,
    b0: number,
    c0: number
}

export class State {
    public program: Map<number, number> = new Map<number, number>();
    public index: number;
    public input: number[];
    public halt: boolean;
    public relativeBase: number = 0;
    
    constructor(program: number[], input: number[] = []) {
        program.map((n,i) => this.program.set(i, n));
        this.index = 0;
        this.input = input;
        this.halt = false;
        this.relativeBase = 0;
    }

    public get awaitingInput(): boolean {
        return this.getInstruction().op == 3 && this.input.length == 0;
    }

    public getInstruction = (verbose = false) : Instruction => {
        var [opm, a0, b0, c0] = [this.program.get(this.index) ?? 0, 
            this.program.get(this.index+1) ?? 0, 
            this.program.get(this.index+2) ?? 0, 
            this.program.get(this.index+3) ?? 0];
        h.printVerbose(verbose,'index ',this.index, ':', opm, a0, b0, c0 );
    
        var op:number = +`0${opm.toString()}`.split('').slice2(-2).join('');
        var modes:number[] = `0000${opm.toString()}`.split('').slice2(0,-2).map((m:string) => +m).reverse();
        var [a,b,c] = [a0, b0, c0].map((n:number,i:number) => this.getValue(modes[i], n));
        [a0, b0, c0] = [a0, b0, c0].map((n:number,i:number) => this.getWriteIndex(modes[i], n));
    
        return {op,a,b,c,a0,b0,c0};
    }

    private getValue = (mode:number, value:number) : number => {
        switch (mode) {
            case 0: return this.program.get(value) ?? 0;
            case 1: return value;
            case 2: return this.program.get(value + this.relativeBase) ?? 0;
            default: throw new Error("invalid mode");
        }
    }

    private getWriteIndex = (mode:number, value:number) : number => {
        switch (mode) {
            case 0: return value;
            case 2: return value + this.relativeBase;
            default: return -1;
        }
    }

    public execute = (verbose: boolean = false) : number|undefined => {
        // executes one instruction and returns if input was consumed
        var {op,a,b,c,a0,b0,c0} = this.getInstruction(verbose);
        if (this.awaitingInput) {
            h.printVerbose(verbose, `awaiting input => ${this.awaitingInput}`)
            return undefined;
        }
    
        switch (op) {
            case 1:
                this.program.set(c0, a + b);
                this.index += 4;
                h.printVerbose(verbose, `program[${c0}] = ${a} + ${b} => ${this.program.get(c0)}, index += 4 => ${this.index}`)
                break;
            case 2:
                this.program.set(c0, a * b);
                this.index += 4;
                h.printVerbose(verbose, `program[${c0}] = ${a} * ${b} => ${this.program.get(c0)}, index += 4 => ${this.index}`)
                break;
            case 3:
                var input = this.input.shift() ?? -1;
                this.program.set(a0,input);
                this.index += 2;
                h.printVerbose(verbose, `program[${a0}] = input => ${input}, index += 2 => ${this.index}`)
                break;
            case 4:
                // h.print(a);
                this.index += 2;
                h.printVerbose(verbose, `output = ${a}, index += 2 => ${this.index}`)
                return a;
            case 5:
                var str =`index (${this.index}) = ${a} != 0 ? ${b} : index + 3 => `;
                if (a != 0) this.index = b;
                else this.index += 3;
                h.printVerbose(verbose, str,this.index);
                break;
            case 6:
                var str =`index (${this.index}) = ${a} == 0 ? ${b} : index + 3 => `;
                if (a == 0) this.index = b;
                else this.index += 3;
                h.printVerbose(verbose, str,this.index);
                break;
            case 7:
                this.program.set(c0 , a < b ? 1 : 0);
                this.index += 4;
                h.printVerbose(verbose, `program[${c0}] = ${a} < ${b} ? 1 : 0 => ${this.program.get(c0)}, index += 4 => ${this.index}`)
                break;
            case 8:
                this.program.set(c0,a == b ? 1 : 0);
                this.index += 4;
                h.printVerbose(verbose, `program[${c0}] = ${a} == ${b} ? 1 : 0 => ${this.program.get(c0)}, index += 4 => ${this.index}`)
                break;
            case 9:
                this.relativeBase += a;
                this.index += 2;
                h.printVerbose(verbose, `relativeBase += ${a} => ${this.relativeBase}, index += 2 => ${this.index}`)
                break;
            case 99:
                this.halt = true;
                h.printVerbose(verbose, `halt => ${this.halt}`)
                break;
            default:
                throw new Error("invalid opcode");
        }
    }

    public run = (verbose:boolean = false): number[] => {
        var output:number[] = [];
        while(!this.halt) {
            var curOutput = this.execute(verbose);
            if (curOutput != undefined) output.push(curOutput);
        }
        return output;
    }

    public runTillInputNeededOrHalt = (verbose:boolean = false): number[] => {
        var output:number[] = [];
        while(!this.awaitingInput && !this.halt) {
            var curOutput = this.execute(verbose);
            if (curOutput != undefined) output.push(curOutput);
        }
        if (verbose) {
            h.print("halted because: ", this.halt ? "halt" : "awaiting input");
            h.print(" output: ", output);
        }
        return output;
    }

    public simplify = (withProgram:boolean = true) : any => {
        var program = JSON.stringify(this.programArray());
        var index = this.index;
        var input = JSON.stringify(this.input);
        var halt = this.halt;
        var awaitingInput = this.awaitingInput;
        return withProgram ? {program, index, input, halt, awaitingInput} : {index, input, halt, awaitingInput};
    }

    public print = (withProgram:boolean = true) : void => {
        h.print(h.stringify(this.simplify(withProgram)));
    }

    private programArray() : number[] {
        var arr: number[] = [];
        this.program.forEach((v,k) => arr[k] = v);
        return arr;
    }
}