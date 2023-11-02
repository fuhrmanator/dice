import create from "zustand";
import { immer } from "zustand/middleware/immer";
import { diceSets } from "../sets/diceSets";
import { Dice } from "../types/Dice";
import { DiceSet } from "../types/DiceSet";
import { Die } from "../types/Die";
import { generateDiceId } from "../helpers/generateDiceId";

export type Advantage = "ADVANTAGE" | "DISADVANTAGE" | null;
export type DiceCounts = Record<string, number>;

interface DiceControlsState {
  diceSet: DiceSet;
  diceById: Record<string, Die>;
  defaultDiceCounts: DiceCounts;
  diceCounts: DiceCounts;
  diceBonus: number;
  diceAdvantage: Advantage;
  diceHidden: boolean;
  rollSpecifier: string;
  diceRollPressTime: number | null;
  changeDiceSet: (diceSet: DiceSet) => void;
  resetDiceCounts: () => void;
  changeDieCount: (id: string, count: number) => void;
  incrementDieCount: (id: string) => void;
  decrementDieCount: (id: string) => void;
  setDiceAdvantage: (advantage: Advantage) => void;
  setDiceBonus: (bonus: number) => void;
  toggleDiceHidden: () => void;
  setRollSpecifier: (specifier: string) => void;
  setDiceRollPressTime: (time: number | null) => void;
}

const initialSet = diceSets[0];
const initialDiceCounts = getDiceCountsFromSet(initialSet);
const initialDiceById = getDiceByIdFromSet(initialSet);

export const useDiceControlsStore = create<DiceControlsState>()(
  immer((set) => ({
    diceSet: initialSet,
    diceById: initialDiceById,
    defaultDiceCounts: initialDiceCounts,
    diceCounts: initialDiceCounts,
    diceBonus: 0,
    diceAdvantage: null,
    diceHidden: false,
    rollSpecifier: "3d6-2",
    diceRollPressTime: null,
    changeDiceSet(diceSet) {
      set((state) => {
        const counts: DiceCounts = {};
        const prevCounts = state.diceCounts;
        const prevDice = state.diceSet.dice;
        for (let i = 0; i < diceSet.dice.length; i++) {
          const die = diceSet.dice[i];
          const prevDie = prevDice[i];
          // Carry over count if the index and die type match
          if (prevDie && prevDie.type === die.type) {
            counts[die.id] = prevCounts[prevDie.id] || 0;
          } else {
            counts[die.id] = 0;
          }
        }
        state.diceCounts = counts;
        state.diceSet = diceSet;
        state.defaultDiceCounts = getDiceCountsFromSet(diceSet);
        state.diceById = getDiceByIdFromSet(diceSet);
      });
    },
    resetDiceCounts() {
      console.log("resetDiceCounts");
      set((state) => {
        state.diceCounts = state.defaultDiceCounts;
      });
    },
    changeDieCount(id, count) {
      console.log("changeDieCount", id, count);
      set((state) => {
        if (id in state.diceCounts) {
          state.diceCounts[id] = count;
        }
      });
    },
    incrementDieCount(id) {
      console.log("incrementDieCount", id);
      set((state) => {
        if (id in state.diceCounts) {
          state.diceCounts[id] += 1;
        } else {
          console.log("incrementDieCount: id not found", id);
          console.log("state.diceCounts", state.diceCounts);
        }
      });
    },
    decrementDieCount(id) {
      console.log("decrementDieCount", id);
      set((state) => {
        if (id in state.diceCounts) {
          state.diceCounts[id] -= 1;
        }
      });
    },
    setDiceBonus(bonus) {
      console.log("setDiceBonus", bonus);
      set((state) => {
        state.diceBonus = bonus;
      });
    },
    setDiceAdvantage(advantage) {
      console.log("setDiceAdvantage", advantage);
      set((state) => {
        state.diceAdvantage = advantage;
      });
    },
    toggleDiceHidden() {
      console.log("toggleDiceHidden");
      set((state) => {
        state.diceHidden = !state.diceHidden;
      });
    },
    setRollSpecifier(specifier) {
      console.log("setRollSpecifier", specifier);
      set((state) => {
        state.rollSpecifier = specifier;
      });
    },
    // specifyRoll(specifier) {
    //   console.log("specifyRoll", specifier);
    //   set((state) => {
    //     // TODO: Validate specifier
    //     // add a 3d6 with a -2 bonus
    //     console.log("store: specifyRoll", specifier);
    //     if (state.roll) state.clearRoll();

    //     state.changeDiceSet(diceSets[0]);
    //     // find a die in diceSet that matches the specifier (number of sides is 6)  
    //     for (const die of state.diceSet.dice) {
    //       if (die.type === "D6") {
    //         state.incrementDieCount(die.id);
    //         state.incrementDieCount(die.id);
    //         state.incrementDieCount(die.id);
    //         break;
    //       }
    //     }
    //     // state.changeDieCount("D6", 3);
    //     state.setDiceBonus(-2);
    //   });
    // },
    setDiceRollPressTime(time) {
      console.log("setDiceRollPressTime", time);
      set((state) => {
        state.diceRollPressTime = time;
      });
    },
  }))
);

function getDiceCountsFromSet(diceSet: DiceSet) {
  const counts: Record<string, number> = {};
  for (const die of diceSet.dice) {
    counts[die.id] = 0;
  }
  return counts;
}

function getDiceByIdFromSet(diceSet: DiceSet) {
  const byId: Record<string, Die> = {};
  for (const die of diceSet.dice) {
    byId[die.id] = die;
  }
  return byId;
}

/** Generate new dice based off of a set of counts, advantage and die */
export function getDiceToRoll(
  counts: DiceCounts,
  advantage: Advantage,
  diceById: Record<string, Die>
) {
  const dice: (Die | Dice)[] = [];
  const countEntries = Object.entries(counts);
  for (const [id, count] of countEntries) {
    const die = diceById[id];
    if (!die) {
      continue;
    }
    const { style, type } = die;
    for (let i = 0; i < count; i++) {
      if (advantage === null) {
        if (type === "D100") {
          // Push a d100 and d10 when rolling a d100
          dice.push({
            dice: [
              { id: generateDiceId(), style, type: "D100" },
              { id: generateDiceId(), style, type: "D10" },
            ],
          });
        } else {
          dice.push({ id: generateDiceId(), style, type });
        }
      } else {
        // Rolling with advantage or disadvantage
        const combination = advantage === "ADVANTAGE" ? "HIGHEST" : "LOWEST";
        if (type === "D100") {
          // Push 2 d100s and d10s
          dice.push({
            dice: [
              {
                dice: [
                  { id: generateDiceId(), style, type: "D100" },
                  { id: generateDiceId(), style, type: "D10" },
                ],
              },
              {
                dice: [
                  { id: generateDiceId(), style, type: "D100" },
                  { id: generateDiceId(), style, type: "D10" },
                ],
              },
            ],
            combination,
          });
        } else {
          dice.push({
            dice: [
              { id: generateDiceId(), style, type },
              { id: generateDiceId(), style, type },
            ],
            combination,
          });
        }
      }
    }
  }
  return dice;
}
