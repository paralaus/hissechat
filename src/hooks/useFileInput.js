import {useMemo, useRef, useState} from 'react';
import {useMutation} from '@tanstack/react-query';
import {uploadFile} from '../api/api';

const useFileInput = ({accept} = {}) => {
  const ref = useRef();
  const [selected, setSelected] = useState(null);

  const {mutateAsync, isPending: isUploading} = useMutation({
    mutationFn: file => uploadFile(file),
  });

  const upload = async () => {
    if (!selected) return false;
    try {
      const {data} = await mutateAsync(selected[0]);
      if (data?.url) return data.url;
      return false;
    } catch (e) {
      console.log(e);
      return false;
    }
  };

  const input = useMemo(() => {
    return (
      <input
        ref={ref}
        type="file"
        name="file"
        accept={accept}
        hidden
        onChange={event => {
          setSelected(event.target.files);
        }}
      />
    );
  }, []);

  const open = () => {
    ref.current?.click?.();
  };

  const reset = () => {
    setSelected(null);
  };

  return {
    input,
    open,
    file: selected?.[0],
    files: selected,
    upload,
    isUploading,
    objectUrl: selected ? URL.createObjectURL(selected[0]) : null,
    reset,
  };
};

export default useFileInput;
