import { useEffect, useState } from 'react';

// Performs updates from Properties but accomodates updates from Canvas.
export default (set, property, onChange) => {
  const [value, setValue] = useState(set[property]);
  const [changing, setChanging] = useState();
  if (!changing && set[property] !== value) setValue(set[property]);
  useEffect(() => {
    if (set[property] !== value) {
      // lazily update, so we don't slow down typing
      const timer = setTimeout(() => {
        setChanging(false);
        const nextSet = JSON.parse(JSON.stringify(set));
        nextSet[property] = value;
        onChange(nextSet);
      }, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [onChange, property, set, value]);
  return [
    value,
    (nextValue) => {
      setChanging(true);
      setValue(nextValue);
    },
  ];
};
