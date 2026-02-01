import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
    content: string;
    role: 'user' | 'assistant' | 'system';
}

export function MarkdownRenderer({ content, role }: MarkdownRendererProps) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            className={`prose text-sm max-w-none 
        ${role === 'user' ? 'prose-invert text-white' : 'text-slate-800'}
        prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0
        prose-headings:text-inherit prose-headings:font-semibold prose-headings:my-2
        prose-a:text-inherit prose-a:underline prose-a:font-medium
        prose-code:bg-black/10 prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none
      `}
            components={{
                a: ({ node, ...props }) => <a target="_blank" rel="noreferrer" {...props} />
            }}
        >
            {content}
        </ReactMarkdown>
    );
}
