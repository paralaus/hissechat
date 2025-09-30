import React from 'react';
import {FormControl, FormLabel, Input} from '@chakra-ui/react';

const ReadOnlyInfo = ({label, value, visible = true}) => {
  if (!visible) return null;
  return (
    <FormControl mb="4">
      <FormLabel display="flex" fontSize="sm" fontWeight="500" mb="8px">
        {label}
      </FormLabel>
      <Input
        fontSize="sm"
        fontWeight="500"
        size="md"
        readOnly
        defaultValue={value}
      />
    </FormControl>
  );
};

export default ReadOnlyInfo;
