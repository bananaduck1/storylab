"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { useEffect } from "react";

interface Props {
  value: string;
  onChange: (html: string) => void;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault(); // prevent editor blur
        onClick();
      }}
      disabled={disabled}
      title={title}
      className={`px-2 py-1 rounded text-sm transition-colors ${
        active
          ? "bg-zinc-900 text-white"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
      } disabled:opacity-30`}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Placeholder.configure({
        placeholder: "Start writing — or paste from Google Docs or Word…",
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
    ],
    content: value || "",
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "focus:outline-none",
      },
    },
  });

  // Sync external value changes (e.g. loading an existing post)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function setLink() {
    const prev = editor?.getAttributes("link").href ?? "";
    const url = window.prompt("URL", prev);
    if (url === null) return;
    if (url === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  }

  if (!editor) return null;

  return (
    <div className="flex flex-col border border-zinc-200 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-zinc-200 px-2 py-1.5 bg-zinc-50">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic"
        >
          <em>I</em>
        </ToolbarButton>

        <span className="w-px h-4 bg-zinc-300 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          title="Heading 3"
        >
          H3
        </ToolbarButton>

        <span className="w-px h-4 bg-zinc-300 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet list"
        >
          • List
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Numbered list"
        >
          1. List
        </ToolbarButton>

        <span className="w-px h-4 bg-zinc-300 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Blockquote"
        >
          ❝
        </ToolbarButton>
        <ToolbarButton
          onClick={setLink}
          active={editor.isActive("link")}
          title="Link"
        >
          Link
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          title="Clear formatting"
        >
          Clear
        </ToolbarButton>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />
    </div>
  );
}
