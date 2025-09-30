import {CKEditor} from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import {unescapeHtml} from '../../utils/string';
import {useRef} from 'react';

const RichTextEditor = ({defaultValue, onChange}) => {
  const ref = useRef();
  return (
    <CKEditor
      editor={ClassicEditor}
      data={unescapeHtml(defaultValue)}
      onReady={editor => {
        ref.current = editor;
      }}
      onChange={event => {
        const html = ref.current?.data.get();
        onChange(html);
      }}
      // onBlur={(event, editor) => {
      //   console.log('Blur.', editor);
      // }}
      // onFocus={(event, editor) => {
      //   console.log('Focus.', editor);
      // }}
    />
  );
};

export default RichTextEditor;
