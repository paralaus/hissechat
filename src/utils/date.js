import {format} from 'date-fns';

export const formatDate = (date, formatStr = 'dd/MM/yyyy HH:mm') => {
  if (!date) return '';
  return format(date, formatStr);
};
