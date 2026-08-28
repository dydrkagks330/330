'use client';

// 리치 텍스트 에디터 (TipTap) — 프로필 탭 등 HTML 콘텐츠 작성용
import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';

import { putBlob } from '@/lib/blobStore';
import { useToast } from '@/components/ui/Toast';

/** 로컬 모드용 — 파일을 그대로 본문에 심는다 (서버가 없어 올릴 곳이 없을 때) */
function toDataUrl(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();

    r.onload = () => res(String(r.result));
    r.onerror = () => rej(r.error);

    r.readAsDataURL(f);
  });
}

function TBtn({
  on,
  label,
  title,
  onClick,
}: {
  on?: boolean;
  label: React.ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-tip={title}
      className={`re-btn ${on ? 'on' : ''}`}
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export function RichEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const toast = useToast();

  const fileRef = useRef<HTMLInputElement>(null);
  const colorRef = useRef<HTMLInputElement>(null);

  // 색상 선택창을 여는 순간 에디터의 선택 영역이 사라지는 것을 방지하기 위해
  // 현재 selection의 from / to 위치를 저장한다.
  const savedSelectionRef = useRef<{
    from: number;
    to: number;
  } | null>(null);

  const [busy, setBusy] = useState(false);
  const [textColor, setTextColor] = useState('#1a0f0f');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      TextStyle,
      Color,
    ],

    content: value || '<p></p>',

    immediatelyRender: false,

    parseOptions: {
      preserveWhitespace: 'full',
    },

    editorProps: {
      attributes: {
        class: 're-content prose',
      },
    },

    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;

    // 이스케이프된 HTML 태그 문자열이 강제로 넘어온 경우 정상 HTML로 복원
    let cleanValue = value || '<p></p>';

    if (
      cleanValue.includes('&lt;span') ||
      cleanValue.includes('&lt;/span&gt;')
    ) {
      const txt = document.createElement('textarea');

      txt.innerHTML = cleanValue;
      cleanValue = txt.value;
    }

    if (
      cleanValue !== editor.getHTML() &&
      !editor.isFocused
    ) {
      editor.commands.setContent(cleanValue, {
        emitUpdate: false,
      });
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div
        className="re-wrap"
        style={{ minHeight: 200 }}
      />
    );
  }

  const insertImage = async (f?: File) => {
    if (!f) return;

    setBusy(true);

    try {
      const ref = await putBlob(f);
      const src = /^https?:/.test(ref)
        ? ref
        : await toDataUrl(f);

      editor
        .chain()
        .focus()
        .setImage({ src })
        .run();
    } catch (e) {
      toast(
        `이미지를 올리지 못했습니다 — ${
          e instanceof Error ? e.message : String(e)
        }`
      );
    }

    setBusy(false);
  };

  /**
   * 색상 버튼을 누르기 직전에 현재 선택 영역을 저장한다.
   *
   * 브라우저의 <input type="color">가 포커스를 가져가면서
   * TipTap의 selection이 사라질 수 있기 때문에 반드시
   * color picker를 열기 전에 저장해야 한다.
   */
  const openColorPicker = () => {
    const { from, to } = editor.state.selection;

    savedSelectionRef.current = {
      from,
      to,
    };

    colorRef.current?.click();
  };

  /**
   * 색상을 선택했을 때 저장해둔 selection을 다시 복구한 뒤
   * 해당 영역에만 색상을 적용한다.
   */
  const handleColorChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newColor = e.target.value;

    setTextColor(newColor);

    const savedSelection = savedSelectionRef.current;

    if (savedSelection) {
      editor
        .chain()
        .focus()
        .setTextSelection(
          savedSelection.from,
          savedSelection.to
        )
        .setColor(newColor)
        .run();
    } else {
      editor
        .chain()
        .focus()
        .setColor(newColor)
        .run();
    }
  };

  return (
    <div className="re-wrap">
      <div className="re-toolbar">

        <TBtn
          title="굵게"
          label={<b>B</b>}
          on={editor.isActive('bold')}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleBold()
              .run()
          }
        />

        <TBtn
          title="기울임"
          label={<i>I</i>}
          on={editor.isActive('italic')}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleItalic()
              .run()
          }
        />

        <TBtn
          title="취소선"
          label={<s>S</s>}
          on={editor.isActive('strike')}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleStrike()
              .run()
          }
        />

        {/* 색상 선택 버튼 */}
        <span className="re-sep" />

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          <TBtn
            title="글자 색상"
            label={
              <span
                style={{
                  color: textColor,
                  fontWeight: 'bold',
                }}
              >
                A
              </span>
            }
            onClick={openColorPicker}
          />

          <input
            ref={colorRef}
            type="color"
            value={textColor}
            onChange={handleColorChange}
            style={{
              position: 'absolute',
              opacity: 0,
              width: 0,
              height: 0,
              pointerEvents: 'none',
            }}
          />
        </div>

        <span className="re-sep" />

        <TBtn
          title="제목"
          label="H2"
          on={editor.isActive('heading', {
            level: 2,
          })}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({ level: 2 })
              .run()
          }
        />

        <TBtn
          title="소제목"
          label="H3"
          on={editor.isActive('heading', {
            level: 3,
          })}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({ level: 3 })
              .run()
          }
        />

        <span className="re-sep" />

        <TBtn
          title="글머리 목록"
          label="•≡"
          on={editor.isActive('bulletList')}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleBulletList()
              .run()
          }
        />

        <TBtn
          title="번호 목록"
          label="1≡"
          on={editor.isActive('orderedList')}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleOrderedList()
              .run()
          }
        />

        <TBtn
          title="인용"
          label="❝"
          on={editor.isActive('blockquote')}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleBlockquote()
              .run()
          }
        />

        <TBtn
          title="구분선"
          label="—"
          onClick={() =>
            editor
              .chain()
              .focus()
              .setHorizontalRule()
              .run()
          }
        />

        <span className="re-sep" />

        <TBtn
          title={busy ? '올리는 중…' : '이미지 올리기'}
          label={busy ? '⏳' : '🖼'}
          onClick={() => {
            if (!busy) {
              fileRef.current?.click();
            }
          }}
        />

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => {
            const f = e.target.files?.[0];

            e.target.value = '';

            void insertImage(f);
          }}
        />

        <span className="re-sep re-hide-m" />

        <span
          className="re-hide-m"
          style={{ display: 'contents' }}
        >
          <TBtn
            title="실행 취소"
            label="↶"
            onClick={() =>
              editor
                .chain()
                .focus()
                .undo()
                .run()
            }
          />

          <TBtn
            title="다시 실행"
            label="↷"
            onClick={() =>
              editor
                .chain()
                .focus()
                .redo()
                .run()
            }
          />
        </span>
      </div>

      <div className="re-body">
        <EditorContent editor={editor} />

        {placeholder && editor.isEmpty && (
          <div className="re-ph">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}
