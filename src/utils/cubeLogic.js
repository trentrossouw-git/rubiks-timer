import { MODIFIERS, STD_SOLVED } from './constants';

export const cloneCube = (state) => JSON.parse(JSON.stringify(state));

const cycle = (arr, indices) => {
  const temp = arr[indices[indices.length - 1]];
  for (let i = indices.length - 1; i > 0; i--) arr[indices[i]] = arr[indices[i - 1]];
  arr[indices[0]] = temp;
};

const rotateFaceClockwise = (face) => { 
    cycle(face, [0, 2, 8, 6]); 
    cycle(face, [1, 5, 7, 3]); 
};

export const applyMove = (state, move) => {
  if (!move) return state;
  const face = move[0];
  const modifier = move.includes("'") ? "'" : move.includes("2") ? "2" : "";
  const newState = cloneCube(state);
  let turns = modifier === "'" ? 3 : modifier === '2' ? 2 : 1;

  for (let i = 0; i < turns; i++) {
    switch (face) {
      case 'U': {
        rotateFaceClockwise(newState.U);
        const tU = [...newState.F.slice(0, 3)];
        for(let k=0; k<3; k++) newState.F[k] = newState.R[k];
        for(let k=0; k<3; k++) newState.R[k] = newState.B[k];
        for(let k=0; k<3; k++) newState.B[k] = newState.L[k];
        for(let k=0; k<3; k++) newState.L[k] = tU[k];
        break;
      }
      case 'D': {
        rotateFaceClockwise(newState.D);
        const tD = [...newState.F.slice(6, 9)];
        for(let k=0; k<3; k++) newState.F[6+k] = newState.L[6+k];
        for(let k=0; k<3; k++) newState.L[6+k] = newState.B[6+k];
        for(let k=0; k<3; k++) newState.B[6+k] = newState.R[6+k];
        for(let k=0; k<3; k++) newState.R[6+k] = tD[k];
        break;
      }
      case 'L': {
        rotateFaceClockwise(newState.L);
        const tL = [newState.U[0], newState.U[3], newState.U[6]];
        [newState.U[0], newState.U[3], newState.U[6]] = [newState.B[8], newState.B[5], newState.B[2]]; 
        [newState.B[8], newState.B[5], newState.B[2]] = [newState.D[0], newState.D[3], newState.D[6]];
        [newState.D[0], newState.D[3], newState.D[6]] = [newState.F[0], newState.F[3], newState.F[6]];
        [newState.F[0], newState.F[3], newState.F[6]] = tL;
        break;
      }
      case 'R': {
        rotateFaceClockwise(newState.R);
        const tR = [newState.U[2], newState.U[5], newState.U[8]];
        [newState.U[2], newState.U[5], newState.U[8]] = [newState.F[2], newState.F[5], newState.F[8]];
        [newState.F[2], newState.F[5], newState.F[8]] = [newState.D[2], newState.D[5], newState.D[8]];
        [newState.D[2], newState.D[5], newState.D[8]] = [newState.B[6], newState.B[3], newState.B[0]]; 
        [newState.B[6], newState.B[3], newState.B[0]] = tR;
        break;
      }
      case 'F': {
        rotateFaceClockwise(newState.F);
        const tF = [newState.U[6], newState.U[7], newState.U[8]];
        [newState.U[6], newState.U[7], newState.U[8]] = [newState.L[8], newState.L[5], newState.L[2]];
        [newState.L[8], newState.L[5], newState.L[2]] = [newState.D[2], newState.D[1], newState.D[0]];
        [newState.D[2], newState.D[1], newState.D[0]] = [newState.R[0], newState.R[3], newState.R[6]];
        [newState.R[0], newState.R[3], newState.R[6]] = tF;
        break;
      }
      case 'B': {
        rotateFaceClockwise(newState.B);
        const tB = [newState.U[2], newState.U[1], newState.U[0]];
        [newState.U[2], newState.U[1], newState.U[0]] = [newState.R[8], newState.R[5], newState.R[2]];
        [newState.R[8], newState.R[5], newState.R[2]] = [newState.D[6], newState.D[7], newState.D[8]];
        [newState.D[6], newState.D[7], newState.D[8]] = [newState.L[0], newState.L[3], newState.L[6]];
        [newState.L[0], newState.L[3], newState.L[6]] = tB;
        break;
      }
    }
  }
  return newState;
};

export const generateRandomMoves = (len=20) => {
  const f=['U','D','L','R','F','B']; 
  let m=[], last=-1, sl=-1;
  for(let i=0;i<len;i++) {
    let x; 
    do{x=Math.floor(Math.random()*6)}while(x===last||(x===sl&&Math.floor(x/2)===Math.floor(last/2)));
    m.push(f[x]+MODIFIERS[Math.floor(Math.random()*3)]); 
    sl=last; last=x;
  }
  return m.join(" ");
};