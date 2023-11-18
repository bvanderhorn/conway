import { get } from 'http';
import * as h from '../helpers';

type Values = h.DoubleSet<number>;
type InitSet = {
    values: Values,
    gridSize: [number, number]
    wrap : boolean
}

class State {
    public values: Values;
    public gridSize: [number, number];
    public sleep : number = 100;
    public wrap: boolean = false;
    public cellStrings: [string, string] = [h.grayBlock, h.whiteBlock];
    constructor(initSet: InitSet, sleep: number, cellStrings: [string, string]) {
        this.values = initSet.values;
        this.gridSize = initSet.gridSize;
        this.wrap = initSet.wrap;
        this.sleep = sleep;
        this.cellStrings = cellStrings;
    }

    public run = async (): Promise<void> => {
        h.print(this.draw());

        while (true) {
            this.iterate();
            h.printu(this.draw() + "\n");
            await h.sleep(this.sleep);
        }
    }

    public iterate = () => {
        var next:Values = new h.DoubleSet<number>();
        var allCells = this.getAllAssociatedCells();
        allCells.forEach(cell => {
            var neighbors = this.nofNeighbours(cell);
            if (this.survives(this.values.has(cell), neighbors)) {
                next.add(cell);
            }
        });
        this.values = next;
    }

    public draw = () : string =>{
        var stateMap = new Map<string, number>();
        this.values.forEach(x => stateMap.set(x.toString(), 1));
        var grid = h.coorMapToMap(stateMap, this.translate, this.cellStrings[0], [[0, this.gridSize[0]], [0, this.gridSize[1]]]);
        var str = grid.stringc(x => false, 'c') + "\n";
        return str;
    }

    private getNeighbours = (cell: [number, number]) : [number, number][] => {
        var [x, y] = cell;
        var neighbours: [number, number][] = [];
        for (var i = x-1; i <= x+1; i++) {
            for (var j = y-1; j <= y+1; j++) {

                if (i === x && j === y) continue;

                if (this.wrap) {
                    neighbours.push([
                                    (i + this.gridSize[0]) % this.gridSize[0], 
                                    (j + this.gridSize[1]) % this.gridSize[1]
                                ]);

                } else {
                    if (i >= 0 && i < this.gridSize[0] && j >= 0 && j < this.gridSize[1]) {
                        neighbours.push([i,j]);
                    }
                }
            }
        }
        return neighbours;
    }
    
    private nofNeighbours = (cell: [number, number]) : number => {
        var neighbours = this.getNeighbours(cell);
        return neighbours.filter(x => this.values.has(x)).length;
    }
    
    private survives = (cell: boolean, neighbors: number) => {
        if (cell) return neighbors === 2 || neighbors === 3;
        return neighbors === 3;
    }
    
    private getAllAssociatedCells = () : Values => {
        var result = new h.DoubleSet<number>();
        this.values.forEach(cell => {
            var neighbours = this.getNeighbours(cell);
            neighbours.forEach(x => result.add(x));
            result.add(cell);
        });
        return result;
    }
    
    public translate = (value:number) : string => value === 1 ? this.cellStrings[1] : this.cellStrings[0];    
}

var loadPattern = (fileName:string) : Values => new h.DoubleSet<number>(JSON.parse(h.simpleRead('gameoflife', fileName)));

var glider: [number, number][] = [
    [2,1],
    [3,2],
    [1,3],
    [2,3],
    [3,3]
];

var gliderSet: InitSet = {
    values: new h.DoubleSet<number>(glider),
    gridSize: [25, 25],
    wrap: true
};

var gospersGliderGunSet: InitSet = {
    values: loadPattern('gospersglidergun.json'),
    gridSize: [100, 60],
    wrap: false
};

var isNumber = (input: string) : boolean => /^\d+$/.test(input);
var input:string[] = h.read('gameoflife', 'gospers.txt').filter(x => !x.startsWith("#")).slice(1).join('').replace('!','').split('$');
// h.print(input);

// run
var state = new State(gliderSet, 50, [".", h.colorStr(h.whiteBlock, 'c')]);
state.run();