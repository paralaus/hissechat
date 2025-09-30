import {useEffect, useState} from 'react';

const useDisclosure = (
  initialState = false,
  {onOpen, onClose} = {
    onOpen: undefined,
    onClose: undefined,
  },
) => {
  const [isOpen, setIsOpen] = useState(initialState);
  const [variable, setVariable] = useState(null);

  useEffect(() => {
    if (isOpen !== initialState) {
      setIsOpen(initialState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialState]);

  const open = variable => {
    setIsOpen(true);
    if (variable) setVariable(variable);
    if (typeof onOpen === 'function') {
      onOpen();
    }
  };

  const close = () => {
    setIsOpen(false);
    setVariable(null);
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const toggle = () => (isOpen ? close() : open());

  return {isOpen, open, close, toggle, variable};
};

export default useDisclosure;
