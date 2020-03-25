import { useEffect, useState } from 'react';

// Performs updates from Properties but accomodates updates from Canvas.
export default (set, property, onChange) => {
  const [value, setValue] = useState(set[property]);
  useEffect(() => {
    // lazily update, so we don't slow down typing
    const timer = setTimeout(() => {
      const nextSet = JSON.parse(JSON.stringify(set));
      nextSet[property] = value;
      onChange(nextSet);
    }, 1000);
    return () => clearTimeout(timer);
  }, [onChange, property, set, value]);
  return [value, (nextValue) => setValue(nextValue)];
};
