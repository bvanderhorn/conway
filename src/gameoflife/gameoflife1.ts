import { get } from 'http';
import * as h from '../helpers';

type State = Set<string>;

var getNeighbours = (cell: string, grid: [number, number], wrap:boolean = false) : string[] => {
    var [x, y] = toValues(cell);
    var neighbours = [];
    for (var i = x-1; i <= x+1; i++) {
        for (var j = y-1; j <= y+1; j++) {
            if (i === x && j === y) continue;
            if (wrap) {
                neighbours.push(`${(i + grid[0]) % grid[0]},${(j + grid[1]) % grid[1]}`);
            } else {
                if (i >= 0 && i < grid[0] && j >= 0 && j < grid[1]) {
                    neighbours.push(`${i},${j}`);
                }
            }
        }
    }
    return neighbours;
}

var nofNeighbours = (cell: string, current: State, gridSize: [number, number]) : number => {
    var [x, y] = toValues(cell);
    var neighbours = getNeighbours(cell, gridSize);
    return neighbours.filter(x => current.has(x)).length;
}

var survives = (cell: boolean, neighbors: number) => {
    if (cell) return neighbors === 2 || neighbors === 3;
    return neighbors === 3;
}

var toValues = (cell: string) : [number, number] => cell.split(",").map(x => parseInt(x)) as [number, number];

var getAllAssociatedCells = (current: State, gridSize:[number, number]) : State => {
    var result = new Set<string>();
    current.forEach(cell => {
        var neighbours = getNeighbours(cell, gridSize);
        neighbours.forEach(x => result.add(x));
        result.add(cell);
    });
    return result;
}

var iterate = (current: State, gridSize:[number, number]) : State => {
    var next = new Set<string>();
    var allCells = getAllAssociatedCells(current, gridSize);
    allCells.forEach(cell => {
        var neighbors = nofNeighbours(cell, current, gridSize);
        if (survives(current.has(cell), neighbors)) {
            next.add(cell);
        }
    });
}

var translate = (value:number) : string => value === 0 ? h.whiteBlock : ".";

var glider: State = new Set<string>([
        [2,1],
        [3,2],
        [1,3],
        [2,3],
        [3,3]
    ].map(x => x.toString())
);

var stateToString = (state: State) : string[][] =>{
    var stateMap = new Map<string, number>();
    state.forEach(x => stateMap.set(x, 1));
    return h.coorMapToMap(stateMap, translate, ".", [[0, gridSize[0]], [0, gridSize[1]]]);
}
    

// run
var gridSize = [25, 25];
var values: Set<string> = glider;
