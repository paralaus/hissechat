import React from 'react';

const Condition = ({condition, children, defaultComponent}) => {
  return <>{condition ? children : defaultComponent || null}</>;
};

export default Condition;
