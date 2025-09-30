import {useEffect, useState} from 'react';

const useDebouncedValue = (initialValue, delayMs = 500) => {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return {
    debouncedValue,
    setValue,
    value,
  };
};

export default useDebouncedValue;
