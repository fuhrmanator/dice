import { useEffect, useState } from "react";

import Input from "@mui/material/Input";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { ListItemSecondaryAction, Stack, IconButton } from "@mui/material";
import InputOutlined from "@mui/icons-material/InputOutlined";
import { useDiceControlsStore } from "./store";
import { useDiceRollStore } from "../dice/store";
// use a peggy.js parser to parse the specifier string
import * as peggy from "peggy";

type RollSpecifierProps = {
  specifier: string;
  closeMenu: () => void;
  onChange: (specifier: string) => void;
};

// the grammar for the roll specifier
const diceRollGrammar = `{
  function parseRoll(rolls, sides, modifier) {
    var total = 0;
    var theRolls = [];
    var resultObject = {sides: parseInt(sides), modifier: modifier, rolls: theRolls};
    for (var i = 0; i < rolls; i++) {
      const roll = Math.floor(Math.random() * sides) + 1;
      theRolls.push(roll);
      total += roll;
    }
    resultObject.total = total + modifier;
    return resultObject;
  }
}

start = dice_roll

dice_roll
  = _ rolls:number _ "d"i _ sides:dice_sides _ modifier:modifier? _
    { return parseRoll(rolls, sides, modifier || 0); }

dice_sides
  = "2" / "4" / "6" / "8" / "10" / "12" / "20"

modifier
  = "+" _ n:number
    { return n; }
  / "-" _ n:number
    { return -n; }

number "number"
  = digits:[0-9]+
    { return parseInt(digits.join(''), 10); }

_ "whitespace"
  = [ \\t\\r\\n]*
`;

// build a parser from the grammar in DiceRollGrammar.pegjs
const parser = peggy.generate(diceRollGrammar);

export function RollSpecifier({
  specifier,
  closeMenu,
  onChange,
}: RollSpecifierProps) {
  const [specifierString, setSpecifierString] = useState(`${specifier}`);
  const setBonus = useDiceControlsStore((state) => state.setDiceBonus);
  const incrementDieCount = useDiceControlsStore((state) => state.incrementDieCount);
  const resetDiceCounts = useDiceControlsStore((state) => state.resetDiceCounts);
  const clearRoll = useDiceRollStore((state) => state.clearRoll);
  const roll = useDiceRollStore((state) => state.roll);
  function clearRollIfNeeded() {
    if (roll) {
      clearRoll();
    }
  }

  useEffect(() => {
    setSpecifierString(`${specifier}`);
  }, [specifier]);

  return (
    <ListItem disablePadding>
      <ListItemButton sx={{ cursor: "inherit" }}>
        <ListItemIcon sx={{ minWidth: "38px", justifyContent: "center" }}>
          Quick roll specifier:
        </ListItemIcon>
        <ListItemText sx={{ marginRight: "88px" }}>
          <Input
            disableUnderline
            inputProps={{
              sx: {
                textAlign: "center",
              },
            }}
            value={specifierString}
            onChange={(e) => {
              setSpecifierString(e.target.value);
              const newSpecifier = e.target.value;
              onChange(newSpecifier);
            }}
            onBlur={(e) => {
              const currentSpecifier = e.target.value;
              if (!currentSpecifier) {
                onChange("3d6-2");
                setSpecifierString("3d6-2");
              }
            }}
            fullWidth
          />
        </ListItemText>
        <ListItemSecondaryAction>
          <Stack gap={1} direction="row">
            <IconButton
              aria-label="specify roll parameters"
              onClick={() => {
                const rollSpec = parser.parse(specifier);
                clearRollIfNeeded();
                resetDiceCounts();
                for (let i = 0; i < rollSpec.rolls.length; i++) {
                  incrementDieCount(`GALAXY_STANDARD_D${rollSpec.sides}`);
                }
                setBonus(rollSpec.modifier);
                closeMenu();
              }}
            >
              <InputOutlined />
            </IconButton>
          </Stack>
        </ListItemSecondaryAction>
      </ListItemButton>
    </ListItem>
  );
}
