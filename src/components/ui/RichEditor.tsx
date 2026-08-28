'use client';
import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';

interface RichEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export function RichEditor({ value, onChange, placeholder }: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: true }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className="rich-editor-wrap" style={{ border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
      {/* 툴바 */}
      <div className="rich-toolbar" style={{ display: 'flex', gap: 4, padding: '8px 12px', background: 'var(--bg-sub)', borderBottom: '1px solid var(--line)', flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''} style={{ fontWeight: 'bold' }}>B</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''} style={{ fontStyle: 'italic' }}>I</button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'is-active' : ''} style={{ textDecoration: 'line-through' }}>S</button>
        <span style={{ color: 'var(--line)', margin: '0 4px' }}>|</span>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}>H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}>H3</button>
        <span style={{ color: 'var(--line)', margin: '0 4px' }}>|</span>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''}>• List</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''}>1. List</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'is-active' : ''}>“ Quote</button>
        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()}>— HR</button>
        <span style={{ color: 'var(--line)', margin: '0 4px' }}>|</span>
        <button type="button" onClick={() => {
          const url = window.prompt('이미지 URL을 입력하세요');
          if (url) editor.chain().focus().setImage({ src: url }).run();
        }}>🖼 Image</button>
        <span style={{ color: 'var(--line)', margin: '0 4px' }}>|</span>
        <button type="button" onClick={() => editor.chain().focus().undo().run()}>↩ Undo</button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()}>↪ Redo</button>
      </div>
      {/* 본문 입력창 */}
      <div style={{ padding: 14, minHeight: 220 }}>
        <EditorContent editor={editor} placeholder={placeholder} />
      </div>
    </div>
  );
}
